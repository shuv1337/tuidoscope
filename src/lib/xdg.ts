import { homedir } from "os"
import { join } from "path"

const APP_NAME = "tuidoscope"

/**
 * XDG Base Directory Specification paths
 * https://specifications.freedesktop.org/basedir-spec/latest/
 */

/**
 * Get XDG_CONFIG_HOME (default: ~/.config)
 * Used for user-specific configuration files
 */
export function getXdgConfigHome(): string {
  return process.env.XDG_CONFIG_HOME || join(homedir(), ".config")
}

/**
 * Get XDG_DATA_HOME (default: ~/.local/share)
 * Used for user-specific data files
 */
export function getXdgDataHome(): string {
  return process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")
}

/**
 * Get XDG_STATE_HOME (default: ~/.local/state)
 * Used for user-specific state files (logs, history, etc.)
 */
export function getXdgStateHome(): string {
  return process.env.XDG_STATE_HOME || join(homedir(), ".local", "state")
}

/**
 * Get XDG_CACHE_HOME (default: ~/.cache)
 * Used for user-specific non-essential cached data
 */
export function getXdgCacheHome(): string {
  return process.env.XDG_CACHE_HOME || join(homedir(), ".cache")
}

/**
 * Get app-specific config directory
 * $XDG_CONFIG_HOME/tuidoscope
 */
export function getConfigDir(): string {
  return join(getXdgConfigHome(), APP_NAME)
}

/**
 * Get app-specific data directory
 * $XDG_DATA_HOME/tuidoscope
 */
export function getDataDir(): string {
  return join(getXdgDataHome(), APP_NAME)
}

/**
 * Get app-specific state directory
 * $XDG_STATE_HOME/tuidoscope
 */
export function getStateDir(): string {
  return join(getXdgStateHome(), APP_NAME)
}

/**
 * Get app-specific cache directory
 * $XDG_CACHE_HOME/tuidoscope
 */
export function getCacheDir(): string {
  return join(getXdgCacheHome(), APP_NAME)
}

/**
 * Standard file paths
 */
export const paths = {
  get config() {
    return join(getConfigDir(), "tuidoscope.yaml")
  },
  get session() {
    return join(getStateDir(), "session.yaml")
  },
  get debugLog() {
    return join(getStateDir(), "debug.log")
  },
  get socket() {
    return join(getStateDir(), "tuidoscope.sock")
  },
}
