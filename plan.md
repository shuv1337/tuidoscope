# Tuidoscope Implementation Backlog

**Created:** 2026-01-03  
**Updated:** 2026-01-04  
**Status:** Active  
**Total Tasks:** 180+ (Phase 6 adds ~135 new tasks)

---

## Overview

This backlog covers bug fixes, feature enhancements, and documentation for tuidoscope. Tasks are ordered by priority and dependency. Each task is designed to be small, isolated, and immediately actionable.

### Priority Legend
- **P0** - Critical bug fixes
- **P1** - High priority features
- **P2** - Medium priority enhancements
- **P3** - Documentation and polish

---

## Phase 1: Bug Fixes (P0)

### 1.1 Fix Extra Characters in Preset List

**Issue:** Extra characters appear between items in the suggested app list when items are NOT selected/highlighted.

**Root Cause:** Multiple `<text>` elements in `PresetSelectionStep.tsx` with inconsistent background handling.

- [x] **1.1.1** Read and analyze `src/components/onboarding/PresetSelectionStep.tsx` lines 142-165
- [x] **1.1.2** Identify the rendering artifact - check if `bg={undefined}` vs omitting `bg` causes different behavior
- [x] **1.1.3** Test fix option A: Combine checkbox/name and description into single `<text>` element
- [x] **1.1.4** Test fix option B: Use `bg=""` or `bg={props.theme.background}` instead of `bg={undefined}` for non-focused items
- [x] **1.1.5** Apply the working fix to lines 150-161
- [x] **1.1.6** Verify fix by running app and scrolling through preset list
- [x] **1.1.7** Confirm no visual artifacts on both focused and unfocused items

### 1.2 Fix Checkbox Visual Difference

**Issue:** No visual distinction between selected `[x]` and unselected `[ ]` checkboxes - only the character differs.

**Files:** `src/components/onboarding/PresetSelectionStep.tsx`

