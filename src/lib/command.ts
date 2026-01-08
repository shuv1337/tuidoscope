import { access } from "fs/promises"
import { constants } from "fs"
import { delimiter, extname, isAbsolute, join, resolve } from "path"
import type { AppEntry } from "../types"
import { expandPath } from "./config"

const accessMode = process.platform === "win32" ? constants.F_OK : constants.X_OK

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

  if (!baseCommand) {
    return false
  }

  const expanded = baseCommand.startsWith("~") ? expandPath(baseCommand) : baseCommand
  if (expanded.includes("/") || expanded.includes("\\") || isAbsolute(expanded)) {
    return await isExecutable(expanded)
  }

  const pathEntries = (process.env.PATH || "").split(delimiter).filter(Boolean)
  const baseHasExt = Boolean(extname(expanded))
  const extensions =
    process.platform === "win32" && !baseHasExt
      ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";")
      : [""]

  for (const entry of pathEntries) {
    for (const ext of extensions) {
      const candidate = resolve(join(entry, baseHasExt ? expanded : `${expanded}${ext}`))
      if (await isExecutable(candidate)) {
        return true
      }
    }
  }

  return false
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, accessMode)
    return true
  } catch {
    return false
  }
}
