import { parse, stringify } from "yaml"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { dirname } from "path"
import { expandPath } from "./config"
import type { SessionData, Config } from "../types"

let sessionPath: string | null = null

/**
 * Initialize session path from config
 */
export function initSessionPath(config: Config): void {
  sessionPath = expandPath(config.session.file)
}

/**
 * Save current session state
 */
export async function saveSession(data: SessionData): Promise<void> {
  if (!sessionPath) {
    throw new Error("Session path not initialized")
  }

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
  if (!sessionPath || !existsSync(sessionPath)) {
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
  if (sessionPath && existsSync(sessionPath)) {
    await writeFile(sessionPath, "", "utf-8")
  }
}
