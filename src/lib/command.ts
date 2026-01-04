import { exec } from "child_process"
import { promisify } from "util"
import type { AppEntry } from "../types"

const execAsync = promisify(exec)

export function buildCommand(command: string, args?: string): string {
  const trimmedArgs = args?.trim()
  return trimmedArgs ? `${command} ${trimmedArgs}` : command
}

export function buildEntryCommand(entry: Pick<AppEntry, "command" | "args">): string {
  return buildCommand(entry.command, entry.args)
}

/**
 * Check if a command exists on the user's system.
 * Handles commands with arguments by extracting the base command,
 * and resolves environment variables like $SHELL.
 *
 * @param command - The command to check (may include args like "nvim -u NONE")
 * @returns Promise<boolean> - true if command exists, false otherwise
 */
export async function commandExists(command: string): Promise<boolean> {
  // Extract base command (first word, handles "nvim -u NONE" -> "nvim")
  let baseCommand = command.trim().split(/\s+/)[0]

  // Resolve environment variables like $SHELL
  if (baseCommand.startsWith("$")) {
    const envVar = baseCommand.slice(1)
    const resolved = process.env[envVar]
    if (!resolved) {
      return false
    }
    baseCommand = resolved
  }

  try {
    await execAsync(`which ${baseCommand}`)
    return true
  } catch {
    return false
  }
}
