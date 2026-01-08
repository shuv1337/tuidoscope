import { Component, Show, createSignal, createEffect, onCleanup, createMemo, onMount } from "solid-js"
import { useKeyboard, useTerminalDimensions, useRenderer } from "@opentui/solid"
import { TabList } from "./components/TabList"
import { TerminalPane } from "./components/TerminalPane"
import { StatusBar } from "./components/StatusBar"
import { CommandPalette, type GlobalAction } from "./components/CommandPalette"
import { AddTabModal } from "./components/AddTabModal"
import { EditAppModal } from "./components/EditAppModal"

import { createAppsStore } from "./stores/apps"
import { createTabsStore } from "./stores/tabs"
import { createUIStore } from "./stores/ui"
import { spawnPty, killPty, resizePty } from "./lib/pty"
import { initSessionPath, saveSession } from "./lib/session"
import { saveConfig } from "./lib/config"
import { matchesKeybind } from "./lib/keybinds"
import { debugLog } from "./lib/debug"
import { getThemeById } from "./lib/themes"
import type { Config, AppEntry, AppEntryConfig, SessionData, SessionAppRef, RunningApp, ThemeConfig } from "./types"

export interface AppProps {
  config: Config
  session: SessionData | null
  configFileFound: boolean
}

export const App: Component<AppProps> = (props) => {
  const renderer = useRenderer()

  // Initialize stores
  const appsStore = createAppsStore(props.config.apps)
  const tabsStore = createTabsStore()
  const uiStore = createUIStore()



  // Get terminal dimensions from opentui
  const terminalDims = useTerminalDimensions()

  // Tab list selection (separate from active tab for keyboard navigation)
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  // Initialize session path
  initSessionPath(props.config)

  // Track if initial autostart has run
  const [hasAutostarted, setHasAutostarted] = createSignal(false)
  const [isQuitting, setIsQuitting] = createSignal(false)
  const [editingEntryId, setEditingEntryId] = createSignal<string | null>(null)
  const [lastGTime, setLastGTime] = createSignal(0)
  const [currentTheme, setCurrentTheme] = createSignal<ThemeConfig>(props.config.theme)

  const manualStopRuns = new Set<number>()
  let nextRunId = 1
  
  const buildSessionRef = (entry: AppEntry): SessionAppRef => ({
    id: entry.id,
    name: entry.name,
    command: entry.command,
    args: entry.args,
    cwd: entry.cwd,
  })

  const resolveSessionEntry = (ref: string | SessionAppRef): AppEntry | undefined => {
    const id = typeof ref === "string" ? ref : ref.id
    const direct = appsStore.getEntry(id)
    if (direct) {
      return direct
    }

    if (typeof ref === "string") {
      return undefined
    }

    const matchesArgs = (candidate?: string, incoming?: string) =>
      (candidate ?? "") === (incoming ?? "")

    return appsStore.store.entries.find(
      (entry) =>
        entry.name === ref.name &&
        entry.command === ref.command &&
        matchesArgs(entry.args, ref.args) &&
        entry.cwd === ref.cwd
    )
  }

  // Double-tap Ctrl+A detection for passthrough
  let lastCtrlATime = 0

  const getPtyDimensions = () => {
    const dims = terminalDims()
    const cols = dims.width - props.config.tab_width - 2
    const rows = dims.height - 4
    return { cols, rows }
  }

  // Start an app
  const startApp = (entry: AppEntry) => {
    // Don't start if already running
    if (tabsStore.store.runningApps.has(entry.id)) {
      return
    }

    const { cols, rows } = getPtyDimensions()

    // Don't spawn with invalid dimensions
    if (cols < 10 || rows < 3) {
      console.warn(`Skipping start for ${entry.name}: invalid dimensions ${cols}x${rows}`)
      return
    }

    const ptyProcess = spawnPty(entry, { cols, rows })

    const runId = nextRunId++
    const runningApp: RunningApp = {
      entry,
      pty: ptyProcess,
      status: "running",
      buffer: "",
      runId,
    }

    let pendingOutput = ""
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flushOutput = () => {
      if (pendingOutput.length === 0) {
        flushTimer = null
        return
      }
      tabsStore.appendToBuffer(entry.id, pendingOutput)
      pendingOutput = ""
      flushTimer = null
    }

    // Handle PTY output
    ptyProcess.onData((data) => {
      pendingOutput += data
      if (!flushTimer) {
        flushTimer = setTimeout(flushOutput, 50)
      }
    })

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode }) => {
      flushOutput()
      const wasManualStop = manualStopRuns.has(runId)
      if (wasManualStop) {
        manualStopRuns.delete(runId)
      }

      if (exitCode === 0) {
        tabsStore.updateAppStatus(entry.id, "stopped")
      } else {
        tabsStore.updateAppStatus(entry.id, "error")
      }

      // Auto-restart if configured
      if (!wasManualStop && entry.restartOnExit && exitCode !== 0) {
        setTimeout(() => startApp(entry), 1000)
      }
    })

    tabsStore.addRunningApp(runningApp)
    tabsStore.setActiveTab(entry.id)
    uiStore.showTemporaryMessage(`Started: ${entry.name}`)
  }

  // Stop an app
  const stopApp = (id: string, options: { silent?: boolean } = {}) => {
    const app = tabsStore.getRunningApp(id)
    if (app) {
      manualStopRuns.add(app.runId)
      killPty(app.pty)
      tabsStore.removeRunningApp(id)
      if (!options.silent) {
        uiStore.showTemporaryMessage(`Stopped: ${app.entry.name}`)
      }
    }
  }

  const stopAllApps = (options: { showMessage?: boolean } = {}) => {
    const runningIds = Array.from(tabsStore.store.runningApps.keys())
    if (runningIds.length === 0) {
      if (options.showMessage) {
        uiStore.showTemporaryMessage("No running apps")
      }
      return
    }

    for (const id of runningIds) {
      stopApp(id, { silent: true })
    }

    tabsStore.setActiveTab(null)

    if (options.showMessage) {
      uiStore.showTemporaryMessage(
        `Stopped ${runningIds.length} app${runningIds.length === 1 ? "" : "s"}`
      )
    }
  }

  // Restart an app
  const restartApp = (id: string) => {
    const app = tabsStore.getRunningApp(id)
    if (app) {
      stopApp(id)
      setTimeout(() => {
        const entry = appsStore.getEntry(id)
        if (entry) startApp(entry)
      }, 500)
    }
  }

  // Get app status
  const getAppStatus = (id: string) => {
    const app = tabsStore.getRunningApp(id)
    return app?.status ?? "stopped"
  }

  // Handle keyboard navigation in tab list
  const handleTabNavigation = (direction: "up" | "down") => {
    const entries = appsStore.store.entries
    if (entries.length === 0) return

    setSelectedIndex((current) => {
      if (direction === "up") {
        return Math.max(0, current - 1)
      } else {
        return Math.min(entries.length - 1, current + 1)
      }
    })

    // Update scroll offset if needed
    const tabListHeight = terminalDims().height - 1
    const visibleHeight = Math.max(1, tabListHeight - 2)
    const currentOffset = tabsStore.store.scrollOffset
    const newIndex = selectedIndex()

    if (newIndex < currentOffset) {
      tabsStore.setScrollOffset(newIndex)
    } else if (newIndex >= currentOffset + visibleHeight) {
      tabsStore.setScrollOffset(newIndex - visibleHeight + 1)
    }
  }

  // Handle app selection
  const handleSelectApp = (id: string) => {
    const entry = appsStore.getEntry(id)
    if (!entry) return

    // If not running, start it
    if (!tabsStore.store.runningApps.has(id)) {
      startApp(entry)
    } else {
      tabsStore.setActiveTab(id)
    }
  }

  const persistAppsConfig = async (): Promise<boolean> => {
    const nextApps: AppEntryConfig[] = appsStore.store.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      command: entry.command,
      args: entry.args?.trim() || undefined,
      cwd: entry.cwd,
      autostart: entry.autostart,
      restart_on_exit: entry.restartOnExit,
      env: entry.env,
    }))

    const nextConfig: Config = {
      ...props.config,
      apps: nextApps,
    }
    props.config.apps = nextApps

    try {
      await saveConfig(nextConfig)
      return true
    } catch (error) {
      console.error("Failed to save config:", error)
      return false
    }
  }

  // Theme change handler
  const handleThemeChange = async (themeId: string) => {
    const theme = getThemeById(themeId)
    if (!theme) {
      uiStore.showTemporaryMessage(`Unknown theme: ${themeId}`)
      return
    }
    
    // Update reactive state (immediate UI update)
    const newTheme: ThemeConfig = {
      primary: theme.primary,
      background: theme.background,
      foreground: theme.foreground,
      accent: theme.accent,
      muted: theme.muted,
    }
    setCurrentTheme(newTheme)
    
    // Persist to config (mutate props.config to match existing pattern)
    props.config.theme = newTheme
    try {
      await saveConfig(props.config)
      uiStore.showTemporaryMessage(`Theme: ${theme.name}`)
    } catch (error) {
      uiStore.showTemporaryMessage(`Failed to save theme`)
    }
  }

  // Add a new app
  const openEditModal = (id: string) => {
    setEditingEntryId(id)
    uiStore.openModal("edit-app")
  }

  const handleAddApp = (config: AppEntryConfig) => {
    const entry = appsStore.addEntry(config)
    uiStore.closeModal()
    uiStore.showTemporaryMessage(`Added: ${entry.name}`)
    void persistAppsConfig()
  }

  const handleEditApp = (id: string, updates: Pick<AppEntryConfig, "name" | "command" | "args" | "cwd">) => {
    appsStore.updateEntry(id, updates)
    tabsStore.updateRunningEntry(id, updates)
    uiStore.closeModal()
    setEditingEntryId(null)

    const updatedName = appsStore.getEntry(id)?.name ?? updates.name
    if (tabsStore.store.runningApps.has(id)) {
      uiStore.showTemporaryMessage(`Updated: ${updatedName} (restart to apply)`)
    } else {
      uiStore.showTemporaryMessage(`Updated: ${updatedName}`)
    }

    void persistAppsConfig()
  }

  // Quit handler
  const handleQuit = async () => {
    if (isQuitting()) {
      return
    }
    setIsQuitting(true)

    // Save session and exit
    if (props.config.session.persist) {
      const runningRefs = Array.from(tabsStore.store.runningApps.values()).map((app) =>
        buildSessionRef(app.entry)
      )
      const activeApp = tabsStore.store.activeTabId
        ? tabsStore.getRunningApp(tabsStore.store.activeTabId)
        : undefined
      const activeRef = activeApp ? buildSessionRef(activeApp.entry) : null

      try {
        await saveSession({
          runningApps: runningRefs,
          activeTab: activeRef,
          timestamp: Date.now(),
        })
      } catch (error) {
        debugLog(`[App] Failed to save session: ${error}`)
      }
    }

    // Kill all running apps
    stopAllApps({ showMessage: false })

    renderer.destroy()
    setTimeout(() => process.exit(0), 50)
  }

  // Hook up keyboard events from opentui
  useKeyboard((event) => {
    debugLog(`[App] key: ${event.name} modal: ${uiStore.store.activeModal} prevented: ${event.defaultPrevented}`)

    // If a modal is open, let modal handle keys (except Escape)
    if (uiStore.store.activeModal) {
      if (event.name === "escape") {
        if (uiStore.store.activeModal === "edit-app") {
          setEditingEntryId(null)
        }
        uiStore.closeModal()
        event.preventDefault()
      }
      // Don't preventDefault for other events - let the modal handle them
      return
    }

    // Get active app for PTY operations
    const activeApp = tabsStore.store.activeTabId
      ? tabsStore.getRunningApp(tabsStore.store.activeTabId)
      : undefined

    // === CTRL+A TOGGLE (works in both modes) ===
    if (matchesKeybind(event, "ctrl+a")) {
      const now = Date.now()
      // Double-tap detection: if in terminal mode and within 500ms, send \x01 to PTY
      if (tabsStore.store.focusMode === "terminal" && now - lastCtrlATime < 500) {
        if (activeApp) {
          activeApp.pty.write("\x01")
        }
        lastCtrlATime = 0
        event.preventDefault()
        return
      }
      // Otherwise toggle focus mode
      lastCtrlATime = now
      tabsStore.toggleFocus()
      event.preventDefault()
      return
    }

    // === TERMINAL FOCUS MODE ===
    if (tabsStore.store.focusMode === "terminal") {
      // Pass raw input to terminal
      if (activeApp && event.sequence) {
        activeApp.pty.write(event.sequence)
        event.preventDefault()
      }
      return
    }

    // === TABS FOCUS MODE ===
    // Ctrl+C in tabs mode - just ignore silently
    if (event.sequence === "\x03" || (event.ctrl && event.name === "c")) {
      event.preventDefault()
      return
    }

    // Direct navigation keys (vim-style)
    // gg: go to top
    if (event.name === "g" && !event.ctrl && !event.option && !event.shift) {
      const now = Date.now()
      if (now - lastGTime() < 500) {
        setSelectedIndex(0)
        setLastGTime(0)
      } else {
        setLastGTime(now)
      }
      event.preventDefault()
      return
    }

    // G: go to bottom
    if (event.name === "G" || (event.shift && event.name === "g")) {
      const entries = appsStore.store.entries
      if (entries.length > 0) {
        setSelectedIndex(entries.length - 1)
      }
      setLastGTime(0)
      event.preventDefault()
      return
    }

    // Reset gg timer on other keys
    setLastGTime(0)

    // Single-key commands in tabs mode
    switch (event.name) {
      case "j":
      case "down":
        handleTabNavigation("down")
        event.preventDefault()
        return

      case "k":
      case "up":
        handleTabNavigation("up")
        event.preventDefault()
        return

      case "return":
      case "enter": {
        const entries = appsStore.store.entries
        if (entries.length > 0 && selectedIndex() < entries.length) {
          handleSelectApp(entries[selectedIndex()].id)
        }
        event.preventDefault()
        return
      }

      case "space":
      case " ":
        uiStore.openModal("command-palette")
        event.preventDefault()
        return

      case "t":
        uiStore.openModal("add-tab")
        event.preventDefault()
        return

      case "e": {
        const entry = appsStore.store.entries[selectedIndex()]
        if (entry) {
          openEditModal(entry.id)
        } else {
          uiStore.showTemporaryMessage("No app selected")
        }
        event.preventDefault()
        return
      }

      case "x": {
        const entry = appsStore.store.entries[selectedIndex()]
        if (!entry) {
          uiStore.showTemporaryMessage("No app selected")
        } else if (tabsStore.store.runningApps.has(entry.id)) {
          stopApp(entry.id)
        } else {
          uiStore.showTemporaryMessage(`Not running: ${entry.name}`)
        }
        event.preventDefault()
        return
      }

      case "r": {
        const entry = appsStore.store.entries[selectedIndex()]
        if (!entry) {
          uiStore.showTemporaryMessage("No app selected")
        } else if (tabsStore.store.runningApps.has(entry.id)) {
          restartApp(entry.id)
        } else {
          uiStore.showTemporaryMessage(`Not running: ${entry.name}`)
        }
        event.preventDefault()
        return
      }

      case "q":
        void handleQuit()
        event.preventDefault()
        return
    }

    // K (shift+k): kill all apps
    if (event.name === "K" || (event.shift && event.name === "k")) {
      stopAllApps({ showMessage: true })
      event.preventDefault()
      return
    }
  })

  // Auto-start apps and restore session once dimensions are valid
  createEffect(() => {
    const { cols, rows } = getPtyDimensions()

    // Wait for valid dimensions
    if (cols < 10 || rows < 3 || hasAutostarted()) {
      return
    }

    setHasAutostarted(true)

    // Auto-start configured apps
    for (const entry of appsStore.store.entries) {
      if (entry.autostart) {
        startApp(entry)
      }
    }

    // Restore session
    if (props.session) {
      for (const ref of props.session.runningApps) {
        const entry = resolveSessionEntry(ref)
        if (entry && !entry.autostart) {
          startApp(entry)
        }
      }

      if (props.session.activeTab) {
        const entry = resolveSessionEntry(props.session.activeTab)
        if (entry) {
          tabsStore.setActiveTab(entry.id)
        }
      }
    }
  })

  // Handle terminal resize based on terminal dimensions
  createEffect(() => {
    const { cols: termWidth, rows: termHeight } = getPtyDimensions()

    // Only resize with valid dimensions
    if (termWidth < 10 || termHeight < 3) {
      return
    }

    // Resize all running PTYs
    for (const [, app] of tabsStore.store.runningApps) {
      if (app.status === "running") {
        resizePty(app.pty, termWidth, termHeight)
      }
    }
  })

  // Handle input to terminal
  const handleTerminalInput = (data: string) => {
    const activeApp = tabsStore.store.activeTabId
      ? tabsStore.getRunningApp(tabsStore.store.activeTabId)
      : undefined

    if (activeApp) {
      activeApp.pty.write(data)
    }
  }

  // Cleanup on unmount
  onCleanup(() => {
    for (const [id] of tabsStore.store.runningApps) {
      stopApp(id, { silent: true })
    }
  })

  // Get the currently active running app
  const activeRunningApp = createMemo(() => {
    const activeId = tabsStore.store.activeTabId
    return activeId ? tabsStore.getRunningApp(activeId) : undefined
  })

  const editingEntry = createMemo(() => {
    const id = editingEntryId()
    const entry = id ? appsStore.getEntry(id) : undefined
    return entry
  })

  return (
    <box flexDirection="column" width="100%" height="100%">
      {/* Main content area */}
      <box flexDirection="row" flexGrow={1}>
        {/* Tab list sidebar */}
        <TabList
          entries={appsStore.store.entries}
          activeTabId={tabsStore.store.activeTabId}
          selectedIndex={selectedIndex()}
          getStatus={getAppStatus}
          isFocused={tabsStore.store.focusMode === "tabs"}
          width={props.config.tab_width}
          height={terminalDims().height - 1}
          scrollOffset={tabsStore.store.scrollOffset}
          theme={currentTheme()}
          onSelect={handleSelectApp}
          onAddClick={() => uiStore.openModal("add-tab")}
        />

        {/* Terminal pane */}
        <TerminalPane
          runningApp={activeRunningApp()}
          isFocused={tabsStore.store.focusMode === "terminal"}
          width={terminalDims().width - props.config.tab_width}
          height={terminalDims().height - 1}
          theme={currentTheme()}
          onInput={handleTerminalInput}
        />
      </box>

      {/* Status bar */}
      <StatusBar
        appName={activeRunningApp()?.entry.name ?? null}
        appStatus={activeRunningApp()?.status ?? null}
        focusMode={tabsStore.store.focusMode}
        message={uiStore.store.statusMessage}
        theme={currentTheme()}
      />

      {/* Modals */}
      <Show when={uiStore.store.activeModal === "command-palette"}>
        <CommandPalette
          entries={appsStore.store.entries}
          theme={currentTheme()}
          onSelect={(entry, action) => {
            if (action === "edit") {
              openEditModal(entry.id)
              return
            }

            uiStore.closeModal()
            if (action === "switch") {
              handleSelectApp(entry.id)
            } else if (action === "stop") {
              if (tabsStore.store.runningApps.has(entry.id)) {
                stopApp(entry.id)
              } else {
                uiStore.showTemporaryMessage(`Not running: ${entry.name}`)
              }
            }
          }}
          onGlobalAction={(action: GlobalAction) => {
            // Handle theme selection
            if (typeof action === "object" && action.type === "set_theme") {
              handleThemeChange(action.themeId)
              return
            }
          }}
          onClose={() => uiStore.closeModal()}
        />
      </Show>

      <Show when={uiStore.store.activeModal === "add-tab"}>
        <AddTabModal
          theme={currentTheme()}
          onAdd={handleAddApp}
          onClose={() => uiStore.closeModal()}
        />
      </Show>

      <Show when={uiStore.store.activeModal === "edit-app" && editingEntry()}>
        <EditAppModal
          theme={currentTheme()}
          entry={editingEntry()!}
          onSave={(updates) => handleEditApp(editingEntry()!.id, updates)}
          onClose={() => {
            uiStore.closeModal()
            setEditingEntryId(null)
          }}
        />
      </Show>
    </box>
  )
}
