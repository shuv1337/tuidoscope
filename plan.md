# Simplify Keyboard System - Implementation Backlog

**Goal:** Replace tmux-style leader key system with simple focus-toggle model.

**Key behavior:**
- `Ctrl+A` toggles between TABS and TERMINAL mode
- TABS mode: single keystrokes (j/k/gg/G/Enter/Space/t/e/x/r/K/q)
- TERMINAL mode: all input to PTY, double-tap Ctrl+A passes through

---

## Phase 1: Move and Delete Files

### 1.1 Move presets.ts
- [x] Copy `src/components/onboarding/presets.ts` to `src/lib/presets.ts`
- [x] Verify the new file has all exports: `AppPreset`, `CATEGORY_LABELS`, `CATEGORY_TAB_LABELS`, `APP_PRESETS`
- [x] Delete `src/components/onboarding/presets.ts`

### 1.2 Delete onboarding wizard files
- [x] Delete `src/components/onboarding/OnboardingWizard.tsx`
- [x] Delete `src/components/onboarding/WelcomeStep.tsx`
- [x] Delete `src/components/onboarding/KeybindingStep.tsx`
- [x] Delete `src/components/onboarding/PresetSelectionStep.tsx`
- [x] Delete `src/components/onboarding/CustomAppStep.tsx`
- [x] Delete `src/components/onboarding/ConfirmationStep.tsx`
- [x] Delete `src/components/onboarding/types.ts`
- [x] Delete `src/components/onboarding/keybindingPresets.ts`
- [x] Delete `src/components/onboarding/presetFilter.ts`
- [x] Delete `src/components/onboarding/presetFilter.test.ts`
- [x] Delete `src/components/onboarding/index.ts`
- [x] Delete the empty `src/components/onboarding/` directory

### 1.3 Delete leader hints component
- [x] Delete `src/components/LeaderHints.tsx`

### 1.4 Delete key-capture utility
- [x] Delete `src/lib/key-capture.ts`

### 1.5 Delete config migration tests
- [x] Delete `src/lib/config.test.ts`

---

## Phase 2: Simplify Types

### 2.1 Remove keybind types from src/types/index.ts
- [x] Delete `KeybindConfigV1` interface (lines ~12-25)
- [x] Delete `LeaderConfig` interface (lines ~27-33)
- [x] Delete `LeaderBindings` interface (lines ~35-49)
- [x] Delete `DirectBindings` interface (lines ~51-58)
- [x] Delete `KeybindConfigV2` interface (lines ~60-65)
- [x] Delete `KeybindConfig` type alias
- [x] Delete `isV2KeybindConfig()` type guard function
- [x] Remove `keybinds: KeybindConfigV2` from `Config` interface

---

## Phase 3: Simplify Config

### 3.1 Remove keybind schemas from src/lib/config.ts
- [x] Delete `LeaderSchema` zod object
- [x] Delete `LeaderBindingsSchema` zod object
- [x] Delete `DirectBindingsSchema` zod object
- [x] Delete `KeybindSchemaV2` zod object
- [x] Delete `KeybindSchemaV1` zod object

### 3.2 Remove migration functions from src/lib/config.ts
- [x] Delete `isV1Config()` function
- [x] Delete `stripModifierPrefix()` function
- [x] Delete `migrateV1ToV2()` function
- [x] Delete `migrateConfig()` function

### 3.3 Update ConfigSchema in src/lib/config.ts
- [x] Remove `keybinds: KeybindSchemaV2.default({})` from ConfigSchema

### 3.4 Update loadConfig() in src/lib/config.ts
- [x] Remove `migrateConfig()` call (line ~304: `const migrated = migrateConfig(parsed)`)
- [x] Change to parse directly: `const validated = ConfigSchema.parse(parsed)`

---

## Phase 4: Simplify Keybinds Library

### 4.1 Remove unused exports from src/lib/keybinds.ts
- [x] Delete `KeybindAction` type
- [x] Delete `matchesLeaderKey()` function
- [x] Delete `matchesSingleKey()` function
- [x] Delete `createLeaderBindingHandler()` function
- [x] Delete `formatLeaderKeybind()` function
- [x] Delete `formatLeaderKey()` function
- [x] Delete `leaderKeyToSequence()` function

### 4.2 Clean up imports in src/lib/keybinds.ts
- [x] Remove `import type { LeaderBindings } from "../types"` (no longer exists)

