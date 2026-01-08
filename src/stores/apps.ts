import { createStore } from "solid-js/store"
import { generateId } from "../lib/id"
import type { AppEntry, AppEntryConfig } from "../types"

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

export interface AppsStore {
  entries: AppEntry[]
}

export function createAppsStore(initialApps: AppEntryConfig[] = []) {
  const [store, setStore] = createStore<AppsStore>({
    entries: initialApps.map(configToEntry),
  })

  const addEntry = (config: Omit<AppEntryConfig, "name"> & { name: string }) => {
    const entry = configToEntry(config as AppEntryConfig)
    setStore("entries", (entries) => [...entries, entry])
    return entry
  }

  const removeEntry = (id: string) => {
    setStore("entries", (entries) => entries.filter((e) => e.id !== id))
  }

  const updateEntry = (id: string, updates: Partial<AppEntry>) => {
    setStore("entries", (entry) => entry.id === id, updates)
  }

  const getEntry = (id: string) => {
    return store.entries.find((e) => e.id === id)
  }

  return {
    store,
    addEntry,
    removeEntry,
    updateEntry,
    getEntry,
  }
}
