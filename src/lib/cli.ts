/**
 * CLI argument parsing for tuidoscope
 */

export interface CLIOptions {
  help: boolean
  version: boolean
  debug: boolean
  add: boolean
  server: boolean
  shutdown: boolean
  unknown: string[]
}

const VERSION = "0.1.17"

const HELP_TEXT = `tuidoscope - A TUI multiplexer for managing terminal applications

Usage: tuidoscope [options]

Options:
  -h, --help       Show this help message and exit
  -v, --version    Show version number and exit
  -d, --debug      Enable debug logging (writes to state dir)
  -a, --add        Launch directly into the add app wizard
      --server     Start the session server (internal use)
      --shutdown   Shutdown session server and clear session state

Keyboard shortcuts (in tabs mode):
  j/k or ↑/↓       Navigate between apps
  Enter            Start/switch to selected app
  Space            Open command palette
  t                Add new app
  e                Edit selected app
  x                Stop selected app
  r                Restart selected app
  q                Quit (detach from session)
  Q (shift+q)      Shutdown session server
  Ctrl+a           Toggle between tabs and terminal mode

In terminal mode:
  Ctrl+a           Switch back to tabs mode
  Ctrl+a Ctrl+a    Send Ctrl+a to the terminal

For more information, visit: https://github.com/shuv1337/tuidoscope
`

/**
 * Parse CLI arguments
 */
export function parseArgs(argv: string[]): CLIOptions {
  const args = argv.slice(2) // Skip node/bun and script path

  const options: CLIOptions = {
    help: false,
    version: false,
    debug: false,
    add: false,
    server: false,
    shutdown: false,
    unknown: [],
  }

  for (const arg of args) {
    switch (arg) {
      case "-h":
      case "--help":
        options.help = true
        break
      case "-v":
      case "--version":
        options.version = true
        break
      case "-d":
      case "--debug":
        options.debug = true
        break
      case "-a":
      case "--add":
        options.add = true
        break
      case "--server":
        options.server = true
        break
      case "--shutdown":
        options.shutdown = true
        break
      default:
        if (arg.startsWith("-")) {
          options.unknown.push(arg)
        }
        break
    }
  }

  return options
}

/**
 * Print help message and exit
 */
export function printHelp(): void {
  console.log(HELP_TEXT)
}

/**
 * Print version and exit
 */
export function printVersion(): void {
  console.log(`tuidoscope ${VERSION}`)
}

/**
 * Print error for unknown flags and exit
 */
export function printUnknownFlags(flags: string[]): void {
  console.error(`Unknown option${flags.length > 1 ? "s" : ""}: ${flags.join(", ")}`)
  console.error(`Try 'tuidoscope --help' for more information.`)
}
