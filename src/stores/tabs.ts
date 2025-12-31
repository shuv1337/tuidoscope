import { createStore } from "solid-js/store"
import type { AppStatus, FocusMode, RunningApp } from "../types"

export interface TabsStore {
  activeTabId: string | null
  runningApps: Map<string, RunningApp>
  focusMode: FocusMode
  scrollOffset: number
}

export function createTabsStore() {
  const [store, setStore] = createStore<TabsStore>({
    activeTabId: null,
    runningApps: new Map(),
    focusMode: "tabs",
    scrollOffset: 0,
  })

  const setActiveTab = (id: string | null) => {
    setStore("activeTabId", id)
  }

  const setFocusMode = (mode: FocusMode) => {
    setStore("focusMode", mode)
  }

  const toggleFocus = () => {
    setStore("focusMode", (current) => (current === "tabs" ? "terminal" : "tabs"))
  }

  const addRunningApp = (app: RunningApp) => {
    setStore("runningApps", (apps) => {
      const newApps = new Map(apps)
      newApps.set(app.entry.id, app)
      return newApps
    })
  }

  const removeRunningApp = (id: string) => {
    setStore("runningApps", (apps) => {
      const newApps = new Map(apps)
      newApps.delete(id)
      return newApps
    })
  }

  const updateAppStatus = (id: string, status: AppStatus) => {
    setStore("runningApps", (apps) => {
      const app = apps.get(id)
      if (app) {
        const newApps = new Map(apps)
        newApps.set(id, { ...app, status })
        return newApps
      }
      return apps
    })
  }

  const appendToBuffer = (id: string, data: string) => {
    const MAX_BUFFER_CHARS = 200_000
    setStore("runningApps", (apps) => {
      const app = apps.get(id)
      if (app) {
        const nextBuffer = (app.buffer + data).slice(-MAX_BUFFER_CHARS)
        const newApps = new Map(apps)
        newApps.set(id, { ...app, buffer: nextBuffer })
        return newApps
      }
      return apps
    })
  }

  const getRunningApp = (id: string) => {
    return store.runningApps.get(id)
  }

  const setScrollOffset = (offset: number) => {
    setStore("scrollOffset", offset)
  }

  return {
    store,
    setActiveTab,
    setFocusMode,
    toggleFocus,
    addRunningApp,
    removeRunningApp,
    updateAppStatus,
    appendToBuffer,
    getRunningApp,
    setScrollOffset,
  }
}