- [x] **1.2.1** Define color scheme for checkbox states:
  - Selected `[x]`: Use `theme.accent` (#7fdbca) for the checkbox text
  - Unselected `[ ]`: Use `theme.muted` (#637777) for the checkbox text
- [x] **1.2.2** Refactor lines 150-155 to separate checkbox into its own `<text>` element
- [x] **1.2.3** Add conditional `fg` color based on `isSelected()` state for checkbox element
- [x] **1.2.4** Keep the app name and icon using current highlight logic (inverse on focus)
- [x] **1.2.5** Test visual appearance: selected items should have cyan/teal checkbox
- [x] **1.2.6** Test visual appearance: unselected items should have grey checkbox
- [x] **1.2.7** Verify checkbox color is visible in both focused and unfocused states

### 1.3 Fix Ctrl+C App Exit (Issue #3)

**Issue:** Pressing Ctrl+C exits the entire tuidoscope application instead of passing SIGINT to the terminal PTY.

**Reference:** GitHub Issue #3

#### 1.3.1 Remove SIGINT Auto-Exit Handler

- [x] **1.3.1.1** Open `src/index.tsx`
- [x] **1.3.1.2** Locate line 57: `process.on("SIGINT", handleShutdown)`
- [x] **1.3.1.3** Comment out or remove the SIGINT handler line
- [x] **1.3.1.4** Add explanatory comment above SIGTERM handler:
  ```typescript
  // SIGINT (Ctrl+C) is handled in the keyboard event handler to allow
  // passthrough to the active PTY. SIGTERM is kept for external termination.
  ```
- [x] **1.3.1.5** Keep `process.on("SIGTERM", handleShutdown)` unchanged
- [x] **1.3.1.6** Save file and verify app still starts correctly

#### 1.3.2 Add Ctrl+C Passthrough in Terminal Mode

- [x] **1.3.2.1** Open `src/app.tsx`
- [x] **1.3.2.2** Locate the `useKeyboard` callback, find terminal focus mode section (~line 352)
- [x] **1.3.2.3** Move `activeApp` retrieval to top of terminal focus mode block (before keybind check)
- [x] **1.3.2.4** Add Ctrl+C detection before global keybind handling:
  ```typescript
  if (activeApp && (event.sequence === "\x03" || (event.ctrl && event.name === "c"))) {
    activeApp.pty.write("\x03")
    event.preventDefault()
    return
  }
  ```
- [x] **1.3.2.5** Ensure the existing `event.sequence` passthrough remains as fallback
- [x] **1.3.2.6** Add comment explaining Ctrl+C passthrough behavior

#### 1.3.3 Add Ctrl+C Hint in Tabs Mode

- [x] **1.3.3.1** In `src/app.tsx`, locate tabs focus mode section (~line 376)
- [x] **1.3.3.2** Add Ctrl+C detection after global keybind handling, before navigation:
  ```typescript
  if (event.sequence === "\x03" || (event.ctrl && event.name === "c")) {
    uiStore.showTemporaryMessage("Press Ctrl+Q to quit")
    event.preventDefault()
    return
  }
  ```
- [x] **1.3.3.3** Verify `uiStore.showTemporaryMessage` function exists in `src/stores/ui.ts`
- [x] **1.3.3.4** If function doesn't exist, create it with 2-second auto-dismiss

#### 1.3.4 Test Ctrl+C Behavior

- [x] **1.3.4.1** Start tuidoscope with shell tab
- [x] **1.3.4.2** Run `sleep 100` in terminal
- [x] **1.3.4.3** Press Ctrl+C - verify sleep is interrupted, app does NOT exit
- [x] **1.3.4.4** Test with `htop` - verify Ctrl+C is captured by htop
- [x] **1.3.4.5** Test with `python3` REPL - verify KeyboardInterrupt is raised
- [x] **1.3.4.6** Switch to tabs mode (Ctrl+A), press Ctrl+C - verify hint message appears
- [x] **1.3.4.7** Press Ctrl+Q - verify app exits gracefully
- [x] **1.3.4.8** Test `kill -TERM <pid>` from another terminal - verify graceful shutdown

---

## Phase 2: Theme Alignment (P1)

### 2.1 Update Default Theme to Night Owl

**Issue:** `config.ts` ThemeSchema uses Tokyo Night defaults instead of Night Owl colors defined in `theme.ts`.

**Reference:** Ghostty Night Owl theme from `m1yon/ghostty-night-owl`

- [x] **2.1.1** Open `src/lib/config.ts`
- [x] **2.1.2** Locate ThemeSchema definition (lines 23-29)
- [x] **2.1.3** Update `primary` default: `"#7aa2f7"` → `"#82aaff"`
- [x] **2.1.4** Update `background` default: `"#1a1b26"` → `"#011627"`
- [x] **2.1.5** Update `foreground` default: `"#c0caf5"` → `"#d6deeb"`
- [x] **2.1.6** Update `accent` default: `"#bb9af7"` → `"#7fdbca"`
- [x] **2.1.7** Update `muted` default: `"#565f89"` → `"#637777"`
- [x] **2.1.8** Add comment referencing Night Owl theme source
- [x] **2.1.9** Verify `src/lib/theme.ts` defaultTheme matches these values (it should)
- [x] **2.1.10** Delete any existing local config to test fresh defaults
- [x] **2.1.11** Start app and verify Night Owl colors are applied

---

## Phase 3: App Availability Detection (P2)

### 3.1 Create Command Existence Utility

**Goal:** Check if a command exists on the user's system.

- [x] **3.1.1** Open or create `src/lib/command.ts`
- [x] **3.1.2** Import required modules: `import { exec } from "child_process"` and `import { promisify } from "util"`
- [x] **3.1.3** Create `execAsync` helper: `const execAsync = promisify(exec)`
- [x] **3.1.4** Implement `commandExists` function:
  ```typescript
  export async function commandExists(command: string): Promise<boolean> {
    try {
      await execAsync(`which ${command}`)
      return true
    } catch {
      return false
    }
  }
  ```
- [x] **3.1.5** Handle edge case: commands with arguments (extract base command)
- [x] **3.1.6** Handle edge case: environment variables like `$SHELL` (resolve first)
- [x] **3.1.7** Export function from module
- [x] **3.1.8** Add JSDoc comment explaining function purpose

### 3.2 Update Preset Types

- [x] **3.2.1** Open `src/components/onboarding/presets.ts`
- [x] **3.2.2** Add `available?: boolean` property to `AppPreset` interface
- [x] **3.2.3** Add `category?: string` property to `AppPreset` interface (for future use)

### 3.3 Check Availability on Component Mount

- [x] **3.3.1** Open `src/components/onboarding/PresetSelectionStep.tsx`
- [x] **3.3.2** Import `commandExists` from `../../lib/command`
- [x] **3.3.3** Import `onMount` and `createSignal` from `solid-js`
- [x] **3.3.4** Create signal for availability map: `const [availability, setAvailability] = createSignal<Record<string, boolean>>({})`
- [x] **3.3.5** Add `onMount` hook to check all preset commands:
  ```typescript
  onMount(async () => {
    const results: Record<string, boolean> = {}
    await Promise.all(
      APP_PRESETS.map(async (preset) => {
        results[preset.id] = await commandExists(preset.command)
      })
    )
    setAvailability(results)
  })
  ```
- [x] **3.3.6** Create helper: `const isAvailable = (id: string) => availability()[id] ?? true`

### 3.4 Grey Out Unavailable Apps

- [x] **3.4.1** In `PresetSelectionStep.tsx`, locate the preset item render loop (line 134)
- [x] **3.4.2** Add `isAvailable` check inside the `For` callback
- [x] **3.4.3** Modify text color for unavailable items:
  - Use `theme.muted` for all text (icon, name, description)
  - Keep checkbox functional (user may install later)
- [x] **3.4.4** Add "(not installed)" suffix to description for unavailable apps
- [x] **3.4.5** Test with a command that doesn't exist (e.g., `nonexistent-app`)
- [x] **3.4.6** Verify available apps render normally
- [x] **3.4.7** Verify unavailable apps are greyed out with suffix

---

## Phase 4: Expand TUI Apps List (P2)

### 4.1 Add System Monitor Apps

- [x] **4.1.1** Open `src/components/onboarding/presets.ts`
- [x] **4.1.2** Add `glances` preset: `{ id: "glances", name: "glances", command: "glances", description: "Cross-platform monitoring", icon: "G" }`
- [x] **4.1.3** Add `bottom` preset: `{ id: "bottom", name: "bottom", command: "btm", description: "Graphical process monitor", icon: "B" }`
- [x] **4.1.4** Add `gtop` preset: `{ id: "gtop", name: "gtop", command: "gtop", description: "System monitoring dashboard", icon: "T" }`
- [x] **4.1.5** Add `zenith` preset: `{ id: "zenith", name: "zenith", command: "zenith", description: "Terminal system monitor", icon: "Z" }`

### 4.2 Add File Manager Apps

- [x] **4.2.1** Add `lf` preset: `{ id: "lf", name: "lf", command: "lf", description: "Terminal file manager", icon: "L" }`
- [x] **4.2.2** Add `nnn` preset: `{ id: "nnn", name: "nnn", command: "nnn", description: "Fast file manager", icon: "N" }`
- [x] **4.2.3** Add `mc` preset: `{ id: "mc", name: "Midnight Commander", command: "mc", description: "Visual file manager", icon: "M" }`
- [x] **4.2.4** Add `vifm` preset: `{ id: "vifm", name: "vifm", command: "vifm", description: "Vim-like file manager", icon: "V" }`

### 4.3 Add Git Tools

- [x] **4.3.1** Add `tig` preset: `{ id: "tig", name: "tig", command: "tig", description: "Text-mode git interface", icon: "T" }`
- [x] **4.3.2** Add `gitui` preset: `{ id: "gitui", name: "gitui", command: "gitui", description: "Blazing fast git TUI", icon: "U" }`

### 4.4 Add Dev/Infrastructure Tools

- [x] **4.4.1** Add `lazydocker` preset: `{ id: "lazydocker", name: "lazydocker", command: "lazydocker", description: "Docker TUI", icon: "D" }`
- [x] **4.4.2** Add `k9s` preset: `{ id: "k9s", name: "k9s", command: "k9s", description: "Kubernetes TUI", icon: "K" }`
- [x] **4.4.3** Add `dry` preset: `{ id: "dry", name: "dry", command: "dry", description: "Docker manager", icon: "D" }`

### 4.5 Add Editor Apps

- [x] **4.5.1** Add `helix` preset: `{ id: "helix", name: "Helix", command: "hx", description: "Post-modern editor", icon: "X" }`
- [x] **4.5.2** Add `micro` preset: `{ id: "micro", name: "micro", command: "micro", description: "Modern terminal editor", icon: "M" }`

### 4.6 Add AI Coding Agents

- [x] **4.6.1** Add `claude` preset: `{ id: "claude", name: "Claude Code", command: "claude", description: "Anthropic AI coding agent", icon: "C" }`
- [x] **4.6.2** Add `opencode` preset: `{ id: "opencode", name: "OpenCode", command: "opencode", description: "Open source AI coding agent", icon: "O" }`
- [x] **4.6.3** Add `aider` preset: `{ id: "aider", name: "Aider", command: "aider", description: "AI pair programming", icon: "A" }`
- [x] **4.6.4** Add `codex` preset: `{ id: "codex", name: "Codex CLI", command: "codex", description: "OpenAI coding assistant", icon: "X" }`
- [x] **4.6.5** Add `gemini` preset: `{ id: "gemini", name: "Gemini CLI", command: "gemini", description: "Google AI coding agent", icon: "G" }`

### 4.7 Add Utility Apps

- [x] **4.7.1** Add `dust` preset: `{ id: "dust", name: "dust", command: "dust", description: "Intuitive disk usage", icon: "D" }`
- [x] **4.7.2** Add `duf` preset: `{ id: "duf", name: "duf", command: "duf", description: "Disk usage utility", icon: "F" }`
- [x] **4.7.3** Add `gdu` preset: `{ id: "gdu", name: "gdu", command: "gdu", description: "Fast disk analyzer", icon: "G" }`
- [x] **4.7.4** Add `bandwhich` preset: `{ id: "bandwhich", name: "bandwhich", command: "bandwhich", description: "Network utilization", icon: "B" }`
- [x] **4.7.5** Add `trippy` preset: `{ id: "trippy", name: "trippy", command: "trip", description: "Network diagnostics", icon: "T" }`

### 4.8 Organize Presets by Category

- [x] **4.8.1** Add `category` field to all existing presets
- [x] **4.8.2** Define categories: "shell", "monitor", "files", "git", "dev", "editor", "ai", "utility"
- [x] **4.8.3** Group shell preset under "shell" category
- [x] **4.8.4** Group htop, btop, glances, bottom, gtop, zenith under "monitor"
- [x] **4.8.5** Group yazi, ranger, lf, nnn, mc, vifm under "files"
- [x] **4.8.6** Group lazygit, tig, gitui under "git"
- [x] **4.8.7** Group lazydocker, k9s, dry under "dev"
- [x] **4.8.8** Group nvim, helix, micro under "editor"
- [x] **4.8.9** Group claude, opencode, aider, codex, gemini under "ai"
- [x] **4.8.10** Group ncdu, dust, duf, gdu, bandwhich, trippy under "utility"
- [x] **4.8.11** (Optional) Add category headers in PresetSelectionStep UI

---

## Phase 5: Documentation (P3)

### 5.1 Create Documentation Structure

- [x] **5.1.1** Create `docs/` directory in project root
- [x] **5.1.2** Create empty `docs/getting-started.md`
- [x] **5.1.3** Create empty `docs/configuration.md`
- [x] **5.1.4** Create empty `docs/apps.md`
- [x] **5.1.5** Create empty `docs/keybindings.md`
- [x] **5.1.6** Create empty `docs/troubleshooting.md`

### 5.2 Write Getting Started Guide

- [x] **5.2.1** Write introduction section: what is tuidoscope, use cases
- [x] **5.2.2** Write installation section: npm/bun install commands
- [x] **5.2.3** Write first run section: what happens on first launch
- [x] **5.2.4** Document onboarding wizard flow: welcome → presets → custom app → confirm
- [ ] **5.2.5** Add screenshots or ASCII diagrams of each onboarding step
- [x] **5.2.6** Document config file location: `~/.config/tuidoscope/tuidoscope.yaml`
- [x] **5.2.7** Add quick start example: launch with default shell

### 5.3 Write Configuration Guide

- [x] **5.3.1** Document YAML config structure with full example
- [x] **5.3.2** Document `version` field
- [x] **5.3.3** Document `theme` section with all 5 color properties
- [x] **5.3.4** Include Night Owl color reference table
- [x] **5.3.5** Document `keybinds` section with all configurable keys
- [x] **5.3.6** Document `tab_width` setting
- [x] **5.3.7** Document `apps` array structure
- [x] **5.3.8** Document app entry fields: name, command, args, cwd, env, autostart, restart_on_exit
- [x] **5.3.9** Document `session` persistence settings
- [x] **5.3.10** Document config file search order: local → XDG → defaults
- [x] **5.3.11** Document `<CONFIG_DIR>` and `<STATE_DIR>` path placeholders

### 5.4 Write Apps Examples Guide

- [x] **5.4.1** Write introduction explaining app configuration
- [x] **5.4.2** Document shell examples: bash, zsh, fish, nushell
- [x] **5.4.3** Document system monitor examples: htop, btop, glances, bottom
- [x] **5.4.4** Document file manager examples: yazi, ranger, lf, nnn, mc
- [x] **5.4.5** Document git tool examples: lazygit, tig, gitui
- [x] **5.4.6** Document container tool examples: lazydocker, k9s
- [x] **5.4.7** Document editor examples: nvim, helix, micro
- [x] **5.4.8** Document AI coding agent examples: claude, opencode, aider
- [x] **5.4.9** Document utility examples: ncdu, dust, duf
- [ ] **5.4.10** Document network tool examples: bandwhich, trippy
- [ ] **5.4.11** Add advanced examples: custom env vars, working directories
- [ ] **5.4.12** Add example for apps requiring specific TERM settings

### 5.5 Write Keybindings Guide

- [x] **5.5.1** Document focus modes: terminal vs tabs
- [x] **5.5.2** Document mode switching: Ctrl+A toggle
- [x] **5.5.3** Document tab navigation: j/k, Ctrl+n/p
- [x] **5.5.4** Document vim-style navigation: gg, G
- [x] **5.5.5** Document tab management: Ctrl+t (new), Ctrl+w (close)
- [x] **5.5.6** Document app control: Ctrl+Shift+R (restart), Ctrl+X (stop)
- [x] **5.5.7** Document command palette: Ctrl+Space
- [x] **5.5.8** Document quit: Ctrl+Q
- [x] **5.5.9** Document Ctrl+C behavior (passthrough to PTY)
- [x] **5.5.10** Provide full keybind customization example

### 5.6 Write Troubleshooting Guide

- [ ] **5.6.1** Document "Ctrl+C exits app" issue and solution
- [ ] **5.6.2** Document terminal rendering issues and TERM settings
- [ ] **5.6.3** Document color/theme not applying correctly
- [ ] **5.6.4** Document app not starting: command not found
- [ ] **5.6.5** Document session not persisting
- [ ] **5.6.6** Document keybind conflicts with terminal apps
- [ ] **5.6.7** Add FAQ section with common questions
- [ ] **5.6.8** Add debug mode instructions: `DEBUG=1 tuidoscope`

### 5.7 Update README

- [ ] **5.7.1** Add link to docs/ directory
- [ ] **5.7.2** Add quick installation instructions
- [ ] **5.7.3** Add feature highlights
- [ ] **5.7.4** Add screenshot/demo GIF
- [ ] **5.7.5** Add contributing guidelines reference

---

## Appendix

### File Reference

| File | Purpose |
|------|---------|
| `src/index.tsx` | Entry point, signal handlers |
| `src/app.tsx` | Main app, keyboard handling |
| `src/lib/config.ts` | Config loading, schema defaults |
| `src/lib/theme.ts` | Theme utilities, Night Owl colors |
| `src/lib/command.ts` | Command utilities (to create) |
| `src/lib/pty.ts` | PTY management |
| `src/stores/ui.ts` | UI state, messages |
| `src/stores/tabs.ts` | Tab state, focus mode |
| `src/components/onboarding/PresetSelectionStep.tsx` | Preset selection UI |
| `src/components/onboarding/presets.ts` | App preset definitions |

### Night Owl Theme Reference

```
background:  #011627
foreground:  #d6deeb
primary:     #82aaff (blue)
accent:      #7fdbca (cyan)
muted:       #637777 (grey)

Palette:
red:         #ef5350
green:       #22da6e
yellow:      #addb67
blue:        #82aaff
magenta:     #c792ea
cyan:        #7fdbca
```

### Control Character Reference

| Key | ASCII | Hex | Signal |
|-----|-------|-----|--------|
| Ctrl+C | 3 | `\x03` | SIGINT |
| Ctrl+D | 4 | `\x04` | EOF |
| Ctrl+Z | 26 | `\x1a` | SIGTSTP |
| Ctrl+\ | 28 | `\x1c` | SIGQUIT |

---

## Phase 6: Configurable Leader Key System (P1)

**Reference:** `CONTEXT/PLAN-configurable-leader-key-2026-01-04.md`

This feature replaces hardcoded `Ctrl+` keybinds with a tmux-style leader key system, allowing users to choose a leader key that doesn't conflict with their terminal emulator.

---

### 6.1 Core Infrastructure: UI Store Leader State

**Goal:** Add leader state tracking to the UI store.

**File:** `src/stores/ui.ts`

- [x] **6.1.1** Read `src/stores/ui.ts` to understand current store structure
- [x] **6.1.2** Add `leaderActive: boolean` to `UIStore` interface (default: `false`)
- [x] **6.1.3** Add `leaderTimeout: ReturnType<typeof setTimeout> | null` to `UIStore` interface (default: `null`)
- [x] **6.1.4** Add `leaderActivatedAt: number | null` to `UIStore` interface for timing (default: `null`)
- [x] **6.1.5** Implement `setLeaderActive(active: boolean)` method
- [x] **6.1.6** Implement `startLeaderTimeout(callback: () => void, ms: number)` method that stores timeout ID
- [x] **6.1.7** Implement `clearLeaderTimeout()` method that clears timeout if exists
- [x] **6.1.8** Update `setLeaderActive(true)` to set `leaderActivatedAt` to `Date.now()`
- [x] **6.1.9** Update `setLeaderActive(false)` to call `clearLeaderTimeout()` and reset `leaderActivatedAt`
- [x] **6.1.10** Export new methods from the store
- [x] **6.1.11** Verify store compiles without errors: `bun run typecheck`

---

### 6.2 Core Infrastructure: TypeScript Types

**Goal:** Add new types for leader key configuration.

**File:** `src/types/index.ts`

- [x] **6.2.1** Read `src/types/index.ts` to understand current type structure
- [x] **6.2.2** Add `LeaderConfig` interface:
  ```typescript
  export interface LeaderConfig {
    key: string
    timeout: number
    show_hints: boolean
    hint_delay: number
  }
  ```
- [x] **6.2.3** Add `LeaderBindings` interface with all action keys (next_tab, prev_tab, etc.)
- [x] **6.2.4** Add `DirectBindings` interface with navigation keys (navigate_up, navigate_down, select, go_top, go_bottom)
- [x] **6.2.5** Create new `KeybindConfigV2` interface with `leader`, `bindings`, and `direct` properties
- [x] **6.2.6** Keep existing `KeybindConfig` as `KeybindConfigV1` for migration compatibility
- [x] **6.2.7** Add union type: `type KeybindConfig = KeybindConfigV1 | KeybindConfigV2`
- [x] **6.2.8** Add type guard: `function isV2KeybindConfig(config: KeybindConfig): config is KeybindConfigV2`
- [x] **6.2.9** Verify types compile without errors: `bun run typecheck` (NOTE: type errors exist in dependent files that use V1 format - will be fixed in phases 6.5/6.6)

---

### 6.3 Core Infrastructure: Configuration Schema

**Goal:** Update Zod schema to support V2 keybind format with migration.

**File:** `src/lib/config.ts`

- [x] **6.3.1** Read `src/lib/config.ts` lines 33-74 to understand current schema
- [x] **6.3.2** Create `LeaderSchema` with Zod:
  ```typescript
  const LeaderSchema = z.object({
    key: z.string().default("ctrl+a"),
    timeout: z.number().default(1000),
    show_hints: z.boolean().default(true),
    hint_delay: z.number().default(300),
  })
  ```
- [x] **6.3.3** Create `LeaderBindingsSchema` with all action defaults (n, p, w, t, a, e, r, space, x, K, q)
- [x] **6.3.4** Create `DirectBindingsSchema` with navigation defaults (k, j, enter, g, G)
- [x] **6.3.5** Create `KeybindSchemaV2` combining leader, bindings, and direct
- [x] **6.3.6** Keep existing `KeybindSchema` renamed to `KeybindSchemaV1`
- [x] **6.3.7** Implement `isV1Config(obj: unknown): boolean` helper to detect V1 format
- [x] **6.3.8** Implement `migrateV1ToV2(config: Record<string, unknown>): Record<string, unknown>` function
- [x] **6.3.9** In `migrateV1ToV2`: extract leader key from `toggle_focus` (default `ctrl+a`)
- [x] **6.3.10** In `migrateV1ToV2`: strip `ctrl+` prefix from all bindings to get single keys
- [x] **6.3.11** In `migrateV1ToV2`: set `command_palette` to `space` to resolve ctrl+p conflict
- [x] **6.3.12** In `migrateV1ToV2`: preserve any user-customized values
- [x] **6.3.13** In `migrateV1ToV2`: add direct bindings with hardcoded defaults
- [x] **6.3.14** In `migrateV1ToV2`: set `version: 2` in output
- [x] **6.3.15** Implement `migrateConfig(raw: unknown): unknown` wrapper that detects version and migrates
- [x] **6.3.16** Update `loadConfig()` to call `migrateConfig(parsed)` before validation
- [x] **6.3.17** Update `ConfigSchema` to use `KeybindSchemaV2` for `keybinds` field
- [x] **6.3.18** Add debug log for migration: `debugLog("[config] Migrated v1 config to v2")`
- [x] **6.3.19** Verify config loads with new schema: `bun run dev`
- [x] **6.3.20** Test migration: create a V1 config, load it, verify V2 structure

---

### 6.4 Core Infrastructure: Update Default Config

**Goal:** Update default.yaml to V2 format.

**File:** `config/default.yaml`

- [x] **6.4.1** Read current `config/default.yaml`
- [x] **6.4.2** Change `version: 1` to `version: 2`
- [x] **6.4.3** Replace flat `keybinds` section with nested structure:
  ```yaml
  keybinds:
    leader:
      key: "ctrl+a"
      timeout: 1000
      show_hints: true
      hint_delay: 300
    bindings:
      next_tab: "n"
      prev_tab: "p"
      close_tab: "w"
      new_tab: "t"
      toggle_focus: "a"
      edit_app: "e"
      restart_app: "r"
      command_palette: "space"
      stop_app: "x"
      kill_all: "K"
      quit: "q"
    direct:
      navigate_up: "k"
      navigate_down: "j"
      select: "enter"
      go_top: "g"
      go_bottom: "G"
  ```
- [x] **6.4.4** Remove the duplicate `command_palette: "ctrl+p"` that conflicts with `prev_tab`
- [x] **6.4.5** Add comment explaining leader key concept
- [x] **6.4.6** Verify YAML is valid: parse with online validator or `bun` script

---

### 6.5 Core Infrastructure: Keybind Helpers

**Goal:** Add leader key matching and formatting utilities.

**File:** `src/lib/keybinds.ts`

- [x] **6.5.1** Read `src/lib/keybinds.ts` to understand current parsing logic
- [x] **6.5.2** Add `matchesLeaderKey(event: KeyEvent, leaderKey: string): boolean` function
- [x] **6.5.3** In `matchesLeaderKey`: reuse `matchesKeybind` logic for consistency
- [x] **6.5.4** Add `matchesSingleKey(event: KeyEvent, key: string): boolean` for leader bindings (no modifiers)
- [x] **6.5.5** Handle special case: `space` key matching (event.name === "space" or sequence === " ")
- [x] **6.5.6** Handle special case: `enter` key matching (event.name === "return" or "enter")
- [x] **6.5.7** Handle special case: shift+letter for uppercase (e.g., "K" requires shift+k)
- [x] **6.5.8** Add `formatLeaderKeybind(leaderKey: string, binding: string): string` for display
- [x] **6.5.9** In `formatLeaderKeybind`: convert "ctrl+a" to "^A" prefix style
- [x] **6.5.10** In `formatLeaderKeybind`: append "+" and binding (e.g., "^A+n")
- [x] **6.5.11** Add `createLeaderBindingHandler(bindings: LeaderBindings, handlers: Record<string, () => void>)` factory
- [x] **6.5.12** In `createLeaderBindingHandler`: iterate bindings and return matching action
- [x] **6.5.13** Update `KeybindAction` type to include all new actions
- [x] **6.5.14** Export all new functions
- [x] **6.5.15** Verify module compiles: `bun run typecheck`

---

### 6.6 Keyboard Handler: Refactor App.tsx

**Goal:** Implement leader state machine in keyboard handler.

**File:** `src/app.tsx`

- [x] **6.6.1** Read `src/app.tsx` lines 386-489 to understand current keyboard flow
- [x] **6.6.2** Import new helpers: `matchesLeaderKey`, `matchesSingleKey`, `createLeaderBindingHandler`
- [x] **6.6.3** Import `LeaderBindings` type from types
- [x] **6.6.4** Access leader state from uiStore: `const { leaderActive } = uiStore.store`
- [x] **6.6.5** Access leader config: `const leaderConfig = props.config.keybinds.leader`
- [x] **6.6.6** Access leader bindings: `const bindings = props.config.keybinds.bindings`
- [x] **6.6.7** Create binding handler using factory: `const handleLeaderBinding = createLeaderBindingHandler(bindings, { ... })`
- [x] **6.6.8** At top of `useKeyboard`: if modal open, clear leader state and return early (except Escape)
- [x] **6.6.9** Add leader state handling block after modal check, before focus mode checks
- [x] **6.6.10** In leader block: if `leaderActive` and event is Escape, cancel leader and return
- [x] **6.6.11** In leader block: if `leaderActive` and event matches leader key (double-tap):
  - If terminal focus: send leader key sequence to PTY
  - Cancel leader state
  - Return
- [x] **6.6.12** In leader block: if `leaderActive` and event matches a binding:
  - Execute the action
  - Cancel leader state
  - Return
- [x] **6.6.13** In leader block: if `leaderActive` and unknown key:
  - Cancel leader state
  - Return (do not pass to PTY or navigation)
- [x] **6.6.14** After leader block: if event matches leader key and not already active:
  - Activate leader state
  - Start timeout
  - Return
- [x] **6.6.15** Keep existing terminal focus Ctrl+C passthrough BEFORE leader check
- [x] **6.6.16** Keep existing tabs focus navigation (j/k/gg/G/Enter) AFTER leader handling
- [x] **6.6.17** Remove old `createKeybindHandler` call for global keybinds (now handled by leader)
- [x] **6.6.18** Verify keyboard flow compiles: `bun run typecheck`

---

### 6.7 Keyboard Handler: Leader Timeout

**Goal:** Implement automatic leader cancellation after timeout.

**File:** `src/app.tsx`

- [x] **6.7.1** When activating leader, call `uiStore.startLeaderTimeout`:
  ```typescript
  uiStore.startLeaderTimeout(() => {
    uiStore.setLeaderActive(false)
  }, leaderConfig.timeout)
  ```
- [x] **6.7.2** When deactivating leader (any path), call `uiStore.clearLeaderTimeout()`
- [x] **6.7.3** Verify timeout fires after 1000ms (default) with no key press
- [x] **6.7.4** Verify timeout is cleared on any subsequent key press
- [x] **6.7.5** Test: press leader, wait 1.1s, verify leader indicator disappears

---

### 6.8 Keyboard Handler: Double-Tap Leader

**Goal:** Send leader key to PTY when double-tapped in terminal focus.

**File:** `src/app.tsx`

- [x] **6.8.1** In leader active + leader key detected block:
  - Get the leader key sequence (e.g., ctrl+a = "\x01")
- [x] **6.8.2** Add helper to convert leader key string to PTY sequence:
  ```typescript
  function leaderKeyToSequence(leaderKey: string): string | null {
    const parsed = parseKeybind(leaderKey)
    if (parsed.ctrl && parsed.key.length === 1) {
      return String.fromCharCode(parsed.key.charCodeAt(0) - 96)
    }
    return null // Cannot determine sequence
  }
  ```
- [x] **6.8.3** If terminal focus and sequence exists, write to PTY
- [x] **6.8.4** If tabs focus or no sequence, just cancel leader (no action)
- [x] **6.8.5** Test: in terminal, press leader twice, verify leader key sent to PTY
- [x] **6.8.6** Test with tmux nested: double-tap should send prefix to inner tmux

---

### 6.9 Visual Feedback: StatusBar Leader Indicator

**Goal:** Show leader state indicator in status bar.

**File:** `src/components/StatusBar.tsx`

- [x] **6.9.1** Read `src/components/StatusBar.tsx` to understand current structure
- [x] **6.9.2** Add `leaderActive: boolean` to `StatusBarProps` interface
- [x] **6.9.3** Add `leaderKey: string` to `StatusBarProps` interface
- [x] **6.9.4** Update `App.tsx` to pass `leaderActive={uiStore.store.leaderActive}` to StatusBar
- [x] **6.9.5** Update `App.tsx` to pass `leaderKey={props.config.keybinds.leader.key}` to StatusBar
- [x] **6.9.6** In StatusBar render, add leader indicator before keybind hints:
  ```tsx
  <Show when={props.leaderActive}>
    <text fg={props.theme.accent}>
      <b>[{formatLeaderKey(props.leaderKey)}...]</b>
    </text>
  </Show>
  ```
- [x] **6.9.7** Add helper `formatLeaderKey(key: string): string` to show "^A" style
- [x] **6.9.8** Test: press leader, verify indicator appears in status bar
- [x] **6.9.9** Test: press second key or timeout, verify indicator disappears

---

### 6.10 Visual Feedback: Update StatusBar Keybind Hints

**Goal:** Update keybind hints to show leader+key format.

**File:** `src/components/StatusBar.tsx`

- [x] **6.10.1** Import `formatLeaderKeybind` from `../lib/keybinds`
- [x] **6.10.2** Update props to receive full keybind config instead of individual strings
- [x] **6.10.3** Update `toggle_focus` hint: `{formatLeaderKeybind(leader.key, bindings.toggle_focus)}:Focus`
- [x] **6.10.4** Update `command_palette` hint: `{formatLeaderKeybind(leader.key, bindings.command_palette)}:Palette`
- [x] **6.10.5** Update `edit_app` hint: `{formatLeaderKeybind(leader.key, bindings.edit_app)}:Edit`
- [x] **6.10.6** Update `stop_app` hint: `{formatLeaderKeybind(leader.key, bindings.stop_app)}:Stop`
- [x] **6.10.7** Update `kill_all` hint: `{formatLeaderKeybind(leader.key, bindings.kill_all)}:KillAll`
- [x] **6.10.8** Update `quit` hint: `{formatLeaderKeybind(leader.key, bindings.quit)}:Quit`
- [x] **6.10.9** Update App.tsx to pass new props structure to StatusBar
- [x] **6.10.10** Verify hints display correctly: `^A+a:Focus | ^A+Space:Palette | ...`

---

### 6.11 Visual Feedback: LeaderHints Overlay

**Goal:** Create popup showing available bindings after leader activation.

**File:** `src/components/LeaderHints.tsx` (new)

- [x] **6.11.1** Create new file `src/components/LeaderHints.tsx`
- [x] **6.11.2** Define `LeaderHintsProps` interface:
  ```typescript
  interface LeaderHintsProps {
    bindings: LeaderBindings
    leaderKey: string
    theme: ThemeConfig
  }
  ```
- [x] **6.11.3** Create component with absolute positioning (center-bottom of screen)
- [x] **6.11.4** Render bindings in 2-column grid format:
  ```
  n: Next Tab    p: Prev Tab
  t: New Tab     w: Close Tab
  a: Focus       e: Edit
  ...
  ```
- [x] **6.11.5** Style with `theme.background` background and `theme.primary` border
- [x] **6.11.6** Style keys with `theme.accent`, descriptions with `theme.foreground`
- [x] **6.11.7** Add "Press any key..." footer in `theme.muted`
- [x] **6.11.8** Export component

---

### 6.12 Visual Feedback: Integrate LeaderHints

**Goal:** Show hints popup after delay when leader is active.

**File:** `src/app.tsx`

- [x] **6.12.1** Import `LeaderHints` component
- [x] **6.12.2** Add `showHints: boolean` state to uiStore or local signal
- [x] **6.12.3** Add `hintsTimeout: ReturnType<typeof setTimeout> | null` to track hint delay
- [x] **6.12.4** When leader activates, start hints timeout:
  ```typescript
  if (leaderConfig.show_hints) {
    hintsTimeout = setTimeout(() => setShowHints(true), leaderConfig.hint_delay)
  }
  ```
- [x] **6.12.5** When leader deactivates, clear hints timeout and hide hints
- [x] **6.12.6** Render LeaderHints conditionally:
  ```tsx
  <Show when={uiStore.store.leaderActive && showHints()}>
    <LeaderHints
      bindings={props.config.keybinds.bindings}
      leaderKey={props.config.keybinds.leader.key}
      theme={props.config.theme}
    />
  </Show>
  ```
- [x] **6.12.7** Test: press leader, wait 300ms, verify hints appear
- [x] **6.12.8** Test: press leader, immediately press binding, verify hints don't appear
- [x] **6.12.9** Test: set `show_hints: false` in config, verify hints never appear

---

### 6.13 Onboarding: Types Update

**Goal:** Add keybinding step types to onboarding wizard.

**File:** `src/components/onboarding/types.ts`

- [x] **6.13.1** Read `src/components/onboarding/types.ts`
- [x] **6.13.2** Add `"keybindings"` to `WizardStep` union type:
  ```typescript
  export type WizardStep = "welcome" | "keybindings" | "presets" | "custom" | "confirm"
  ```
- [x] **6.13.3** Add `selectedLeaderKey: string` to `WizardState` interface
- [x] **6.13.4** Create `KeybindingStepProps` interface:
  ```typescript
  export interface KeybindingStepProps {
    theme: ThemeConfig
    selectedLeaderKey: string
    onSelectLeader: (key: string) => void
    onNext: () => void
    onBack: () => void
  }
  ```
- [x] **6.13.5** Export new interface

---

### 6.14 Onboarding: Leader Key Presets

**Goal:** Define leader key preset options.

**File:** `src/components/onboarding/keybindingPresets.ts` (new)

- [x] **6.14.1** Create new file `src/components/onboarding/keybindingPresets.ts`
- [x] **6.14.2** Define `LeaderPreset` interface:
  ```typescript
  export interface LeaderPreset {
    id: string
    key: string
    name: string
    description: string
  }
  ```
- [x] **6.14.3** Add tmux-style preset: `{ id: "tmux", key: "ctrl+a", name: "Ctrl+A", description: "tmux-style (recommended)" }`
- [x] **6.14.4** Add tmux-alt preset: `{ id: "tmux-alt", key: "ctrl+b", name: "Ctrl+B", description: "tmux alternate" }`
- [x] **6.14.5** Add screen-style preset: `{ id: "screen", key: "ctrl+\\", name: "Ctrl+\\", description: "GNU Screen style" }`
- [x] **6.14.6** Add desktop-style preset: `{ id: "desktop", key: "alt+space", name: "Alt+Space", description: "Desktop-style" }`
- [x] **6.14.7** Add custom option: `{ id: "custom", key: "", name: "Custom...", description: "Choose your own" }`
- [x] **6.14.8** Export `LEADER_PRESETS` array

---

### 6.15 Onboarding: KeybindingStep Component

**Goal:** Create the leader key selection wizard step.

**File:** `src/components/onboarding/KeybindingStep.tsx` (new)

- [x] **6.15.1** Create new file `src/components/onboarding/KeybindingStep.tsx`
- [x] **6.15.2** Import dependencies: solid-js, useKeyboard, types, presets
- [x] **6.15.3** Create component skeleton with `KeybindingStepProps`
- [x] **6.15.4** Add `focusedIndex` signal for keyboard navigation (default: 0)
- [x] **6.15.5** Add `isCapturing` signal for custom key capture mode (default: false)
- [x] **6.15.6** Add `capturedKey` signal to store custom key (default: "")
- [x] **6.15.7** Implement `useKeyboard` handler for navigation:
  - j/down: increment focusedIndex
  - k/up: decrement focusedIndex
  - Enter/Space: select current preset or enter capture mode
  - Escape/Backspace: go back
- [x] **6.15.8** Render title: "Choose your leader key"
- [x] **6.15.9** Render explanation text about leader key concept
- [x] **6.15.10** Render preset list with selection indicator `[*]` / `[ ]`
- [x] **6.15.11** Highlight focused preset with `theme.primary` background
- [x] **6.15.12** Mark selected preset with `theme.accent` checkbox
- [x] **6.15.13** Render example: "For example: Leader + n = next tab"
- [x] **6.15.14** Render tip about terminal conflicts
- [x] **6.15.15** Render footer hints: "j/k: Navigate | Enter: Select | Esc: Back"
- [x] **6.15.16** Export component
- [x] **6.15.17** Add to `src/components/onboarding/index.ts` exports

---

### 6.16 Onboarding: Custom Key Capture

**Goal:** Allow users to press a custom key combination.

**File:** `src/components/onboarding/KeybindingStep.tsx`

- [x] **6.16.1** When "Custom..." is selected and Enter pressed, set `isCapturing(true)`
- [x] **6.16.2** In capture mode, render modal overlay:
  ```
  Press the key combination you want to use as your leader key...
  Detected: [Ctrl+Space]
  [Cancel]  [Use This]
  ```
- [x] **6.16.3** In capture mode useKeyboard: capture any key with modifiers
- [x] **6.16.4** Convert captured event to keybind string: `eventToKeybindString(event)`
- [x] **6.16.5** Validate captured key is usable (not Enter, Escape, single letter without modifier)
- [x] **6.16.6** Display captured key in real-time
- [x] **6.16.7** On Enter in capture mode: confirm captured key, exit capture mode
- [x] **6.16.8** On Escape in capture mode: cancel capture, return to preset list
- [x] **6.16.9** Update `selectedLeaderKey` with captured key

---

### 6.17 Onboarding: Update Wizard Flow

**Goal:** Insert keybinding step into wizard navigation.

**File:** `src/components/onboarding/OnboardingWizard.tsx`

- [x] **6.17.1** Read `src/components/onboarding/OnboardingWizard.tsx`
- [x] **6.17.2** Import `KeybindingStep` component
- [x] **6.17.3** Add `selectedLeaderKey` signal with default `"ctrl+a"`
- [x] **6.17.4** Update `handleNext` switch:
  - `welcome` -> `keybindings`
  - `keybindings` -> `presets`
  - `presets` -> `custom`
  - `custom` -> `confirm`
- [x] **6.17.5** Update `handleBack` switch:
  - `confirm` -> `custom`
  - `custom` -> `presets`
  - `presets` -> `keybindings`
  - `keybindings` -> `welcome`
- [x] **6.17.6** Add `handleSelectLeader(key: string)` method to update signal
- [x] **6.17.7** Update `stepNumber()` to return 1-5 (was 1-4)
- [x] **6.17.8** Update `stepName()` to include "Keybindings" case
- [x] **6.17.9** Update `stepIndicator()` to show 5 dots instead of 4
- [x] **6.17.10** Add new `Match` case for `keybindings` step:
  ```tsx
  <Match when={currentStep() === "keybindings"}>
    <KeybindingStep
      theme={props.theme}
      selectedLeaderKey={selectedLeaderKey()}
      onSelectLeader={handleSelectLeader}
      onNext={handleNext}
      onBack={handleBack}
    />
  </Match>
  ```
- [x] **6.17.11** Update step header text: "Step X of 5"

---

### 6.18 Onboarding: Persist Keybind Config

**Goal:** Save selected leader key to config on wizard completion.

**File:** `src/app.tsx`

- [x] **6.18.1** Update `handleWizardComplete` signature to accept leader key:
  ```typescript
  const handleWizardComplete = async (apps: AppEntryConfig[], leaderKey: string) => { ... }
  ```
- [x] **6.18.2** Construct keybinds config with selected leader:
  ```typescript
  const keybindsConfig = {
    leader: {
      key: leaderKey,
      timeout: 1000,
      show_hints: true,
      hint_delay: 300,
    },
    bindings: { /* defaults */ },
    direct: { /* defaults */ },
  }
  ```
- [x] **6.18.3** Update `persistAppsConfig` to also save keybinds (rename to `persistConfig`)
- [x] **6.18.4** Merge keybinds into `nextConfig` alongside apps
- [x] **6.18.5** Update OnboardingWizard `onComplete` prop to pass leader key
- [x] **6.18.6** Update OnboardingWizard `handleConfirm` to call `props.onComplete(apps, selectedLeaderKey())`
- [x] **6.18.7** Test: complete wizard with custom leader, verify config file has correct leader key

---

### 6.19 UI Text Updates: TerminalPane

**Goal:** Update empty state hint to use leader key.

**File:** `src/components/TerminalPane.tsx`

- [x] **6.19.1** Read `src/components/TerminalPane.tsx` line 29-31
- [x] **6.19.2** Add `leaderKey: string` and `newTabBinding: string` to `TerminalPaneProps`
- [x] **6.19.3** Import `formatLeaderKeybind` from `../lib/keybinds`
- [x] **6.19.4** Update fallback text:
  ```tsx
  No app selected. Press {formatLeaderKeybind(props.leaderKey, props.newTabBinding)} to add one.
  ```
- [x] **6.19.5** Update App.tsx to pass `leaderKey` and `newTabBinding` props
- [x] **6.19.6** Verify text displays correctly: "Press ^A+t to add one."

---

### 6.20 UI Text Updates: Onboarding Steps

**Goal:** Update hardcoded key hints in onboarding steps.

**Files:** Multiple onboarding components

- [x] **6.20.1** Read `src/components/onboarding/CustomAppStep.tsx` line 305
- [x] **6.20.2** Update CustomAppStep footer: "Ctrl+A: Add" is fine (this is a local key, not leader)
- [x] **6.20.3** Read `src/components/onboarding/ConfirmationStep.tsx` line 137
- [x] **6.20.4** ConfirmationStep references "Ctrl+T" - this should mention leader after wizard
- [x] **6.20.5** Update ConfirmationStep to show: "Add more apps later with Leader+t"
- [x] **6.20.6** Pass `selectedLeaderKey` to ConfirmationStep props
- [x] **6.20.7** Import and use `formatLeaderKeybind` in ConfirmationStep
- [x] **6.20.8** Verify all onboarding hints are consistent

---

### 6.21 Key Capture Utility

**Goal:** Create reusable key capture utility.

**File:** `src/lib/key-capture.ts` (new)

- [x] **6.21.1** Create new file `src/lib/key-capture.ts`
- [x] **6.21.2** Import `KeyEvent` type from `@opentui/core`
- [x] **6.21.3** Implement `eventToKeybindString(event: KeyEvent): string`:
  ```typescript
  export function eventToKeybindString(event: KeyEvent): string {
    const parts: string[] = []
    if (event.ctrl) parts.push("ctrl")
    if (event.option) parts.push("alt")
    if (event.shift) parts.push("shift")
    if (event.meta) parts.push("meta")
    parts.push(event.name.toLowerCase())
    return parts.join("+")
  }
  ```
- [x] **6.21.4** Implement `isValidLeaderKey(keybind: string): boolean`:
  - Reject single letters without modifiers
  - Reject Enter, Escape, Tab
  - Require at least one modifier (ctrl, alt, meta)
- [x] **6.21.5** Implement `leaderKeyToSequence(leaderKey: string): string | null`:
  - Parse keybind
  - If ctrl+letter, return control code (charCode - 96)
  - Otherwise return null
  - NOTE: Re-exported from keybinds.ts where it was already implemented
- [x] **6.21.6** Export all functions

---

### 6.22 Documentation: Update keybindings.md

**Goal:** Document leader key concept and new keybind system.

**File:** `docs/keybindings.md`

- [x] **6.22.1** Read current `docs/keybindings.md`
- [x] **6.22.2** Add "Leader Key Concept" section at top
- [x] **6.22.3** Explain what a leader key is and how it works
- [x] **6.22.4** Document default leader key: `Ctrl+A`
- [x] **6.22.5** Document leader key timeout behavior
- [x] **6.22.6** Document double-tap to send leader to terminal
- [x] **6.22.7** Update all keybind references to use `Leader+key` format
- [x] **6.22.8** Add "Choosing a Leader Key" section with recommendations
- [x] **6.22.9** Document available presets and their trade-offs
- [x] **6.22.10** Add "Direct Bindings" section for j/k/gg/G navigation
- [x] **6.22.11** Add configuration example showing full V2 keybind config
- [x] **6.22.12** Add troubleshooting for leader key conflicts

---

### 6.23 Testing: Unit Tests

**Goal:** Add unit tests for new keybind utilities.

**File:** `src/lib/keybinds.test.ts` (new, if test framework exists)

- [x] **6.23.1** Create test file if test framework is configured
- [x] **6.23.2** Test `matchesLeaderKey` with various key combinations
- [x] **6.23.3** Test `matchesSingleKey` with letters, space, enter
- [x] **6.23.4** Test `formatLeaderKeybind` output format
- [x] **6.23.5** Test `eventToKeybindString` conversion
- [x] **6.23.6** Test `isValidLeaderKey` validation rules
- [x] **6.23.7** Test `leaderKeyToSequence` control code generation

---

### 6.24 Testing: Config Migration

**Goal:** Verify config migration works correctly.

- [x] **6.24.1** Create test V1 config file with custom keybinds
- [x] **6.24.2** Load config, verify migration runs
- [x] **6.24.3** Verify all custom bindings preserved
- [x] **6.24.4** Verify leader key extracted from toggle_focus
- [x] **6.24.5** Verify version updated to 2
- [x] **6.24.6** Verify command_palette changed to "space"
- [x] **6.24.7** Create test with default V1 config (no customizations)
- [x] **6.24.8** Verify defaults applied correctly
- [x] **6.24.9** Create test with already-V2 config
- [x] **6.24.10** Verify V2 config loaded unchanged (no migration)

---

### 6.25 Testing: Manual Integration Tests

**Goal:** Verify end-to-end leader key functionality.

- [x] **6.25.1** Test: fresh install, complete onboarding with default leader
- [x] **6.25.2** Test: press leader + n, verify next tab selected
- [x] **6.25.3** Test: press leader + p, verify previous tab selected
- [x] **6.25.4** Test: press leader + t, verify new tab modal opens
- [ ] **6.25.5** Test: press leader + q, verify app quits
- [ ] **6.25.6** Test: press leader, wait 1.1s, verify leader cancelled
- [ ] **6.25.7** Test: press leader twice in terminal, verify key sent to PTY
- [ ] **6.25.8** Test: press leader + unknown key, verify leader cancelled
- [ ] **6.25.9** Test: open modal, press leader, verify nothing happens
- [ ] **6.25.10** Test: terminal focus, Ctrl+C sent to PTY (not intercepted by leader)
- [ ] **6.25.11** Test: tabs focus, j/k navigation works without leader
- [ ] **6.25.12** Test: tabs focus, gg/G navigation works without leader
- [ ] **6.25.13** Test: custom leader key in onboarding, verify it works
- [ ] **6.25.14** Test: leader hints appear after 300ms delay
- [ ] **6.25.15** Test: leader hints hidden when `show_hints: false`

---

### 6.26 Testing: Terminal Compatibility

**Goal:** Verify leader key works across terminals.

- [ ] **6.26.1** Test in Alacritty on Linux
- [ ] **6.26.2** Test in GNOME Terminal on Linux
- [ ] **6.26.3** Test in Konsole on Linux
- [ ] **6.26.4** Test in iTerm2 on macOS
- [ ] **6.26.5** Test in Terminal.app on macOS
- [ ] **6.26.6** Test in WezTerm on macOS/Linux
- [ ] **6.26.7** Test nested inside tmux with different leader (Ctrl+B vs Ctrl+A)
- [ ] **6.26.8** Test nested inside screen
- [ ] **6.26.9** Document any terminal-specific issues found

---

### 6.27 Cleanup: Remove Old Keybind Handler

**Goal:** Remove deprecated V1 keybind handling code.

**File:** `src/app.tsx`

- [x] **6.27.1** Remove old `createKeybindHandler` call if still present
- [x] **6.27.2** Remove any V1-specific keybind matching code
- [x] **6.27.3** Verify all actions now go through leader system
- [x] **6.27.4** Remove unused imports
- [x] **6.27.5** Run typecheck to verify no broken references

---

### 6.28 Cleanup: Code Review

**Goal:** Review and polish implementation.

- [x] **6.28.1** Review all new files for consistent code style
- [ ] **6.28.2** Add JSDoc comments to all new exported functions
- [ ] **6.28.3** Remove any debug console.log statements
- [ ] **6.28.4** Verify no TypeScript `any` types in new code
- [ ] **6.28.5** Verify all new components have proper prop types
- [ ] **6.28.6** Run `bun run typecheck` to verify no errors
- [ ] **6.28.7** Run `bun run dev` to verify app starts correctly

---

## Appendix: Leader Key Implementation Reference

### State Machine Diagram

```
                    +-----------------+
  Key Event ------->|  Leader State   |
                    |    Machine      |
                    +--------+--------+
                             |
            +----------------+----------------+
            |                |                |
            v                v                v
       [Inactive]      [Leader Active]   [Terminal Focus]
            |                |                |
            v                v                v
     Check if leader   Check bindings    Pass-through
     key pressed       or timeout        to PTY
```

### Keyboard Flow (Proposed)

```
useKeyboard(event) {
  1. If modal open → only handle Escape, clear leader state, return early
  2. If leader active:
     a. If Escape → cancel leader, return
     b. If leader key again (double-tap) → send to PTY if terminal focus, cancel leader
     c. If known binding → execute action, cancel leader
     d. If unknown key → cancel leader
  3. If leader key pressed → activate leader, start timeout, return
  4. (Rest of current flow unchanged)
     - Terminal focus: Ctrl+C passthrough, then PTY write
     - Tabs focus: direct bindings (j/k/gg/G/Enter)
}
```

### File Changes Summary

| File | Changes |
|------|---------|
| `src/stores/ui.ts` | Add leader state + timeout |
| `src/types/index.ts` | Add LeaderConfig, update KeybindConfig |
| `src/lib/config.ts` | Add schema, migration |
| `src/lib/keybinds.ts` | Add leader matching, formatting |
| `src/lib/key-capture.ts` | New: key capture utility |
| `src/app.tsx` | Implement leader state machine |
| `src/components/StatusBar.tsx` | Add indicator, update hints |
| `src/components/LeaderHints.tsx` | New: hints overlay |
| `src/components/TerminalPane.tsx` | Update empty state text |
| `src/components/onboarding/types.ts` | Add keybinding step type |
| `src/components/onboarding/keybindingPresets.ts` | New: leader presets |
| `src/components/onboarding/KeybindingStep.tsx` | New: leader selection step |
| `src/components/onboarding/OnboardingWizard.tsx` | Add step, update flow |
| `src/components/onboarding/ConfirmationStep.tsx` | Update hints |
| `config/default.yaml` | Update to V2 schema |
| `docs/keybindings.md` | Document leader system |

---

**Last Updated:** 2026-01-04
