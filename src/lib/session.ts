import { parse, stringify } from "yaml"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { dirname } from "path"
import { expandPath } from "./config"
import { paths } from "./xdg"
import type { SessionData, Config } from "../types"

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
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray(parsed.runningApps) &&
      typeof parsed.timestamp === "number"
    ) {
      return parsed
    }

    return null
  } catch {
    return null
  }
}

/**
 * Clear the session file
 */
export async function clearSession(): Promise<void> {
  if (existsSync(sessionPath)) {
    await writeFile(sessionPath, "", "utf-8")
  }
}
