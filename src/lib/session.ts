import { parse, stringify } from "yaml"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { dirname } from "path"
import { expandPath } from "./config"
import { paths } from "./xdg"
import type { SessionAppRef, SessionData, Config } from "../types"

let sessionPath: string = paths.session

/**
 * Initialize session path from config
 * Uses config.session.file if specified, otherwise XDG default
 */
export function initSessionPath(config: Config): void {
  if (config.session.file) {
    sessionPath = expandPath(config.session.file)
  } else {
    sessionPath = paths.session
  }
}

/**
 * Get the current session file path
 */
export function getSessionPath(): string {
  return sessionPath
}

/**
 * Save current session state
 */
export async function saveSession(data: SessionData): Promise<void> {
  await mkdir(dirname(sessionPath), { recursive: true })

  const yamlContent = stringify(data, {
    indent: 2,
    lineWidth: 0,
  })

  await writeFile(sessionPath, yamlContent, "utf-8")
}

/**
 * Restore session from file
 */
export async function restoreSession(): Promise<SessionData | null> {
  if (!existsSync(sessionPath)) {
    return null
  }

  try {
    const content = await readFile(sessionPath, "utf-8")
    const parsed = parse(content) as SessionData

    // Validate basic structure
    if (typeof parsed === "object" && parsed !== null) {
      const runningApps = Array.isArray(parsed.runningApps)
        ? parsed.runningApps.filter(isSessionRef)
        : []
      const activeTab = isSessionRef(parsed.activeTab) ? parsed.activeTab : null

      if (typeof parsed.timestamp === "number" && runningApps.length > 0) {
        return {
          runningApps,
          activeTab,
          timestamp: parsed.timestamp,
        }
      }

      if (typeof parsed.timestamp === "number" && Array.isArray(parsed.runningApps)) {
        return {
          runningApps,
          activeTab,
          timestamp: parsed.timestamp,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

function isSessionAppRef(value: unknown): value is SessionAppRef {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as SessionAppRef
  if (typeof candidate.id !== "string") return false
  if (typeof candidate.name !== "string") return false
  if (typeof candidate.command !== "string") return false
  if (typeof candidate.cwd !== "string") return false
  if (candidate.args !== undefined && typeof candidate.args !== "string") return false
  return true
}

function isSessionRef(value: unknown): value is string | SessionAppRef {
  return typeof value === "string" || isSessionAppRef(value)
}

/**
 * Clear the session file
 */
export async function clearSession(): Promise<void> {
  if (existsSync(sessionPath)) {
    await writeFile(sessionPath, "", "utf-8")
  }
}
