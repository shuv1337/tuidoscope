import net from "node:net"
import { existsSync, unlinkSync } from "fs"
import { unlink } from "fs/promises"
import { loadConfig } from "./config"
import { clearSession, initSessionPath, restoreSession, saveSession } from "./session"
import { spawnPty, killPty, resizePty, type PtyProcess } from "./pty"
import { debugLog } from "./debug"
import { ensureSocketDir, SOCKET_PATH, serializeMessage, type ClientMessage, type RunningAppSnapshot, type ServerMessage } from "./ipc"
import type { AppEntry, AppEntryConfig, AppStatus, SessionAppRef } from "../types"
import { generateId } from "./id"

const MAX_BUFFER_CHARS = 200_000

interface ServerRunningApp {
  entry: AppEntry
  restartEntry: AppEntry
  pty: PtyProcess
  status: AppStatus
  buffer: string
  runId: number
}

interface PendingOutput {
  data: string
  flushTimer: ReturnType<typeof setTimeout> | null
}

function configToEntry(config: AppEntryConfig): AppEntry {
  return {
    id: config.id ?? generateId(),
    name: config.name,
    command: config.command,
    args: config.args,
    cwd: config.cwd,
    env: config.env,
    autostart: config.autostart ?? false,
    restartOnExit: config.restart_on_exit ?? false,
  }
}

function buildSnapshot(app: ServerRunningApp): RunningAppSnapshot {
  return {
    entry: app.entry,
    status: app.status,
    buffer: app.buffer,
    runId: app.runId,
  }
}

function resolveSessionEntry(ref: string | SessionAppRef, entries: AppEntry[]): AppEntry | undefined {
  const id = typeof ref === "string" ? ref : ref.id
  const direct = entries.find((entry) => entry.id === id)
  if (direct) {
    return direct
  }

  if (typeof ref === "string") {
    return undefined
  }

  const matchesArgs = (candidate?: string, incoming?: string) => (candidate ?? "") === (incoming ?? "")

  return entries.find(
    (entry) =>
      entry.name === ref.name &&
      entry.command === ref.command &&
      matchesArgs(entry.args, ref.args) &&
      entry.cwd === ref.cwd
  )
}

