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
- [ ] Delete `KeybindAction` type
- [ ] Delete `matchesLeaderKey()` function
- [ ] Delete `matchesSingleKey()` function
- [ ] Delete `createLeaderBindingHandler()` function
- [ ] Delete `formatLeaderKeybind()` function
- [ ] Delete `formatLeaderKey()` function
- [ ] Delete `leaderKeyToSequence()` function

### 4.2 Clean up imports in src/lib/keybinds.ts
- [ ] Remove `import type { LeaderBindings } from "../types"` (no longer exists)

### 4.3 Verify remaining exports
- [ ] Confirm `parseKeybind()` is exported
- [ ] Confirm `matchesKeybind()` is exported
- [ ] Confirm `formatKeybind()` is exported (may be useful)

---

## Phase 5: Clean Up UI Store

### 5.1 Remove leader state from src/stores/ui.ts
- [ ] Remove `leaderActive: boolean` from `UIStore` interface
- [ ] Remove `leaderTimeout: ReturnType<typeof setTimeout> | null` from `UIStore` interface
- [ ] Remove `leaderActivatedAt: number | null` from `UIStore` interface
- [ ] Remove `leaderActive: false` from initial store state
- [ ] Remove `leaderTimeout: null` from initial store state
- [ ] Remove `leaderActivatedAt: null` from initial store state

### 5.2 Remove leader functions from src/stores/ui.ts
- [ ] Delete `clearLeaderTimeout()` function
- [ ] Delete `setLeaderActive()` function
- [ ] Delete `startLeaderTimeout()` function
- [ ] Remove `setLeaderActive` from return object
- [ ] Remove `clearLeaderTimeout` from return object
- [ ] Remove `startLeaderTimeout` from return object

---

## Phase 6: Rewrite App.tsx

### 6.1 Remove imports from src/app.tsx
- [ ] Remove `OnboardingWizard` import from `./components/onboarding`
- [ ] Remove `LeaderHints` import from `./components/LeaderHints`
- [ ] Remove `matchesLeaderKey` from `./lib/keybinds` import
- [ ] Remove `matchesSingleKey` from `./lib/keybinds` import
- [ ] Remove `createLeaderBindingHandler` from `./lib/keybinds` import
- [ ] Remove `leaderKeyToSequence` from `./lib/keybinds` import
- [ ] Remove `KeybindAction` type import from `./lib/keybinds`
- [ ] Keep only `matchesKeybind` import from `./lib/keybinds`

### 6.2 Remove wizard state signals from src/app.tsx
- [ ] Delete `isFirstRun` memo
- [ ] Delete `wizardCompleted` signal
- [ ] Delete `forceOnboarding` signal
- [ ] Delete `shouldShowWizard` memo
- [ ] Delete `showHints` signal
- [ ] Delete `hintsTimeout` variable

### 6.3 Remove wizard handlers from src/app.tsx
- [ ] Delete `triggerOnboarding()` function
- [ ] Delete `handleWizardComplete()` function
- [ ] Delete `handleWizardSkip()` function

### 6.4 Simplify persistAppsConfig() in src/app.tsx
- [ ] Remove `keybindsOverride` parameter
- [ ] Remove keybinds from `nextConfig` object
- [ ] Remove `if (keybindsOverride)` block

### 6.5 Remove leader config extraction from src/app.tsx
- [ ] Delete `const leaderConfig = props.config.keybinds.leader`
- [ ] Delete `const leaderBindings = props.config.keybinds.bindings`

### 6.6 Remove action handlers object from src/app.tsx
- [ ] Delete entire `actionHandlers` object (Partial<Record<KeybindAction, () => void>>)
- [ ] Delete `handleLeaderBinding` creation (createLeaderBindingHandler call)
- [ ] Delete `cancelLeader()` helper function

### 6.7 Add double-tap state variable in src/app.tsx
- [ ] Add `let lastCtrlATime = 0` near other state variables (after `lastGTime` signal)

### 6.8 Rewrite keyboard handler in src/app.tsx - Modal handling
- [ ] Keep existing modal escape handling logic
- [ ] Remove `if (uiStore.store.leaderActive) { cancelLeader() }` block

### 6.9 Rewrite keyboard handler in src/app.tsx - Ctrl+A toggle
- [ ] Replace leader key detection with `if (matchesKeybind(event, "ctrl+a"))`
- [ ] Add double-tap detection: check `lastCtrlATime` within 500ms
- [ ] If double-tap in terminal mode: write `"\x01"` to PTY, reset timer, return
- [ ] Otherwise: update `lastCtrlATime`, call `tabsStore.toggleFocus()`, return

