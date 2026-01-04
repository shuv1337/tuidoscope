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

// Leader key configuration for V2 keybind schema
// Implements tmux-style leader key system
const LeaderSchema = z.object({
  key: z.string().default("ctrl+a"),           // Leader key
  timeout: z.number().default(1000),           // ms before auto-cancel
  show_hints: z.boolean().default(true),       // Show hint popup after delay
  hint_delay: z.number().default(300),         // ms before showing hints
})

// V2 leader bindings - actions triggered by Leader + key
// Single keys (no modifiers) since leader already provides the modifier context
const LeaderBindingsSchema = z.object({
  next_tab: z.string().default("n"),           // Leader + n
  prev_tab: z.string().default("p"),           // Leader + p
  close_tab: z.string().default("w"),          // Leader + w
  new_tab: z.string().default("t"),            // Leader + t
  toggle_focus: z.string().default("a"),       // Leader + a
  edit_app: z.string().default("e"),           // Leader + e
  restart_app: z.string().default("r"),        // Leader + r
  command_palette: z.string().default("space"), // Leader + space
  stop_app: z.string().default("x"),           // Leader + x
  kill_all: z.string().default("K"),           // Leader + K (shift+k)
  quit: z.string().default("q"),               // Leader + q
})

// V2 direct bindings - navigation keys that work without leader in tabs mode
// These are vim-style navigation keys for tab selection
const DirectBindingsSchema = z.object({
  navigate_up: z.string().default("k"),        // Previous tab (vim up)
  navigate_down: z.string().default("j"),      // Next tab (vim down)
  select: z.string().default("enter"),         // Select/focus current tab
  go_top: z.string().default("g"),             // Go to first tab (gg)
  go_bottom: z.string().default("G"),          // Go to last tab (shift+g)
})

// V2 keybind schema - combines leader, bindings, and direct
// This is the new tmux-style leader key system
const KeybindSchemaV2 = z.object({
  leader: LeaderSchema.default({}),
  bindings: LeaderBindingsSchema.default({}),
  direct: DirectBindingsSchema.default({}),
})

// V1 keybind schema (legacy, kept for migration compatibility)
const KeybindSchemaV1 = z.object({
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

/**
 * Detect if a raw config object uses V1 keybind format.
 * V1 format has flat keybinds like { next_tab: "ctrl+n", ... }
 * V2 format has nested { leader: {...}, bindings: {...}, direct: {...} }
 */
export function isV1Config(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false
  
  const config = obj as Record<string, unknown>
  const keybinds = config.keybinds
  
  // No keybinds section means default (treat as V1 for migration)
  if (!keybinds || typeof keybinds !== 'object') return true
  
  const kb = keybinds as Record<string, unknown>
  
  // V2 has 'leader' object, V1 has flat strings like 'next_tab'
  if ('leader' in kb && typeof kb.leader === 'object') return false
  
  // V1 has ctrl+ prefixed strings directly
  if ('next_tab' in kb || 'toggle_focus' in kb || 'quit' in kb) return true
  
  // Default to V1 for safety
  return true
}

/**
 * Strip ctrl+/ctrl+shift+ prefix from a keybind string to get the base key.
 * Used for migrating V1 keybinds to V2 leader bindings.
 */
function stripModifierPrefix(keybind: string): string {
  // Handle ctrl+shift+ first (e.g., "ctrl+shift+r" -> "r")
  if (keybind.startsWith('ctrl+shift+')) {
    const key = keybind.slice('ctrl+shift+'.length)
    // For shift bindings, uppercase the letter (e.g., "r" -> "R")
    return key.length === 1 ? key.toUpperCase() : key
  }
  // Handle ctrl+ (e.g., "ctrl+n" -> "n")
  if (keybind.startsWith('ctrl+')) {
    return keybind.slice('ctrl+'.length)
  }
  // Return as-is if no known prefix
  return keybind
}

/**
 * Migrate V1 keybind config to V2 format.
 * - Extracts leader key from toggle_focus (default ctrl+a)
 * - Converts flat keybinds to leader bindings (strips ctrl+ prefix)
 * - Resolves command_palette conflict (was ctrl+p, now space)
 * - Adds direct bindings with vim-style defaults
 */
export function migrateV1ToV2(config: Record<string, unknown>): Record<string, unknown> {
  const v1Keybinds = (config.keybinds as Record<string, string>) || {}
  
  // Extract leader key from toggle_focus (usually ctrl+a)
  const leaderKey = v1Keybinds.toggle_focus || 'ctrl+a'
  
  // Build V2 bindings from V1, stripping ctrl+ prefix
  const bindings: Record<string, string> = {
    next_tab: stripModifierPrefix(v1Keybinds.next_tab || 'ctrl+n'),
    prev_tab: stripModifierPrefix(v1Keybinds.prev_tab || 'ctrl+p'),
    close_tab: stripModifierPrefix(v1Keybinds.close_tab || 'ctrl+w'),
    new_tab: stripModifierPrefix(v1Keybinds.new_tab || 'ctrl+t'),
    toggle_focus: 'a', // Leader + a to toggle focus
    edit_app: stripModifierPrefix(v1Keybinds.edit_app || 'ctrl+e'),
    restart_app: stripModifierPrefix(v1Keybinds.restart_app || 'ctrl+shift+r'),
    // Resolve conflict: command_palette was ctrl+p (same as prev_tab), now use space
    command_palette: 'space',
    stop_app: stripModifierPrefix(v1Keybinds.stop_app || 'ctrl+x'),
    kill_all: stripModifierPrefix(v1Keybinds.kill_all || 'ctrl+shift+k'),
    quit: stripModifierPrefix(v1Keybinds.quit || 'ctrl+q'),
  }
  
  // Direct bindings are vim-style navigation (no leader required, tabs mode only)
  const direct: Record<string, string> = {
    navigate_up: 'k',
    navigate_down: 'j',
    select: 'enter',
    go_top: 'g',
    go_bottom: 'G',
  }
  
  debugLog('[config] Migrated v1 config to v2')
  
  return {
    ...config,
    version: 2,
    keybinds: {
      leader: {
        key: leaderKey,
        timeout: 1000,
        show_hints: true,
        hint_delay: 300,
      },
      bindings,
      direct,
    },
  }
}

/**
 * Migrate config from any version to latest.
 * Detects version and applies appropriate migrations.
 */
export function migrateConfig(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  
  const obj = raw as Record<string, unknown>
  
  // If V1 format detected, migrate to V2
  if (isV1Config(obj)) {
    return migrateV1ToV2(obj)
  }
  
  return raw
}

const ConfigSchema = z.object({
  version: z.number().default(2),
  theme: ThemeSchema.default({}),
  keybinds: KeybindSchemaV2.default({}),
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
    const migrated = migrateConfig(parsed)
    const validated = ConfigSchema.parse(migrated)
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
