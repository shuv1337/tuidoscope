# Tuidoscope Implementation Backlog

**Created:** 2026-01-03  
**Status:** Active  
**Total Tasks:** 45

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
- [ ] **5.2.6** Document config file location: `~/.config/tuidoscope/tuidoscope.yaml`
- [ ] **5.2.7** Add quick start example: launch with default shell

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

- [ ] **5.4.1** Write introduction explaining app configuration
- [ ] **5.4.2** Document shell examples: bash, zsh, fish, nushell
- [ ] **5.4.3** Document system monitor examples: htop, btop, glances, bottom
- [ ] **5.4.4** Document file manager examples: yazi, ranger, lf, nnn, mc
- [ ] **5.4.5** Document git tool examples: lazygit, tig, gitui
- [ ] **5.4.6** Document container tool examples: lazydocker, k9s
- [ ] **5.4.7** Document editor examples: nvim, helix, micro
- [ ] **5.4.8** Document AI coding agent examples: claude, opencode, aider
- [ ] **5.4.9** Document utility examples: ncdu, dust, duf
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

**Last Updated:** 2026-01-03