### 4.3 Verify remaining exports
- [x] Confirm `parseKeybind()` is exported
- [x] Confirm `matchesKeybind()` is exported
- [x] Confirm `formatKeybind()` is exported (may be useful)

---

## Phase 5: Clean Up UI Store

### 5.1 Remove leader state from src/stores/ui.ts
- [x] Remove `leaderActive: boolean` from `UIStore` interface
- [x] Remove `leaderTimeout: ReturnType<typeof setTimeout> | null` from `UIStore` interface
- [x] Remove `leaderActivatedAt: number | null` from `UIStore` interface
- [x] Remove `leaderActive: false` from initial store state
- [x] Remove `leaderTimeout: null` from initial store state
- [x] Remove `leaderActivatedAt: null` from initial store state

### 5.2 Remove leader functions from src/stores/ui.ts
- [x] Delete `clearLeaderTimeout()` function
- [x] Delete `setLeaderActive()` function
- [x] Delete `startLeaderTimeout()` function
- [x] Remove `setLeaderActive` from return object
- [x] Remove `clearLeaderTimeout` from return object
- [x] Remove `startLeaderTimeout` from return object

---

## Phase 6: Rewrite App.tsx

### 6.1 Remove imports from src/app.tsx
- [x] Remove `OnboardingWizard` import from `./components/onboarding`
- [x] Remove `LeaderHints` import from `./components/LeaderHints`
- [x] Remove `matchesLeaderKey` from `./lib/keybinds` import
- [x] Remove `matchesSingleKey` from `./lib/keybinds` import
- [x] Remove `createLeaderBindingHandler` from `./lib/keybinds` import
- [x] Remove `leaderKeyToSequence` from `./lib/keybinds` import
- [x] Remove `KeybindAction` type import from `./lib/keybinds`
- [x] Keep only `matchesKeybind` import from `./lib/keybinds`

### 6.2 Remove wizard state signals from src/app.tsx
- [x] Delete `isFirstRun` memo
- [x] Delete `wizardCompleted` signal
- [x] Delete `forceOnboarding` signal
- [x] Delete `shouldShowWizard` memo
- [x] Delete `showHints` signal
- [x] Delete `hintsTimeout` variable

### 6.3 Remove wizard handlers from src/app.tsx
- [x] Delete `triggerOnboarding()` function
- [x] Delete `handleWizardComplete()` function
- [x] Delete `handleWizardSkip()` function

### 6.4 Simplify persistAppsConfig() in src/app.tsx
- [x] Remove `keybindsOverride` parameter
- [x] Remove keybinds from `nextConfig` object
- [x] Remove `if (keybindsOverride)` block

### 6.5 Remove leader config extraction from src/app.tsx
- [x] Delete `const leaderConfig = props.config.keybinds.leader`
- [x] Delete `const leaderBindings = props.config.keybinds.bindings`

### 6.6 Remove action handlers object from src/app.tsx
- [x] Delete entire `actionHandlers` object (Partial<Record<KeybindAction, () => void>>)
- [x] Delete `handleLeaderBinding` creation (createLeaderBindingHandler call)
- [x] Delete `cancelLeader()` helper function

### 6.7 Add double-tap state variable in src/app.tsx
- [x] Add `let lastCtrlATime = 0` near other state variables (after `lastGTime` signal)

### 6.8 Rewrite keyboard handler in src/app.tsx - Modal handling
- [x] Keep existing modal escape handling logic
- [x] Remove `if (uiStore.store.leaderActive) { cancelLeader() }` block

### 6.9 Rewrite keyboard handler in src/app.tsx - Ctrl+A toggle
- [x] Replace leader key detection with `if (matchesKeybind(event, "ctrl+a"))`
- [x] Add double-tap detection: check `lastCtrlATime` within 500ms
- [x] If double-tap in terminal mode: write `"\x01"` to PTY, reset timer, return
- [x] Otherwise: update `lastCtrlATime`, call `tabsStore.toggleFocus()`, return

### 6.10 Rewrite keyboard handler in src/app.tsx - Terminal mode
- [x] Remove all leader state machine code
- [x] In terminal mode: pass `event.sequence` directly to PTY
- [x] Return early after terminal mode handling

### 6.11 Rewrite keyboard handler in src/app.tsx - Tabs mode Ctrl+C
- [x] Keep Ctrl+C ignore logic in tabs mode
- [x] Remove "Press Leader+q to quit" message, just ignore silently

