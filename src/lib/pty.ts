import pty from "node-pty"
import type { IPty } from "node-pty"
import { expandPath } from "./config"
import type { AppEntry } from "../types"

export interface PtyOptions {
  cols?: number
  rows?: number
}

/**
 * Spawn a PTY for an app entry
 */
export function spawnPty(
  entry: AppEntry,
  options: PtyOptions = {}
): IPty {
  const { cols = 80, rows = 24 } = options
  const cwd = expandPath(entry.cwd)

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    TERM: "xterm-256color",
    ...entry.env,
  }

  // Use shell to execute the command
  const shell = process.env.SHELL || "/bin/sh"

  return pty.spawn(shell, ["-c", entry.command], {
    name: "xterm-256color",
    cols,
    rows,
    cwd,
    env,
  })
}

/**
 * Resize a PTY
 */
export function resizePty(ptyProcess: IPty, cols: number, rows: number): void {
  ptyProcess.resize(cols, rows)
}

/**
 * Kill a PTY process
 */
export function killPty(ptyProcess: IPty): void {
  ptyProcess.kill()
}
