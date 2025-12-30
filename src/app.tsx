import { Component, Show, createSignal, createEffect, onCleanup, createMemo } from "solid-js"
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
import { createKeybindHandler, type KeyEvent } from "./lib/keybinds"
import type { Config, AppEntry, AppEntryConfig, SessionData, RunningApp } from "./types"

export interface AppProps {
  config: Config
  session: SessionData | null
}

export const App: Component<AppProps> = (props) => {
  // Initialize stores
  const appsStore = createAppsStore(props.config.apps)
  const tabsStore = createTabsStore()
  const uiStore = createUIStore()

  // Terminal dimensions
  const [terminalDims, setTerminalDims] = createSignal({ cols: 80, rows: 24 })

  // Tab list selection (separate from active tab for keyboard navigation)
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  // Initialize session path
  initSessionPath(props.config)

  // Start an app
  const startApp = (entry: AppEntry) => {
    // Don't start if already running
    if (tabsStore.store.runningApps.has(entry.id)) {
      return
    }

    const dims = terminalDims()
    const ptyProcess = spawnPty(entry, { cols: dims.cols, rows: dims.rows })

    const runningApp: RunningApp = {
      entry,
      pty: ptyProcess,
      status: "running",
      buffer: "",
    }

    // Handle PTY output
    ptyProcess.onData((data) => {
      tabsStore.appendToBuffer(entry.id, data)
    })

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode }) => {
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
  const stopApp = (id: string) => {
    const app = tabsStore.getRunningApp(id)
    if (app) {
      killPty(app.pty)
      tabsStore.removeRunningApp(id)
      uiStore.showTemporaryMessage(`Stopped: ${app.entry.name}`)
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
    restart_app: () => {
      const activeId = tabsStore.store.activeTabId
      if (activeId) restartApp(activeId)
    },
    quit: () => {
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
      for (const [id] of tabsStore.store.runningApps) {
        stopApp(id)
      }

      process.exit(0)
    },
  })

  // Auto-start apps
  createEffect(() => {
    for (const entry of appsStore.store.entries) {
      if (entry.autostart) {
        startApp(entry)
      }
    }
  })

  // Restore session
  createEffect(() => {
    if (props.session) {
      for (const id of props.session.runningApps) {
        const entry = appsStore.getEntry(id)
        if (entry) {
          startApp(entry)
        }
      }

      if (props.session.activeTab) {
        tabsStore.setActiveTab(props.session.activeTab)
      }
    }
  })

  // Handle terminal resize
  const handleTerminalResize = (cols: number, rows: number) => {
    setTerminalDims({ cols, rows })

    // Resize all running PTYs
    for (const [, app] of tabsStore.store.runningApps) {
      resizePty(app.pty, cols, rows)
    }
  }

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
      stopApp(id)
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
          height={24} // Will be dynamic
          scrollOffset={tabsStore.store.scrollOffset}
          theme={props.config.theme}
          onSelect={handleSelectApp}
          onAddClick={() => uiStore.openModal("add-tab")}
        />

        {/* Terminal pane */}
        <TerminalPane
          runningApp={activeRunningApp()}
          isFocused={tabsStore.store.focusMode === "terminal"}
          width={80} // Will be dynamic
          height={24} // Will be dynamic
          theme={props.config.theme}
          onInput={handleTerminalInput}
          onResize={handleTerminalResize}
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