### 6.12 Rewrite keyboard handler in src/app.tsx - gg/G navigation
- [x] Keep existing `g` double-tap logic for go-to-top
- [x] Keep existing `G` (shift+g) logic for go-to-bottom
- [x] Keep `lastGTime` reset for other keys

### 6.13 Rewrite keyboard handler in src/app.tsx - Switch statement
- [x] Add case `"j"` / `"down"`: call `handleTabNavigation("down")`
- [x] Add case `"k"` / `"up"`: call `handleTabNavigation("up")`
- [x] Add case `"return"` / `"enter"`: call `handleSelectApp()` for selected entry
- [x] Add case `"space"` / `" "`: call `uiStore.openModal("command-palette")`
- [x] Add case `"t"`: call `uiStore.openModal("add-tab")`
- [x] Add case `"e"`: call `openEditModal()` for selected entry
- [x] Add case `"x"`: call `stopApp()` for selected entry if running
- [x] Add case `"r"`: call `restartApp()` for selected entry if running
- [x] Add case `"q"`: keep existing quit logic
- [x] Add default case for `K` (shift+k): call `stopAllApps({ showMessage: true })`

### 6.14 Remove wizard JSX from src/app.tsx
- [x] Remove `<Show when={!shouldShowWizard()} fallback={<OnboardingWizard ... />}>` wrapper
- [x] Keep inner content, remove the Show wrapper entirely

### 6.15 Update StatusBar props in src/app.tsx
- [x] Remove `leader={props.config.keybinds.leader}` prop
- [x] Remove `bindings={props.config.keybinds.bindings}` prop
- [x] Remove `leaderActive={uiStore.store.leaderActive}` prop

### 6.16 Update TerminalPane props in src/app.tsx
- [x] Remove `leaderKey={props.config.keybinds.leader.key}` prop
- [x] Remove `newTabBinding={props.config.keybinds.bindings.new_tab}` prop

### 6.17 Remove LeaderHints JSX from src/app.tsx
- [x] Delete `<Show when={uiStore.store.leaderActive && showHints()}>` block
- [x] Delete `<LeaderHints ... />` component

### 6.18 Update CommandPalette onGlobalAction in src/app.tsx
- [x] Remove `if (action === "rerun_onboarding")` block
- [x] Keep theme selection handling

---

## Phase 7: Rewrite StatusBar

### 7.1 Update imports in src/components/StatusBar.tsx
- [x] Remove `LeaderConfig, LeaderBindings` from types import
- [x] Remove `formatLeaderKeybind` from keybinds import
- [x] Keep `ThemeConfig, FocusMode` imports

### 7.2 Update props interface in src/components/StatusBar.tsx
- [x] Remove `leader: LeaderConfig` from StatusBarProps
- [x] Remove `bindings: LeaderBindings` from StatusBarProps
- [x] Remove `leaderActive?: boolean` from StatusBarProps

### 7.3 Rewrite left section in src/components/StatusBar.tsx
- [x] Remove `<Show when={props.leaderActive} ...>` conditional
- [x] Add `<Show when={props.focusMode === "tabs"} ...>` conditional
- [x] Tabs mode text: `" j/k:Nav  gg/G:Jump  Enter:Select  Space:Palette  t:New  e:Edit  x:Stop  r:Restart  K:KillAll  q:Quit  Ctrl+A:Terminal"`
- [x] Terminal mode fallback text: `" Ctrl+A:Switch to Tabs"`

### 7.4 Remove formatLeaderKey function from src/components/StatusBar.tsx
- [x] Delete the local `formatLeaderKey()` helper function (no longer needed)

---

## Phase 8: Update TerminalPane

### 8.1 Update imports in src/components/TerminalPane.tsx
- [x] Remove `formatLeaderKeybind` import from `../lib/keybinds`

### 8.2 Update props interface in src/components/TerminalPane.tsx
- [x] Remove `leaderKey: string` from TerminalPaneProps
- [x] Remove `newTabBinding: string` from TerminalPaneProps

### 8.3 Update "no app selected" text in src/components/TerminalPane.tsx
- [x] Change from `Press {formatLeaderKeybind(...)} to add one.`
- [x] Change to `No app selected. Press 't' to add one.`

---

## Phase 9: Update CommandPalette

### 9.1 Update GlobalAction type in src/components/CommandPalette.tsx
- [x] Remove `"rerun_onboarding"` from GlobalAction union type
- [x] Keep `{ type: "set_theme"; themeId: string }` variant

