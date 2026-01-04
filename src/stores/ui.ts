import { createStore } from "solid-js/store"

export type ModalType = "add-tab" | "command-palette" | "edit-app" | null

export interface UIStore {
  activeModal: ModalType
  statusMessage: string | null
  /** Whether the leader key is currently active (waiting for second key) */
  leaderActive: boolean
  /** Timeout ID for auto-cancelling leader state */
  leaderTimeout: ReturnType<typeof setTimeout> | null
  /** Timestamp when leader was activated (for timing/debugging) */
  leaderActivatedAt: number | null
}

export function createUIStore() {
  const [store, setStore] = createStore<UIStore>({
    activeModal: null,
    statusMessage: null,
    leaderActive: false,
    leaderTimeout: null,
    leaderActivatedAt: null,
  })

  const openModal = (modal: ModalType) => {
    setStore("activeModal", modal)
  }

  const closeModal = () => {
    setStore("activeModal", null)
  }

  const setStatusMessage = (message: string | null) => {
    setStore("statusMessage", message)
  }

  const showTemporaryMessage = (message: string, durationMs = 3000) => {
    setStore("statusMessage", message)
    setTimeout(() => {
      setStore("statusMessage", (current) => (current === message ? null : current))
    }, durationMs)
  }

  /**
   * Clear any existing leader timeout
   */
  const clearLeaderTimeout = () => {
    if (store.leaderTimeout) {
      clearTimeout(store.leaderTimeout)
      setStore("leaderTimeout", null)
    }
  }

  /**
   * Set leader key active state. When deactivating, also clears timeout and timestamp.
   */
  const setLeaderActive = (active: boolean) => {
    if (active) {
      setStore("leaderActive", true)
      setStore("leaderActivatedAt", Date.now())
    } else {
      clearLeaderTimeout()
      setStore("leaderActive", false)
      setStore("leaderActivatedAt", null)
    }
  }

  /**
   * Start a timeout that will call the callback after ms milliseconds.
   * Clears any existing timeout first.
   */
  const startLeaderTimeout = (callback: () => void, ms: number) => {
    clearLeaderTimeout()
    const timeoutId = setTimeout(() => {
      callback()
    }, ms)
    setStore("leaderTimeout", timeoutId)
  }

  return {
    store,
    openModal,
    closeModal,
    setStatusMessage,
    showTemporaryMessage,
    setLeaderActive,
    clearLeaderTimeout,
    startLeaderTimeout,
  }
}