### 6.10 Rewrite keyboard handler in src/app.tsx - Terminal mode
- [ ] Remove all leader state machine code
- [ ] In terminal mode: pass `event.sequence` directly to PTY
- [ ] Return early after terminal mode handling

### 6.11 Rewrite keyboard handler in src/app.tsx - Tabs mode Ctrl+C
- [ ] Keep Ctrl+C ignore logic in tabs mode
- [ ] Remove "Press Leader+q to quit" message, just ignore silently

### 6.12 Rewrite keyboard handler in src/app.tsx - gg/G navigation
- [ ] Keep existing `g` double-tap logic for go-to-top
- [ ] Keep existing `G` (shift+g) logic for go-to-bottom
- [ ] Keep `lastGTime` reset for other keys

### 6.13 Rewrite keyboard handler in src/app.tsx - Switch statement
- [ ] Add case `"j"` / `"down"`: call `handleTabNavigation("down")`
- [ ] Add case `"k"` / `"up"`: call `handleTabNavigation("up")`
- [ ] Add case `"return"` / `"enter"`: call `handleSelectApp()` for selected entry
- [ ] Add case `"space"` / `" "`: call `uiStore.openModal("command-palette")`
- [ ] Add case `"t"`: call `uiStore.openModal("add-tab")`
- [ ] Add case `"e"`: call `openEditModal()` for selected entry
- [ ] Add case `"x"`: call `stopApp()` for selected entry if running
- [ ] Add case `"r"`: call `restartApp()` for selected entry if running
- [ ] Add case `"q"`: keep existing quit logic
- [ ] Add default case for `K` (shift+k): call `stopAllApps({ showMessage: true })`

### 6.14 Remove wizard JSX from src/app.tsx
- [ ] Remove `<Show when={!shouldShowWizard()} fallback={<OnboardingWizard ... />}>` wrapper
- [ ] Keep inner content, remove the Show wrapper entirely

### 6.15 Update StatusBar props in src/app.tsx
- [ ] Remove `leader={props.config.keybinds.leader}` prop
- [ ] Remove `bindings={props.config.keybinds.bindings}` prop
- [ ] Remove `leaderActive={uiStore.store.leaderActive}` prop

### 6.16 Update TerminalPane props in src/app.tsx
- [ ] Remove `leaderKey={props.config.keybinds.leader.key}` prop
- [ ] Remove `newTabBinding={props.config.keybinds.bindings.new_tab}` prop

### 6.17 Remove LeaderHints JSX from src/app.tsx
- [ ] Delete `<Show when={uiStore.store.leaderActive && showHints()}>` block
- [ ] Delete `<LeaderHints ... />` component

### 6.18 Update CommandPalette onGlobalAction in src/app.tsx
- [ ] Remove `if (action === "rerun_onboarding")` block
- [ ] Keep theme selection handling

---

## Phase 7: Rewrite StatusBar

### 7.1 Update imports in src/components/StatusBar.tsx
- [ ] Remove `LeaderConfig, LeaderBindings` from types import
- [ ] Remove `formatLeaderKeybind` from keybinds import
- [ ] Keep `ThemeConfig, FocusMode` imports

### 7.2 Update props interface in src/components/StatusBar.tsx
- [ ] Remove `leader: LeaderConfig` from StatusBarProps
- [ ] Remove `bindings: LeaderBindings` from StatusBarProps
- [ ] Remove `leaderActive?: boolean` from StatusBarProps

### 7.3 Rewrite left section in src/components/StatusBar.tsx
- [ ] Remove `<Show when={props.leaderActive} ...>` conditional
- [ ] Add `<Show when={props.focusMode === "tabs"} ...>` conditional
- [ ] Tabs mode text: `" j/k:Nav  gg/G:Jump  Enter:Select  Space:Palette  t:New  e:Edit  x:Stop  r:Restart  K:KillAll  q:Quit  Ctrl+A:Terminal"`
- [ ] Terminal mode fallback text: `" Ctrl+A:Switch to Tabs"`

### 7.4 Remove formatLeaderKey function from src/components/StatusBar.tsx
- [ ] Delete the local `formatLeaderKey()` helper function (no longer needed)

---

## Phase 8: Update TerminalPane

### 8.1 Update imports in src/components/TerminalPane.tsx
- [ ] Remove `formatLeaderKeybind` import from `../lib/keybinds`