### 9.2 Update GlobalCommand interface in src/components/CommandPalette.tsx
- [x] Change `id` type from `"rerun_onboarding"` to `string` (or remove if no other global commands)

### 9.3 Remove rerun_onboarding from GLOBAL_COMMANDS in src/components/CommandPalette.tsx
- [x] Delete the `rerun_onboarding` entry from GLOBAL_COMMANDS array
- [x] If array is now empty, consider removing GLOBAL_COMMANDS entirely or leave empty

---

## Phase 10: Enhance AddTabModal

### 10.1 Add imports to src/components/AddTabModal.tsx
- [x] Add `import { APP_PRESETS, type AppPreset } from "../lib/presets"`
- [x] Add `import { execSync } from "child_process"`
- [x] Add `createMemo` to solid-js imports

### 10.2 Add preset availability check in src/components/AddTabModal.tsx
- [x] Add `checkAvailability(command: string): boolean` function
- [x] Use `execSync(\`which ${command.split(" ")[0]}\`, { stdio: "ignore" })` in try/catch
- [x] Return true if successful, false if throws

### 10.3 Add preset state in src/components/AddTabModal.tsx
- [x] Add `const [mode, setMode] = createSignal<"preset" | "custom">("preset")`
- [x] Add `const [selectedPresetIndex, setSelectedPresetIndex] = createSignal(0)`

### 10.4 Add presets with availability memo in src/components/AddTabModal.tsx
- [x] Create `presetsWithAvailability` memo that maps APP_PRESETS with availability
- [x] Sort available presets first, unavailable last

### 10.5 Add preset selection handler in src/components/AddTabModal.tsx
- [x] Add `handlePresetSelect(preset: AppPreset)` function
- [x] Call `props.onAdd({ name: preset.name, command: preset.command, cwd: "~", autostart: false })`

### 10.6 Update keyboard handler in src/components/AddTabModal.tsx - Mode switching
- [x] Add Tab key handling to toggle between preset/custom mode
- [x] Update `setMode()` when Tab is pressed

### 10.7 Update keyboard handler in src/components/AddTabModal.tsx - Preset mode navigation
- [x] In preset mode: j/k or up/down navigates `selectedPresetIndex`
- [x] In preset mode: Enter selects current preset and calls `handlePresetSelect()`
- [x] In preset mode: Escape closes modal

### 10.8 Update keyboard handler in src/components/AddTabModal.tsx - Custom mode
- [x] In custom mode: use up/down for field navigation (Tab now toggles mode)
- [x] In custom mode: keep existing character input handling
- [x] In custom mode: Enter submits custom app form

### 10.9 Update JSX layout in src/components/AddTabModal.tsx - Modal size
- [x] Increase modal height from 11 to ~20 lines to accommodate preset list
- [ ] Adjust width if needed for longer preset names

### 10.10 Update JSX layout in src/components/AddTabModal.tsx - Mode tabs
- [ ] Add mode tabs row at top: `[Presets] [Custom]`
- [ ] Highlight active mode tab with `props.theme.primary` background
- [ ] Style inactive mode tab with `props.theme.muted` color

### 10.11 Update JSX layout in src/components/AddTabModal.tsx - Preset list
- [ ] Add preset list section (show when `mode() === "preset"`)
- [ ] Render each preset as a row with name and command
- [ ] Show availability indicator: `[*]` prefix for available, grayed out for unavailable
- [ ] Highlight selected preset row with `props.theme.primary` background
- [ ] Add scrolling if preset list exceeds available height

### 10.12 Update JSX layout in src/components/AddTabModal.tsx - Custom form
- [ ] Wrap existing form fields in `<Show when={mode() === "custom"}>` conditional
- [ ] Keep all existing form field rendering logic

### 10.13 Update JSX layout in src/components/AddTabModal.tsx - Footer
- [ ] Update footer hints based on mode
- [ ] Preset mode: `Enter:Select | Tab:Custom | Esc:Cancel | j/k:Navigate`
- [ ] Custom mode: `Enter:Add | Tab:Presets | Esc:Cancel | Tab:Next field`

---

## Phase 11: Update Tests

### 11.1 Remove deleted function tests from src/lib/keybinds.test.ts
- [x] Delete `describe("matchesLeaderKey", ...)` block
- [x] Delete `describe("matchesSingleKey", ...)` block
- [x] Delete `describe("formatLeaderKeybind", ...)` block
- [x] Delete `describe("formatLeaderKey", ...)` block
- [x] Delete `describe("leaderKeyToSequence", ...)` block
- [x] Delete `describe("createLeaderBindingHandler", ...)` block

