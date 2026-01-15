import net from "node:net"
import { EventEmitter } from "events"
import { existsSync } from "fs"
import { unlink } from "fs/promises"
import { debugLog } from "./debug"
import { SOCKET_PATH, serializeMessage, type ClientMessage, type ServerMessage } from "./ipc"
import type { AppEntry } from "../types"

const CONNECT_RETRIES = 20
const CONNECT_DELAY_MS = 100

export class SessionClient extends EventEmitter {
  private socket: net.Socket
  private buffer = ""

  constructor(socket: net.Socket) {
    super()
    this.socket = socket
    this.socket.setEncoding("utf8")
    this.socket.on("data", (data) =>
      this.handleData(typeof data === "string" ? data : data.toString())
    )
    this.socket.on("close", () => this.emit("disconnect"))
    this.socket.on("error", () => this.emit("disconnect"))
  }

  private handleData(data: string) {
    this.buffer += data
    let newlineIndex = this.buffer.indexOf("\n")
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim()
      this.buffer = this.buffer.slice(newlineIndex + 1)
      newlineIndex = this.buffer.indexOf("\n")
      if (!line) {
        continue
      }
      try {
        const message = JSON.parse(line) as ServerMessage
        if (message.type === "error") {
          debugLog(`[client] Server error: ${message.message}`)
          return
        }
        this.emit(message.type, message)
      } catch (error) {
        debugLog(`[client] Failed to parse message: ${error}`)
      }
    }
  }

  private send(message: ClientMessage) {
    if (this.socket.destroyed) {
      return
    }
    this.socket.write(serializeMessage(message))
  }

  start(entry: AppEntry) {
    this.send({ type: "start", entry })
  }

  stop(id: string) {
    this.send({ type: "stop", id })
  }

  stopAll() {
    this.send({ type: "stop_all" })
  }

  restart(entry: AppEntry) {
    this.send({ type: "restart", entry })
  }

  sendInput(id: string, data: string) {
    this.send({ type: "input", id, data })
  }

  resize(cols: number, rows: number) {
    this.send({ type: "resize", cols, rows })
  }

  setActiveTab(id: string | null) {
    this.send({ type: "set_active", id })
  }

  updateEntry(id: string, updates: Partial<AppEntry>) {
    this.send({ type: "update_entry", id, updates })
  }

  shutdown() {
    this.send({ type: "shutdown" })
    this.disconnect()
  }

  disconnect() {
    this.socket.end()
  }
}

async function connectSocket(): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(SOCKET_PATH, () => resolve(socket))
    socket.once("error", (error) => {
      socket.destroy()
      reject(error)
    })
  })
}

async function spawnServerProcess(): Promise<void> {
  const argv = process.argv[1]
  const isScript = Boolean(argv && /\.(tsx|ts|js)$/.test(argv))
  const args = isScript ? [argv, "--server"] : ["--server"]

  const proc = Bun.spawn([process.execPath, ...args], {
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
    env: process.env,
    cwd: process.cwd(),
  })

  if (proc.unref) {
    proc.unref()
  }
}

async function waitForServer(): Promise<net.Socket> {
  let lastError: unknown
  for (let attempt = 0; attempt < CONNECT_RETRIES; attempt += 1) {
    try {
      return await connectSocket()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, CONNECT_DELAY_MS))
    }
  }

  throw lastError
}

async function clearStaleSocket(error: unknown) {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  if (code !== "ECONNREFUSED" && code !== "ENOENT") {
    return
  }

  if (!existsSync(SOCKET_PATH)) {
    return
  }

  try {
    await unlink(SOCKET_PATH)
  } catch (unlinkError) {
    debugLog(`[client] Failed to remove stale socket: ${unlinkError}`)
  }
}

export async function connectSessionClient(): Promise<SessionClient> {
  try {
    const socket = await connectSocket()
    return new SessionClient(socket)
  } catch (error) {
    await clearStaleSocket(error)
    await spawnServerProcess()
    const socket = await waitForServer()
    return new SessionClient(socket)
  }
}

export async function shutdownSessionServer(): Promise<boolean> {
  try {
    const socket = await connectSocket()
    const client = new SessionClient(socket)
    client.shutdown()
    return true
  } catch (error) {
    await clearStaleSocket(error)
    const code = (error as NodeJS.ErrnoException | undefined)?.code
    if (code === "ENOENT" || code === "ECONNREFUSED") {
      return false
    }
    throw error
  }
}