### 8.2 Update props interface in src/components/TerminalPane.tsx
- [ ] Remove `leaderKey: string` from TerminalPaneProps
- [ ] Remove `newTabBinding: string` from TerminalPaneProps

### 8.3 Update "no app selected" text in src/components/TerminalPane.tsx
- [ ] Change from `Press {formatLeaderKeybind(...)} to add one.`
- [ ] Change to `No app selected. Press 't' to add one.`

---

## Phase 9: Update CommandPalette

### 9.1 Update GlobalAction type in src/components/CommandPalette.tsx
- [ ] Remove `"rerun_onboarding"` from GlobalAction union type
- [ ] Keep `{ type: "set_theme"; themeId: string }` variant

### 9.2 Update GlobalCommand interface in src/components/CommandPalette.tsx
- [ ] Change `id` type from `"rerun_onboarding"` to `string` (or remove if no other global commands)

### 9.3 Remove rerun_onboarding from GLOBAL_COMMANDS in src/components/CommandPalette.tsx
- [ ] Delete the `rerun_onboarding` entry from GLOBAL_COMMANDS array
- [ ] If array is now empty, consider removing GLOBAL_COMMANDS entirely or leave empty

---

## Phase 10: Enhance AddTabModal

### 10.1 Add imports to src/components/AddTabModal.tsx
- [ ] Add `import { APP_PRESETS, type AppPreset } from "../lib/presets"`
- [ ] Add `import { execSync } from "child_process"`
- [ ] Add `createMemo` to solid-js imports

### 10.2 Add preset availability check in src/components/AddTabModal.tsx
- [ ] Add `checkAvailability(command: string): boolean` function
- [ ] Use `execSync(\`which ${command.split(" ")[0]}\`, { stdio: "ignore" })` in try/catch
- [ ] Return true if successful, false if throws

### 10.3 Add preset state in src/components/AddTabModal.tsx
- [ ] Add `const [mode, setMode] = createSignal<"preset" | "custom">("preset")`
- [ ] Add `const [selectedPresetIndex, setSelectedPresetIndex] = createSignal(0)`

### 10.4 Add presets with availability memo in src/components/AddTabModal.tsx
- [ ] Create `presetsWithAvailability` memo that maps APP_PRESETS with availability
- [ ] Sort available presets first, unavailable last

### 10.5 Add preset selection handler in src/components/AddTabModal.tsx
- [ ] Add `handlePresetSelect(preset: AppPreset)` function
- [ ] Call `props.onAdd({ name: preset.name, command: preset.command, cwd: "~", autostart: false })`

### 10.6 Update keyboard handler in src/components/AddTabModal.tsx - Mode switching
- [ ] Add Tab key handling to toggle between preset/custom mode
- [ ] Update `setMode()` when Tab is pressed

### 10.7 Update keyboard handler in src/components/AddTabModal.tsx - Preset mode navigation
- [ ] In preset mode: j/k or up/down navigates `selectedPresetIndex`
- [ ] In preset mode: Enter selects current preset and calls `handlePresetSelect()`
- [ ] In preset mode: Escape closes modal

### 10.8 Update keyboard handler in src/components/AddTabModal.tsx - Custom mode
- [ ] In custom mode: keep existing field navigation with Tab
- [ ] In custom mode: keep existing character input handling
- [ ] In custom mode: Enter submits custom app form

### 10.9 Update JSX layout in src/components/AddTabModal.tsx - Modal size
- [ ] Increase modal height from 11 to ~20 lines to accommodate preset list
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
- [ ] Delete `describe("matchesLeaderKey", ...)` block
- [ ] Delete `describe("matchesSingleKey", ...)` block
- [ ] Delete `describe("formatLeaderKeybind", ...)` block
- [ ] Delete `describe("formatLeaderKey", ...)` block
- [ ] Delete `describe("leaderKeyToSequence", ...)` block
- [ ] Delete `describe("createLeaderBindingHandler", ...)` block

### 11.2 Remove key-capture tests from src/lib/keybinds.test.ts
- [ ] Delete `describe("eventToKeybindString", ...)` block
- [ ] Delete `describe("isValidLeaderKey", ...)` block
- [ ] Remove `import { eventToKeybindString, isValidLeaderKey } from "./key-capture"`

### 11.3 Verify remaining tests pass
- [ ] Keep `describe("parseKeybind", ...)` tests
- [ ] Keep `describe("matchesKeybind", ...)` tests
- [ ] Keep `describe("formatKeybind", ...)` tests (if exists)
- [ ] Run `bun test src/lib/keybinds.test.ts` to verify

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