### 11.2 Remove key-capture tests from src/lib/keybinds.test.ts
- [x] Delete `describe("eventToKeybindString", ...)` block
- [x] Delete `describe("isValidLeaderKey", ...)` block
- [x] Remove `import { eventToKeybindString, isValidLeaderKey } from "./key-capture"`

### 11.3 Verify remaining tests pass
- [x] Keep `describe("parseKeybind", ...)` tests
- [x] Keep `describe("matchesKeybind", ...)` tests
- [x] Keep `describe("formatKeybind", ...)` tests (if exists)
- [x] Run `bun test src/lib/keybinds.test.ts` to verify

---

## Phase 12: Update Documentation

### 12.1 Delete obsolete docs
- [ ] Delete `docs/keybindings.md`

### 12.2 Update docs/getting-started.md
- [ ] Remove "Onboarding Wizard Flow" section
- [ ] Remove wizard step descriptions
- [ ] Update "First Run" to explain empty app list
- [ ] Add instruction to press 't' to add apps
- [ ] Update "Quick Start Example" config (remove keybinds)

### 12.3 Update docs/configuration.md
- [ ] Remove any `keybinds:` section examples
- [ ] Remove leader key configuration references
- [ ] Update example configs to not include keybinds

### 12.4 Update docs/troubleshooting.md
- [ ] Remove leader key conflict troubleshooting
- [ ] Remove "keys not registering" leader-related section
- [ ] Add new section for Ctrl+A conflicts if needed

### 12.5 Update CONFIG.md
- [ ] Remove keybinds configuration section
- [ ] Update keyboard shortcuts documentation
- [ ] Document new fixed bindings (Ctrl+A toggle, j/k/gg/G, etc.)

### 12.6 Update README.md
- [ ] Remove leader key system description
- [ ] Update keyboard shortcuts section
- [ ] Remove onboarding wizard references
- [ ] Update screenshots if they show leader hints

---

## Phase 13: Update Config Files

### 13.1 Update config/default.yaml
- [ ] Remove entire `keybinds:` section
- [ ] Keep version, theme, tab_width, apps, session

### 13.2 Update examples/config.yaml (if exists)
- [ ] Remove entire `keybinds:` section
- [ ] Update any comments about keyboard shortcuts

---

## Phase 14: Final Verification

### 14.1 Run type checking
- [ ] Run `bun run typecheck`
- [ ] Fix any TypeScript errors

### 14.2 Run tests
- [ ] Run `bun test`
- [ ] Fix any failing tests

### 14.3 Manual testing - Basic navigation
- [ ] Start app with `bun run dev`
- [ ] Verify j/k moves selection in tabs list
- [ ] Verify gg goes to top of list
- [ ] Verify G goes to bottom of list
- [ ] Verify Enter starts/focuses selected app

### 14.4 Manual testing - App management
- [ ] Verify t opens Add Tab modal
- [ ] Verify preset selection works in Add Tab modal
- [ ] Verify custom app entry works
- [ ] Verify e opens Edit modal for selected app
- [ ] Verify x stops selected running app
- [ ] Verify r restarts selected running app
- [ ] Verify K (shift+k) kills all apps

### 14.5 Manual testing - Focus toggle
- [ ] Verify Ctrl+A switches from tabs to terminal mode
- [ ] Verify Ctrl+A switches from terminal to tabs mode
- [ ] Verify double-tap Ctrl+A sends \x01 to PTY in terminal mode
- [ ] Verify all keys pass through in terminal mode

### 14.6 Manual testing - Other shortcuts
- [ ] Verify Space opens command palette
- [ ] Verify q quits the application
- [ ] Verify Ctrl+C is ignored in tabs mode
- [ ] Verify Ctrl+C passes through in terminal mode

### 14.7 Manual testing - StatusBar
- [ ] Verify tabs mode shows full keybind hints
- [ ] Verify terminal mode shows "Ctrl+A:Switch to Tabs"
- [ ] Verify [TABS] / [TERMINAL] indicator updates

### 14.8 Build verification
- [ ] Run `bun run build`
- [ ] Verify build succeeds without errors
- [ ] Test built version works correctly

---

## Summary

**Total tasks:** ~150 checkboxes
**Estimated LOC removed:** ~2,400 lines
**Files deleted:** 16 files
**Files modified:** ~15 files
