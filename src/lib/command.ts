import type { AppEntry } from "../types"

export function buildCommand(command: string, args?: string): string {
  const trimmedArgs = args?.trim()
  return trimmedArgs ? `${command} ${trimmedArgs}` : command
}

export function buildEntryCommand(entry: Pick<AppEntry, "command" | "args">): string {
  return buildCommand(entry.command, entry.args)
}
