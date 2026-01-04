import { parse, stringify } from "yaml"
import { z } from "zod"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { homedir } from "os"
import { dirname, resolve } from "path"
import { getConfigDir as getXdgConfigDir, paths, getStateDir } from "./xdg"
import { debugLog } from "./debug"
import type { Config } from "../types"

/**
 * Result from loadConfig() including metadata about config file discovery
 */
export interface LoadConfigResult {
  config: Config
  configFileFound: boolean
}

// Local project config (takes precedence)
const LOCAL_CONFIG_PATH = "./tuidoscope.yaml"

// Zod schema for validation
// Default theme: Night Owl (https://github.com/sdras/night-owl-vscode-theme)
// Ghostty port: https://github.com/m1yon/ghostty-night-owl
const ThemeSchema = z.object({
  primary: z.string().default("#82aaff"),     // Blue - selections, highlights
  background: z.string().default("#011627"),  // Deep dark blue
  foreground: z.string().default("#d6deeb"),  // Light gray-blue text
  accent: z.string().default("#7fdbca"),      // Cyan/teal - active indicators
  muted: z.string().default("#637777"),       // Gray-blue for inactive elements
})

const KeybindSchema = z.object({
  next_tab: z.string().default("ctrl+n"),
  prev_tab: z.string().default("ctrl+p"),
  close_tab: z.string().default("ctrl+w"),
  new_tab: z.string().default("ctrl+t"),
  toggle_focus: z.string().default("ctrl+a"),
  edit_app: z.string().optional(),
  rename_tab: z.string().optional(),
  restart_app: z.string().default("ctrl+shift+r"),
  command_palette: z.string().default("ctrl+space"),
  stop_app: z.string().default("ctrl+x"),
  kill_all: z.string().default("ctrl+shift+k"),
  quit: z.string().default("ctrl+q"),
}).transform(({ rename_tab, edit_app, ...rest }) => ({
  ...rest,
  edit_app: edit_app ?? rename_tab ?? "ctrl+e",
}))

const AppEntrySchema = z.object({
  name: z.string(),
  command: z.string(),
  args: z.string().optional(),
  cwd: z.string().default("~"),
  autostart: z.boolean().default(false),
  restart_on_exit: z.boolean().default(false),
  env: z.record(z.string()).optional(),
})

// Session schema now uses XDG state dir by default
const SessionSchema = z.object({
  persist: z.boolean().default(true),
  file: z.string().optional(), // Will use XDG default if not specified
})

const ConfigSchema = z.object({
  version: z.number().default(1),
  theme: ThemeSchema.default({}),
  keybinds: KeybindSchema.default({}),
  tab_width: z.number().default(20),
  apps: z.array(AppEntrySchema).default([]),
  session: SessionSchema.default({}),
})

// Current active config location (may be local or XDG)
let configPath: string = paths.config
let configDir: string = getXdgConfigDir()

/**
 * Expand path tokens like ~ and <CONFIG_DIR>
 */
export function expandPath(path: string): string {
  let expanded = path

  // Expand ~
  if (expanded.startsWith("~")) {
    expanded = expanded.replace("~", homedir())
  }

  // Expand <CONFIG_DIR>
  if (expanded.includes("<CONFIG_DIR>")) {
    expanded = expanded.replace("<CONFIG_DIR>", configDir)
  }

  // Expand <STATE_DIR>
  if (expanded.includes("<STATE_DIR>")) {
    expanded = expanded.replace("<STATE_DIR>", getStateDir())
  }

  return resolve(expanded)
}

/**
 * Load configuration from file, with fallback to defaults
 * 
 * Search order:
 * 1. ./tuidoscope.yaml (local project config)
 * 2. $XDG_CONFIG_HOME/tuidoscope/tuidoscope.yaml
 * 3. Default values
 */
export async function loadConfig(): Promise<LoadConfigResult> {
  debugLog(`[config] Checking local config: ${LOCAL_CONFIG_PATH}`)
  debugLog(`[config] Checking XDG config: ${paths.config}`)
  
  let configFileFound = false
  
  // Check for local config first
  if (existsSync(LOCAL_CONFIG_PATH)) {
    configPath = resolve(LOCAL_CONFIG_PATH)
    configDir = dirname(configPath)
    configFileFound = true
    debugLog(`[config] Using local config: ${configPath}`)
  } else if (existsSync(paths.config)) {
    configPath = paths.config
    configDir = getXdgConfigDir()
    configFileFound = true
    debugLog(`[config] Using XDG config: ${configPath}`)
  } else {
    // No config exists, use defaults with XDG paths
    configPath = paths.config
    configDir = getXdgConfigDir()
    configFileFound = false
    debugLog(`[config] No config found, using defaults`)
    return { config: ConfigSchema.parse({}) as Config, configFileFound }
  }

  try {
    const content = await readFile(configPath, "utf-8")
    const parsed = parse(content)
    const validated = ConfigSchema.parse(parsed)
    debugLog(`[config] Loaded ${validated.apps.length} apps from config`)
    return { config: validated as Config, configFileFound }
  } catch (error) {
    debugLog(`[config] Error loading config: ${error}`)
    console.error(`Error loading config from ${configPath}:`, error)
    return { config: ConfigSchema.parse({}) as Config, configFileFound }
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: Config): Promise<void> {
  // Ensure directory exists
  await mkdir(dirname(configPath), { recursive: true })

  const yamlContent = stringify(config, {
    indent: 2,
    lineWidth: 0,
  })

  await writeFile(configPath, yamlContent, "utf-8")
}

/**
 * Get the current config file path
 */
export function getConfigPath(): string {
  return configPath
}

/**
 * Get the current config directory
 */
export function getConfigDir(): string {
  return configDir
}
