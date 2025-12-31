import type { Subprocess, Terminal } from "bun"
import { expandPath } from "./config"
import type { AppEntry } from "../types"

export interface PtyOptions {
  cols?: number
  rows?: number
}

export interface PtyProcess {
  terminal: Terminal
  proc: Subprocess<"ignore", "ignore", "ignore">
  write: (data: string) => void
  resize: (cols: number, rows: number) => void
  kill: () => void
  onData: (callback: (data: string) => void) => void
  onExit: (callback: (info: { exitCode: number; signal: number }) => void) => void
  pid: number
}

// List of common shells that need interactive mode
const INTERACTIVE_SHELLS = ['bash', 'zsh', 'fish', 'sh', 'dash', 'ksh', 'tcsh', 'csh']

/**
 * Build a command string for shell execution.
 */
function buildCommandString(command: string): string {
  const trimmed = command.trim()
  if (!trimmed.includes(" ") && INTERACTIVE_SHELLS.includes(trimmed)) {
    return `${trimmed} -i`
  }
  return trimmed
}

/**
 * Parse a command string into program and arguments
 */
function parseCommand(command: string): { program: string; args: string[] } {
  const trimmed = command.trim()

  // Simple case: single word command (bash, htop, etc.)
  if (!trimmed.includes(" ")) {
    // For shells, force interactive mode to prevent SIGHUP exits
    if (INTERACTIVE_SHELLS.includes(trimmed)) {
      return { program: trimmed, args: ["-i"] }
    }
    return { program: trimmed, args: [] }
  }

  // Complex command: use shell to execute
  const shell = process.env.SHELL || "/bin/sh"
  return { program: shell, args: ["-c", trimmed] }
}

/**
 * Spawn a PTY for an app entry using Bun's native PTY support
 */
export function spawnPty(
  entry: AppEntry,
  options: PtyOptions = {}
): PtyProcess {
  const { cols = 80, rows = 24 } = options
  const cwd = expandPath(entry.cwd)

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    TERM: "xterm-256color",
    COLUMNS: String(cols),
    LINES: String(rows),
    ...entry.env,
  }

  const useScript = process.platform !== "win32" && !process.env.TUIDISCOPE_NO_SCRIPT
  const commandString = buildCommandString(entry.command)
  const { program, args } = parseCommand(entry.command)
  const spawnProgram = useScript ? "script" : program
  const spawnArgs = useScript ? ["-q", "-c", commandString, "/dev/null"] : args

  // Callbacks storage
  let dataCallback: ((data: string) => void) | null = null
  let exitCallback: ((info: { exitCode: number; signal: number }) => void) | null = null

  // Create terminal with callbacks
  const terminal = new Bun.Terminal({
    cols,
    rows,
    data(_term, data) {
      const str = typeof data === "string" ? data : new TextDecoder().decode(data)
      if (dataCallback) {
        dataCallback(str)
      }
    },
    exit(_term) {
      // We'll handle exit via proc.exited
    },
  })

  // Spawn the process with the terminal
  const proc = Bun.spawn([spawnProgram, ...spawnArgs], {
    terminal,
    cwd,
    env,
  })

  // Handle process exit
  proc.exited.then((exitCode) => {
    if (exitCallback) {
      exitCallback({ exitCode, signal: 0 })
    }
  }).catch(() => {
    if (exitCallback) {
      exitCallback({ exitCode: 1, signal: 0 })
    }
  })

  const ptyProcess: PtyProcess = {
    terminal,
    proc,
    pid: proc.pid,

    write(data: string) {
      terminal.write(data)
    },

    resize(cols: number, rows: number) {
      terminal.resize(cols, rows)
    },

    kill() {
      proc.kill()
      terminal.close()
    },

    onData(callback: (data: string) => void) {
      dataCallback = callback
    },

    onExit(callback: (info: { exitCode: number; signal: number }) => void) {
      exitCallback = callback
    },
  }

  return ptyProcess
}

/**
 * Resize a PTY
 */
export function resizePty(ptyProcess: PtyProcess, cols: number, rows: number): void {
  ptyProcess.resize(cols, rows)
}

/**
 * Kill a PTY process
 */
export function killPty(ptyProcess: PtyProcess): void {
  ptyProcess.kill()
}
