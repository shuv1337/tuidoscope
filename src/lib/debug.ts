import { appendFileSync } from "fs"

const DEBUG_LOG_PATH = process.env.TUIDISCOPE_DEBUG_LOG || "tuidiscope-debug.log"

export function debugLog(message: string) {
  if (!process.env.TUIDISCOPE_DEBUG) {
    return
  }

  try {
    const line = message.endsWith("\n") ? message : `${message}\n`
    appendFileSync(DEBUG_LOG_PATH, line)
  } catch {
    // Avoid crashing the UI for logging failures.
  }
}