export async function startSessionServer(): Promise<void> {
  const { config } = await loadConfig()
  initSessionPath(config)

  const entries = config.apps.map(configToEntry)
  const runningApps = new Map<string, ServerRunningApp>()
  const pendingOutputs = new Map<string, PendingOutput>()
  const clients = new Set<net.Socket>()
  const manualStopRuns = new Set<number>()
  let nextRunId = 1
  let activeTabId: string | null = null
  let lastCols = 80
  let lastRows = 24
  let server!: net.Server
  let suppressSessionUpdates = false
  let persistTimer: ReturnType<typeof setTimeout> | null = null
  let persistPromise: Promise<void> | null = null
  let shuttingDown = false

  const persistSession = async () => {
    if (!config.session.persist) {
      return
    }

    if (persistPromise) {
      await persistPromise
      return
    }

    const runningRefs = Array.from(runningApps.values()).map((app) => ({
      id: app.entry.id,
      name: app.entry.name,
      command: app.entry.command,
      args: app.entry.args,
      cwd: app.entry.cwd,
    }))

    const activeApp = activeTabId ? runningApps.get(activeTabId) : undefined
    const activeRef = activeApp
      ? {
          id: activeApp.entry.id,
          name: activeApp.entry.name,
          command: activeApp.entry.command,
          args: activeApp.entry.args,
          cwd: activeApp.entry.cwd,
        }
      : null

    persistPromise = (async () => {
      try {
        await saveSession({
          runningApps: runningRefs,
          activeTab: activeRef,
          timestamp: Date.now(),
        })
      } catch (error) {
        debugLog(`[server] Failed to save session: ${error}`)
      }
    })()

    try {
      await persistPromise
    } finally {
      persistPromise = null
    }
  }

  const persistIfNeeded = () => {
    if (suppressSessionUpdates || shuttingDown || !config.session.persist) {
      return
    }

    // Debounce frequent updates (output/status changes, tab changes, etc.) into fewer disk writes.
    if (persistTimer) {
      return
    }

    persistTimer = setTimeout(() => {
      persistTimer = null
      void persistSession()
    }, 100)
  }

  const broadcast = (message: ServerMessage) => {
    const payload = serializeMessage(message)
    for (const client of clients) {
      if (!client.destroyed) {
        client.write(payload)
      }
    }
  }

  const flushOutput = (id: string) => {
    const pending = pendingOutputs.get(id)
    if (!pending || pending.data.length === 0) {
      if (pending) {
        pending.flushTimer = null
      }
      return
    }

    const chunk = pending.data
    pending.data = ""
    pending.flushTimer = null

    const app = runningApps.get(id)
    if (app) {
      app.buffer = (app.buffer + chunk).slice(-MAX_BUFFER_CHARS)
    }

    broadcast({ type: "output", id, data: chunk })
  }

  const updateActiveTab = (id: string | null) => {
    activeTabId = id
    broadcast({ type: "active", id })
    persistIfNeeded()
  }

  const startApp = (entry: AppEntry) => {
    if (runningApps.has(entry.id)) {
      return
    }

    const ptyProcess = spawnPty(entry, { cols: lastCols, rows: lastRows })
    const runId = nextRunId++

    const app: ServerRunningApp = {
      entry,
      restartEntry: entry,
      pty: ptyProcess,
      status: "running",
      buffer: "",
      runId,
    }

    runningApps.set(entry.id, app)
    pendingOutputs.set(entry.id, { data: "", flushTimer: null })

    ptyProcess.onData((data) => {
      const pending = pendingOutputs.get(entry.id)
      if (!pending) {
        return
      }
      pending.data += data
      if (!pending.flushTimer) {
        pending.flushTimer = setTimeout(() => flushOutput(entry.id), 50)
      }
    })

    ptyProcess.onExit(({ exitCode }) => {
      flushOutput(entry.id)
      const wasManualStop = manualStopRuns.has(runId)
      if (wasManualStop) {
        manualStopRuns.delete(runId)
      }

      const current = runningApps.get(entry.id)
      if (current) {
        current.status = exitCode === 0 ? "stopped" : "error"
        broadcast({ type: "status", id: entry.id, status: current.status })
      }

      if (!wasManualStop && app.restartEntry.restartOnExit && exitCode !== 0) {
        setTimeout(() => startApp(app.restartEntry), 1000)
      }
    })

    broadcast({ type: "started", app: buildSnapshot(app) })
    updateActiveTab(entry.id)
    persistIfNeeded()
  }

  const stopApp = (id: string) => {
    const app = runningApps.get(id)
    if (!app) {
      return
    }

    manualStopRuns.add(app.runId)
    killPty(app.pty)
    runningApps.delete(id)
    pendingOutputs.delete(id)
    broadcast({ type: "stopped", id })
    persistIfNeeded()
  }

  const stopAllApps = () => {
    const ids = Array.from(runningApps.keys())
    for (const id of ids) {
      stopApp(id)
    }
    updateActiveTab(null)
  }

  const restartApp = (entry: AppEntry) => {
    const app = runningApps.get(entry.id)
    if (!app) {
      return
    }

    stopApp(entry.id)
    setTimeout(() => startApp(entry), 500)
  }

  const resizeAll = (cols: number, rows: number) => {
    lastCols = cols
    lastRows = rows

    for (const [, app] of runningApps) {
      if (app.status === "running") {
        resizePty(app.pty, cols, rows)
      }
    }
  }

  const updateEntry = (id: string, updates: Partial<AppEntry>) => {
    const app = runningApps.get(id)
    if (!app) {
      return
    }
    app.entry = { ...app.entry, ...updates }
    broadcast({ type: "started", app: buildSnapshot(app) })
    persistIfNeeded()
  }

  const shutdown = async (options?: { clearSession?: boolean }) => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true

    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }

    if (options?.clearSession) {
      if (persistPromise) {
        await persistPromise
      }
      try {
        await clearSession()
      } catch (error) {
        debugLog(`[server] Failed to clear session: ${error}`)
      }
    } else {
      await persistSession()
    }
    suppressSessionUpdates = true
    stopAllApps()
    for (const client of clients) {
      client.end()
    }

    await new Promise<void>((resolve) => server.close(() => resolve()))

    // Best-effort cleanup so subsequent clients don't trip over stale socket paths.
    try {
      if (existsSync(SOCKET_PATH)) {
        await unlink(SOCKET_PATH)
      }
    } catch (error) {
      debugLog(`[server] Failed to remove socket on shutdown: ${error}`)
    }

    process.exit(0)
  }

  const handleMessage = (message: ClientMessage) => {
    switch (message.type) {
      case "start":
        startApp(message.entry)
        break
      case "stop":
        stopApp(message.id)
        break
      case "stop_all":
        stopAllApps()
        break
      case "restart":
        restartApp(message.entry)
        break
      case "input": {
        const app = runningApps.get(message.id)
        if (app) {
          app.pty.write(message.data)
        }
        break
      }
      case "resize":
        resizeAll(message.cols, message.rows)
        break
      case "set_active":
        updateActiveTab(message.id)
        break
      case "update_entry":
        updateEntry(message.id, message.updates)
        break
      case "shutdown":
        void shutdown({ clearSession: message.clearSession })
        break
      default:
        break
    }
  }

  await ensureSocketDir()

  if (existsSync(SOCKET_PATH)) {
    try {
      await unlink(SOCKET_PATH)
    } catch (error) {
      debugLog(`[server] Failed to remove stale socket: ${error}`)
    }
  }

  server = net.createServer((socket) => {
    socket.setEncoding("utf8")
    clients.add(socket)

    const snapshot: RunningAppSnapshot[] = Array.from(runningApps.values()).map(buildSnapshot)
    socket.write(serializeMessage({ type: "snapshot", runningApps: snapshot, activeTabId }))

    let buffer = ""
    socket.on("data", (data) => {
      buffer += data
      let newlineIndex = buffer.indexOf("\n")
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        newlineIndex = buffer.indexOf("\n")
        if (!line) {
          continue
        }
        try {
          const message = JSON.parse(line) as ClientMessage
          handleMessage(message)
        } catch (error) {
          socket.write(
            serializeMessage({
              type: "error",
              message: `Invalid message: ${error instanceof Error ? error.message : "parse error"}`,
            })
          )
        }
      }
    })

    socket.on("close", () => {
      clients.delete(socket)
    })

    socket.on("error", () => {
      clients.delete(socket)
    })
  })

  server.listen(SOCKET_PATH, () => {
    debugLog(`[server] Listening on ${SOCKET_PATH}`)
  })

  // If the process exits without running the async shutdown handler (hard kill/crash),
  // try to remove the socket file to avoid confusing future clients.
  process.on("exit", () => {
    try {
      if (existsSync(SOCKET_PATH)) {
        unlinkSync(SOCKET_PATH)
      }
    } catch {
      // ignore
    }
  })

  if (config.session.persist) {
    const session = await restoreSession()

    for (const entry of entries) {
      if (entry.autostart) {
        startApp(entry)
      }
    }

    if (session) {
      for (const ref of session.runningApps) {
        const entry = resolveSessionEntry(ref, entries)
        if (entry && !entry.autostart) {
          startApp(entry)
        }
      }

      if (session.activeTab) {
        const entry = resolveSessionEntry(session.activeTab, entries)
        if (entry) {
          activeTabId = entry.id
        }
      }
    }
  } else {
    for (const entry of entries) {
      if (entry.autostart) {
        startApp(entry)
      }
    }
  }

  process.on("SIGTERM", () => void shutdown())
  process.on("SIGINT", () => void shutdown())
}
