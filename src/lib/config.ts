import { parse, stringify } from "yaml"
import { z } from "zod"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { homedir } from "os"
import { dirname, join, resolve } from "path"
import type { Config } from "../types"

// Default configuration path
const CONFIG_DIR = join(homedir(), ".config", "tuidiscope")
const CONFIG_PATH = join(CONFIG_DIR, "config.yaml")
const LOCAL_CONFIG_PATH = "./tuidiscope.yaml"

// Zod schema for validation
const ThemeSchema = z.object({
  primary: z.string().default("#7aa2f7"),
  background: z.string().default("#1a1b26"),
  foreground: z.string().default("#c0caf5"),
  accent: z.string().default("#bb9af7"),
  muted: z.string().default("#565f89"),
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
  command_palette: z.string().default("ctrl+p"),
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

const SessionSchema = z.object({
  persist: z.boolean().default(true),
  file: z.string().default("~/.local/state/tuidiscope/session.yaml"),
})

const ConfigSchema = z.object({
  version: z.number().default(1),
  theme: ThemeSchema.default({}),
  keybinds: KeybindSchema.default({}),
  tab_width: z.number().default(20),
  apps: z.array(AppEntrySchema).default([]),
  session: SessionSchema.default({}),
})

let configPath: string = CONFIG_PATH
let configDir: string = CONFIG_DIR

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

  return resolve(expanded)
}

/**
 * Load configuration from file, with fallback to defaults
 */
export async function loadConfig(): Promise<Config> {
  // Check for local config first
  if (existsSync(LOCAL_CONFIG_PATH)) {
    configPath = resolve(LOCAL_CONFIG_PATH)
    configDir = dirname(configPath)
  } else if (existsSync(CONFIG_PATH)) {
    configPath = CONFIG_PATH
    configDir = CONFIG_DIR
  } else {
    // No config exists, use defaults
    return ConfigSchema.parse({}) as Config
  }

  try {
    const content = await readFile(configPath, "utf-8")
    const parsed = parse(content)
    const validated = ConfigSchema.parse(parsed)
    return validated as Config
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error)
    return ConfigSchema.parse({}) as Config
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
