import { Component, Show, createSignal, createEffect, onCleanup, createMemo, onMount } from "solid-js"
import { useKeyboard, useTerminalDimensions, useRenderer } from "@opentui/solid"
import { TabList } from "./components/TabList"
import { TerminalPane } from "./components/TerminalPane"
import { StatusBar } from "./components/StatusBar"
import { CommandPalette } from "./components/CommandPalette"
import { AddTabModal } from "./components/AddTabModal"
import { createAppsStore } from "./stores/apps"
import { createTabsStore } from "./stores/tabs"
import { createUIStore } from "./stores/ui"
import { spawnPty, killPty, resizePty } from "./lib/pty"
import { initSessionPath, saveSession } from "./lib/session"
import { createKeybindHandler } from "./lib/keybinds"
import type { Config, AppEntry, AppEntryConfig, SessionData, RunningApp } from "./types"

export interface AppProps {
  config: Config
  session: SessionData | null
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

    const dims = terminalDims()
    const { cols, rows } = getPtyDimensions()

    // Don't spawn with invalid dimensions
    if (cols < 10 || rows < 3) {
      console.warn(`Skipping start for ${entry.name}: invalid dimensions ${cols}x${rows}`)
      return
    }

    const ptyProcess = spawnPty(entry, { cols, rows })

    const runningApp: RunningApp = {
      entry,
      pty: ptyProcess,
      status: "running",
      buffer: "",
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
      if (exitCode === 0) {
        tabsStore.updateAppStatus(entry.id, "stopped")
      } else {
        tabsStore.updateAppStatus(entry.id, "error")
      }

      // Auto-restart if configured
      if (entry.restartOnExit && exitCode !== 0) {
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
    const visibleHeight = 20 // Approximate visible height
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

  // Add a new app
  const handleAddApp = (config: AppEntryConfig) => {
    const entry = appsStore.addEntry(config)
    uiStore.closeModal()
    uiStore.showTemporaryMessage(`Added: ${entry.name}`)
  }

  // Create keybind handler
  const handleKeybind = createKeybindHandler(props.config.keybinds, {
    next_tab: () => handleTabNavigation("down"),
    prev_tab: () => handleTabNavigation("up"),
    toggle_focus: () => tabsStore.toggleFocus(),
    new_tab: () => uiStore.openModal("add-tab"),
    command_palette: () => uiStore.openModal("command-palette"),
    close_tab: () => {
      const activeId = tabsStore.store.activeTabId
      if (activeId) stopApp(activeId)
    },
    stop_app: () => {
      if (tabsStore.store.focusMode === "tabs") {
        const entries = appsStore.store.entries
        const entry = entries[selectedIndex()]
        if (!entry) {
          uiStore.showTemporaryMessage("No app selected")
          return
        }
        if (tabsStore.store.runningApps.has(entry.id)) {
          stopApp(entry.id)
        } else {
          uiStore.showTemporaryMessage(`Not running: ${entry.name}`)
        }
        return
      }

      const activeId = tabsStore.store.activeTabId
      if (activeId) {
        stopApp(activeId)
      } else {
        uiStore.showTemporaryMessage("No active app")
      }
    },
    kill_all: () => stopAllApps({ showMessage: true }),
    restart_app: () => {
      const activeId = tabsStore.store.activeTabId
      if (activeId) restartApp(activeId)
    },
    quit: () => {
      if (isQuitting()) {
        return
      }
      setIsQuitting(true)

      // Save session and exit
      if (props.config.session.persist) {
        const runningIds = Array.from(tabsStore.store.runningApps.keys())
        saveSession({
          runningApps: runningIds,
          activeTab: tabsStore.store.activeTabId,
          timestamp: Date.now(),
        })
      }

      // Kill all running apps
      stopAllApps({ showMessage: false })

      renderer.destroy()
      setTimeout(() => process.exit(0), 50)
    },
  })

  // Hook up keyboard events from opentui
  useKeyboard((event) => {
    // If a modal is open, let it handle keys (except Escape which closes modals)
    if (uiStore.store.activeModal) {
      if (event.name === "escape") {
        uiStore.closeModal()
        event.preventDefault()
      }
      return
    }

    // In terminal focus mode, pass most keys to the terminal
    if (tabsStore.store.focusMode === "terminal") {
      // Check for global keybinds first
      if (handleKeybind(event)) {
        event.preventDefault()
        return
      }

      // Pass raw input to terminal
      const activeApp = tabsStore.store.activeTabId
        ? tabsStore.getRunningApp(tabsStore.store.activeTabId)
        : undefined

      if (activeApp && event.sequence) {
        activeApp.pty.write(event.sequence)
        event.preventDefault()
      }
      return
    }

    // Check for global keybinds first (before navigation keys)
    if (handleKeybind(event)) {
      event.preventDefault()
      return
    }

    // In tabs focus mode, handle navigation
    if (event.name === "j" || event.name === "down") {
      handleTabNavigation("down")
      event.preventDefault()
      return
    }

    if (event.name === "k" || event.name === "up") {
      handleTabNavigation("up")
      event.preventDefault()
      return
    }

    if (event.name === "return" || event.name === "enter") {
      const entries = appsStore.store.entries
      if (entries.length > 0 && selectedIndex() < entries.length) {
        handleSelectApp(entries[selectedIndex()].id)
        event.preventDefault()
      }
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
      for (const id of props.session.runningApps) {
        const entry = appsStore.getEntry(id)
        if (entry && !entry.autostart) {
          startApp(entry)
        }
      }

      if (props.session.activeTab) {
        tabsStore.setActiveTab(props.session.activeTab)
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
          theme={props.config.theme}
          onSelect={handleSelectApp}
          onAddClick={() => uiStore.openModal("add-tab")}
        />

        {/* Terminal pane */}
        <TerminalPane
          runningApp={activeRunningApp()}
          isFocused={tabsStore.store.focusMode === "terminal"}
          width={terminalDims().width - props.config.tab_width}
          height={terminalDims().height - 1}
          theme={props.config.theme}
          onInput={handleTerminalInput}
        />
      </box>

      {/* Status bar */}
      <StatusBar
        appName={activeRunningApp()?.entry.name ?? null}
        appStatus={activeRunningApp()?.status ?? null}
        focusMode={tabsStore.store.focusMode}
        message={uiStore.store.statusMessage}
        theme={props.config.theme}
        keybinds={{
          toggle_focus: props.config.keybinds.toggle_focus,
          command_palette: props.config.keybinds.command_palette,
          stop_app: props.config.keybinds.stop_app,
          kill_all: props.config.keybinds.kill_all,
          quit: props.config.keybinds.quit,
        }}
      />

      {/* Modals */}
      <Show when={uiStore.store.activeModal === "command-palette"}>
        <CommandPalette
          entries={appsStore.store.entries}
          theme={props.config.theme}
          onSelect={(entry, action) => {
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
          onClose={() => uiStore.closeModal()}
        />
      </Show>

      <Show when={uiStore.store.activeModal === "add-tab"}>
        <AddTabModal
          theme={props.config.theme}
          onAdd={handleAddApp}
          onClose={() => uiStore.closeModal()}
        />
      </Show>
    </box>
  )
}
