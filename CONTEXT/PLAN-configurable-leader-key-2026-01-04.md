# Plan: Configurable Leader Key System

**Created:** 2026-01-04  
**Status:** Reviewed - Ready for Implementation  
**Scope:** V1 Implementation  
**Last Review:** 2026-01-04 (deep review against codebase)

## Problem Statement

The current keybinding system uses hardcoded `Ctrl+` modifiers for all actions, which causes conflicts across different platforms and terminal emulators:

- **macOS Terminal/iTerm**: `Ctrl+N` opens new window, `Ctrl+P` prints
- **GNOME Terminal**: `Ctrl+W` closes tab, `Ctrl+Q` closes window
- **Windows Terminal**: `Ctrl+T` opens new tab
- **tmux/screen users**: Nested `Ctrl+A` or `Ctrl+B` conflicts

Users need the ability to choose a leader key that doesn't conflict with their terminal environment.

---

## Current Repo Reality (Alignment Notes)

These are key facts from the current codebase that directly impact design choices:

- **Keybinding schema is flat** (`src/lib/config.ts:33-49`, `src/types/index.ts:12-24`): `keybinds.next_tab`, `keybinds.toggle_focus`, etc.
- **Keyboard handling is centralized in `src/app.tsx`** and uses a single `createKeybindHandler` (`src/app.tsx:311-433`).
- **Modals and onboarding steps have their own `useKeyboard` handlers** and `App` returns early when a modal is open, except for `Escape` handling (`src/app.tsx:90-101`). Leader handling must respect this.
- **Terminal focus mode passes most input straight to PTY** with a small exception for Ctrl+C and global keybinds (`src/app.tsx:403-428`).
- **`gg`/`G` navigation is hard-coded** in `src/app.tsx` and is not part of the keybind schema (`src/app.tsx:444-467`).
- **Default YAML has a conflict**: `command_palette` is `ctrl+p` but `prev_tab` is also `ctrl+p` (`config/default.yaml:15-23`).
- **StatusBar and onboarding hints embed key strings** (e.g., `Ctrl+T`, `Ctrl+A`) and will need updates if leader becomes default (`src/components/StatusBar.tsx`, `src/components/onboarding/*.tsx`).

---

## Goals

1. Allow users to select their preferred leader key during onboarding
2. Implement a tmux-style leader key state machine
3. Ensure terminal pane receives unmodified keystrokes (pass-through)
4. Provide clear visual feedback when leader key is active
5. Support double-tap leader for pass-through to terminal

## Non-Goals (V1)

- Full modal editing system (Zellij-style)
- Vim-style mode indicators
- Custom chord sequences beyond `leader + key` (existing `gg`/`G` remains hard-coded)
- Hot-reload of leader key configuration
- Multi-leader keys (e.g., tmux secondary prefix)

---

## Technical Design

### Current Codebase Constraints (Must Address)

- App-level keyboard handling is always active, even during onboarding; must short-circuit when the wizard is visible to avoid competing handlers.
- Keybind parsing lowercases keys and only has robust support for ctrl+letters; ctrl+space and ctrl+\ are not reliably matched today.
- Multi-key sequences like "gg" are currently hardcoded in App logic; the keybind system has no sequence support yet.
- Modals and onboarding steps handle their own keys; leader state must be cleared/ignored while a modal is open.
- Status bar and onboarding copy hardcode Ctrl+* hints; leader UX requires updated strings.

### Architecture Overview

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

### Leader Key State Machine

| State | Event | Action | Next State |
|-------|-------|--------|------------|
| `inactive` | Leader key pressed | Start timeout, show indicator | `active` |
| `active` | Bound key pressed | Execute action | `inactive` |
| `active` | Leader key pressed (double-tap) | Send leader to PTY | `inactive` |
| `active` | Unknown key pressed | Cancel leader | `inactive` |
| `active` | Timeout (1000ms default) | Cancel | `inactive` |

### Focus Mode vs Leader State

The system has two orthogonal concerns:

1. **Focus Mode** (`tabs` | `terminal`): Where input goes
2. **Leader State** (`inactive` | `active`): Whether we're in a leader sequence

When in `terminal` focus mode:
- Leader key triggers `active` state (same as tabs mode)
- Bound keys in `active` state execute global actions (like `toggle_focus`)
- Non-leader keys pass through to PTY
- This allows escaping terminal focus without conflicting keybinds

### Modal Priority (Critical)

When a modal is open, `App` returns early and does not run global keybinds.
Leader logic **must be disabled while any modal is open**, except `Escape` which is already handled by `App`.
This preserves current modal keyboard behavior and avoids broken input inside modals.

---

## Configuration Schema

### Current Schema (`src/lib/config.ts:33-49`)

```typescript
const KeybindSchema = z.object({
  next_tab: z.string().default("ctrl+n"),
  prev_tab: z.string().default("ctrl+p"),
  // ... other keybinds
})
```

### Proposed Schema Changes (V2)

```typescript
const LeaderSchema = z.object({
  key: z.string().default("ctrl+a"),           // Leader key
  timeout: z.number().default(1000),           // ms before auto-cancel
  show_hints: z.boolean().default(true),       // Show hint popup after delay
  hint_delay: z.number().default(300),         // ms before showing hints
})

const KeybindSchema = z.object({
  leader: LeaderSchema.default({}),

  // Leader-prefixed bindings (single keys only)
  bindings: z.object({
    next_tab: z.string().default("n"),
    prev_tab: z.string().default("p"),
    close_tab: z.string().default("w"),
    new_tab: z.string().default("t"),
    toggle_focus: z.string().default("a"),
    edit_app: z.string().default("e"),
    restart_app: z.string().default("r"),
    command_palette: z.string().default("space"),
    stop_app: z.string().default("x"),
    kill_all: z.string().default("K"),
    quit: z.string().default("q"),
  }).default({}),

  // Direct bindings (no leader required, tabs mode only)
  // NOTE: V1 only supports single-key direct bindings. "gg" remains hard-coded.
  direct: z.object({
    navigate_up: z.string().default("k"),
    navigate_down: z.string().default("j"),
    select: z.string().default("enter"),
    go_top: z.string().default("g"),
    go_bottom: z.string().default("G"),
  }).default({}),
})
```

### Migration Guidance

- Detect `keybinds.*` flat format as V1 and auto-migrate to V2.
- Preserve user customizations.
- Assign the existing `toggle_focus` to `leader.key` when it matches a prefix-style combo (default `ctrl+a`).
- **Critical**: Resolve the current default conflict (`command_palette` and `prev_tab` both `ctrl+p`) during migration by mapping `command_palette` to `leader + space` in V2.

---

## Onboarding Changes

### New Wizard Step: Keybinding Setup

Insert between "Welcome" and "Presets" steps.

**Step Flow:**
1. Welcome
2. **Keybinding Setup** (NEW)
3. Presets
4. Custom Apps
5. Confirmation

### Leader Key Selection UI

```
+------------------------------------------+
|     Step 2 of 5: Keybinding Setup        |
|   [*]---[*]---[ ]---[ ]---[ ]            |
+------------------------------------------+
|                                          |
|  Choose your leader key:                 |
|                                          |
|  All commands use a leader key prefix.   |
|  For example: Leader + n = next tab      |
|                                          |
|  > [*] Ctrl+A  (tmux-style, recommended) |
|    [ ] Ctrl+B  (tmux alternate)          |
|    [ ] Ctrl+\  (screen-style)            |
|    [ ] Alt+Space (desktop-style)         |
|    [ ] Custom...                         |
|                                          |
|  Tip: Choose a key your terminal         |
|  doesn't use for other functions.        |
|                                          |
|  [Back]                    [Next]        |
+------------------------------------------+
```

### Custom Leader Key Input

When "Custom..." is selected:

```
+------------------------------------------+
|  Enter custom leader key:                |
|                                          |
|  Press the key combination you want      |
|  to use as your leader key...            |
|                                          |
|  Detected: [Ctrl+Space]                  |
|                                          |
|  [Cancel]                   [Use This]   |
+------------------------------------------+
```

### Onboarding Save Behavior (Critical)

Onboarding currently only saves apps and does not modify keybinds.
The new step must update `props.config.keybinds` and persist the full config during completion.
This should follow the same save/error handling pattern used by `persistAppsConfig()`.

---

## Implementation Tasks

### Phase 1: Core Infrastructure

- [ ] **1.1** Add leader state to UI store (`src/stores/ui.ts`)
  - Add `leaderActive: boolean` and `leaderTimeout: ReturnType<typeof setTimeout> | null`
  - Add `setLeaderActive`, `startLeaderTimeout`, `clearLeaderTimeout`
  - Consider using a dedicated store if UI store begins mixing unrelated responsibilities

- [ ] **1.2** Update configuration schema (`src/lib/config.ts`)
  - Add `LeaderSchema` and refactor `KeybindSchema`
  - Add migration logic for existing configs (v1 -> v2)
  - Update `config/default.yaml` and resolve default conflicts

- [ ] **1.3** Update TypeScript types (`src/types/index.ts`)
  - Add `LeaderConfig`, update `KeybindConfig`, add `LeaderState`

- [ ] **1.4** Extend keybind helpers (`src/lib/keybinds.ts`)
  - Add `matchesLeaderKey(event, leaderKey)` (can reuse `matchesKeybind`)
  - Add `createLeaderHandler` for leader bindings
  - Keep `matchesKeybind` for direct bindings and modal-local shortcuts

### Phase 2: Keyboard Handler Refactor

- [ ] **2.1** Refactor keyboard handling in `src/app.tsx`
  - Extract keyboard logic to `useLeaderKeyboard` hook for clarity
  - Respect modal priority: if `uiStore.store.activeModal` is set, do not alter leader state
  - Implement leader logic in both focus modes

- [ ] **2.2** Update keybind handler factory
  - Modify `createKeybindHandler` to work with `direct` bindings
  - Implement separate handlers for `leader` vs `direct`
  - V1: keep `gg`/`G` navigation hard-coded (do not treat as multi-key bindings)

- [ ] **2.3** Add leader timeout management
  - Start timeout on leader activation
  - Clear timeout on any subsequent keypress
  - Reset leader state on timeout

### Phase 3: Onboarding Integration

- [ ] **3.1** Create keybinding step component (`src/components/onboarding/KeybindingStep.tsx`)
  - Leader key selection grid with presets
  - Custom key capture modal
  - Preview of resulting keybinds
  - Keyboard navigation support

- [ ] **3.2** Add keybinding step types (`src/components/onboarding/types.ts`)
  - Add `"keybindings"` to `WizardStep`
  - Add `selectedLeaderKey: string` to wizard state
  - Add `KeybindingStepProps` interface

- [ ] **3.3** Update OnboardingWizard (`src/components/onboarding/OnboardingWizard.tsx`)
  - Add new step between welcome and presets
  - Update step navigation (5 steps instead of 4)
  - Pass leader key selection to config on complete
  - Update step indicator

- [ ] **3.4** Create key capture utility (`src/lib/key-capture.ts`)
  - Capture raw key events from `@opentui/core`
  - Convert captured event to config string
  - Validate key is usable as leader (exclude Enter/Escape)

### Phase 4: Visual Feedback

- [ ] **4.1** Update StatusBar (`src/components/StatusBar.tsx`)
  - Add leader state indicator `[LEADER]` or `^A`
  - Update keybind labels to show `Leader + key` format

- [ ] **4.2** Create LeaderHints overlay (`src/components/LeaderHints.tsx`)
  - Popup after `hint_delay`
  - Show available leader bindings
  - Auto-dismiss when leader deactivates

- [ ] **4.3** Integrate hints into App
  - Conditionally render `LeaderHints`
  - Honor `show_hints` config

### Phase 5: Documentation & Polish

- [ ] **5.1** Migration and defaults
  - Ensure v1 configs migrate automatically
  - Preserve user overrides
  - Update `config/default.yaml` and ensure command palette binding is unique

- [ ] **5.2** Update UI hints in onboarding and modals
  - Replace hard-coded `Ctrl+T`, `Ctrl+A` text with leader equivalents
  - Update `TerminalPane` fallback message

- [ ] **5.3** Update documentation (`docs/keybindings.md`)
  - Document leader key concept
  - List all default bindings
  - Explain customization options

- [ ] **5.4** Manual testing matrix
  - Test on Linux (GNOME Terminal, Konsole, Alacritty)
  - Test on macOS (Terminal.app, iTerm2, WezTerm)
  - Test nested in tmux/screen
  - Test with various leader key choices

---

## File References

### Internal Files to Modify

| File | Purpose | Changes |
|------|---------|---------|
| `src/lib/config.ts` | Config schema | Add LeaderSchema, refactor KeybindSchema, migration |
| `src/lib/keybinds.ts` | Keybind parsing/matching | Leader matching + handlers |
| `src/stores/ui.ts` | UI state | Add leader state + timeout |
| `src/types/index.ts` | Type definitions | Update KeybindConfig, add LeaderConfig |
| `src/app.tsx` | Keyboard handling | Implement leader state machine |
| `src/components/StatusBar.tsx` | Status display | Add leader indicator + updated hints |
| `src/components/onboarding/OnboardingWizard.tsx` | Wizard container | Add keybinding step |
| `src/components/onboarding/types.ts` | Wizard types | Add keybinding step type |
| `src/components/onboarding/*.tsx` | Onboarding steps | Update footer hints |
| `src/components/TerminalPane.tsx` | Empty state hint | Replace Ctrl+T text |
| `config/default.yaml` | Default config | Update to new schema |
| `docs/keybindings.md` | Documentation | Add leader key docs |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/onboarding/KeybindingStep.tsx` | Leader key selection step |
| `src/components/LeaderHints.tsx` | Hint overlay component |
| `src/lib/key-capture.ts` | Key capture utility |
| `src/hooks/useLeaderKeyboard.ts` | Extract keyboard logic |

---

## Validation Criteria

### Phase 1: Core Infrastructure
- [ ] Config loads with new schema without errors
- [ ] Old v1 configs are auto-migrated
- [ ] `leaderActive` state toggles correctly in store
- [ ] Leader timeout fires after configured delay

### Phase 2: Keyboard Handler
- [ ] Leader key press activates leader state
- [ ] Second key after leader executes bound action
- [ ] Double-tap leader sends key to terminal
- [ ] Unknown key after leader cancels state
- [ ] Timeout cancels leader state
- [ ] All existing keybinds still work (regression)
- [ ] Modal input unaffected by leader logic

### Phase 3: Onboarding
- [ ] New step appears in wizard flow
- [ ] Preset leader keys selectable
- [ ] Custom key capture works
- [ ] Selected leader persists to config

### Phase 4: Visual Feedback
- [ ] Status bar shows leader indicator when active
- [ ] Indicator clears when leader deactivates
- [ ] Hints appear after delay (if enabled)
- [ ] Hints dismiss on action or cancel

### Phase 5: Testing
- [ ] Works in Alacritty on Linux
- [ ] Works in iTerm2 on macOS
- [ ] Works nested inside tmux with different leader
- [ ] Config migration preserves user bindings

---

## Open Questions

1. **Escape key behavior**: Should `Escape` always cancel leader state, or should it be configurable?
   - **Recommendation**: Always cancel on Escape

2. **Leader in modals**: Should leader key work when a modal is open?
   - **Recommendation**: No, modals should handle their own keys (matches current behavior)

3. **Multiple leader keys**: Should we support multiple leaders (like tmux secondary prefix)?
   - **Recommendation**: Not for V1

4. **Sticky leader mode**: Should there be a "lock" mode that keeps leader active for multiple commands?
   - **Recommendation**: Not for V1

---

## Rollout Plan

1. **Alpha**: Implement behind feature flag, test internally
2. **Beta**: Release with migration, gather feedback
3. **Stable**: Default for new installs, prompted migration for existing

---

## Risk Mitigations

### Risk: Breaking terminal input in focus mode
- **Mitigation**: Preserve current Ctrl+C passthrough logic before any leader check. Test with interactive programs (vim, htop) that rely on raw input.
- **File**: `src/app.tsx:410-415`

### Risk: Modal input broken by leader state
- **Mitigation**: Clear leader state when modal opens; skip leader logic entirely when `uiStore.store.activeModal` is set.
- **File**: `src/app.tsx:391-401`

### Risk: Config migration breaks user customizations
- **Mitigation**: Write migration that preserves all user-set values; only add defaults for missing keys. Log migration actions for debugging.
- **File**: `src/lib/config.ts:112-148`

### Risk: StatusBar/UI hints become stale
- **Mitigation**: Create `formatLeaderKeybind(leaderKey, binding)` helper and use it everywhere hints are displayed.
- **Files**: `src/components/StatusBar.tsx:32-42`, `src/components/TerminalPane.tsx:29-31`

### Risk: Onboarding doesn't persist keybind choice
- **Mitigation**: Update `handleWizardComplete` to merge keybind config; follow same error handling as `persistAppsConfig`.
- **File**: `src/app.tsx:241-265`

---

## Detailed Keyboard Handler Design

### Current Flow (src/app.tsx:386-489)

```
useKeyboard(event) {
  1. If modal open → only handle Escape, return early
  2. If terminal focus:
     a. Ctrl+C → passthrough to PTY
     b. Check global keybinds → execute if match
     c. Otherwise → passthrough to PTY
  3. If tabs focus:
     a. Check global keybinds → execute if match
     b. Ctrl+C → show quit hint
     c. Handle gg/G navigation (hardcoded)
     d. Handle j/k/Enter navigation (hardcoded)
}
```

### Proposed Flow (with Leader)

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

### Implementation Notes

- Leader state lives in `uiStore` for global access
- Timeout ID also lives in store to allow cleanup
- `matchesLeaderKey` reuses `matchesKeybind` logic
- `handleLeaderBinding` uses new `bindings` config object
- Direct bindings remain hardcoded for V1 (no multi-key sequence support)

---

## Config Migration Implementation

### Detection Logic

```typescript
function migrateConfig(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const obj = raw as Record<string, unknown>
  
  // V1: flat keybinds with ctrl+ prefixes
  if (obj.keybinds && typeof obj.keybinds === 'object') {
    const kb = obj.keybinds as Record<string, unknown>
    // If no 'leader' key exists, assume V1
    if (!kb.leader) {
      return migrateV1ToV2(obj)
    }
  }
  return raw
}
```

### V1 to V2 Migration

```typescript
function migrateV1ToV2(config: Record<string, unknown>): Record<string, unknown> {
  const v1Keybinds = config.keybinds as Record<string, string>
  
  // Extract leader from toggle_focus (usually ctrl+a)
  const leaderKey = v1Keybinds.toggle_focus || 'ctrl+a'
  
  // Strip ctrl+ prefix to get binding key
  const stripPrefix = (k: string) => k.replace(/^ctrl\+/, '')
  
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
      bindings: {
        next_tab: stripPrefix(v1Keybinds.next_tab || 'ctrl+n'),
        prev_tab: stripPrefix(v1Keybinds.prev_tab || 'ctrl+p'),
        close_tab: stripPrefix(v1Keybinds.close_tab || 'ctrl+w'),
        new_tab: stripPrefix(v1Keybinds.new_tab || 'ctrl+t'),
        toggle_focus: 'a', // Leader + a to toggle (leader key itself)
        edit_app: stripPrefix(v1Keybinds.edit_app || 'ctrl+e'),
        restart_app: stripPrefix(v1Keybinds.restart_app || 'ctrl+shift+r'),
        command_palette: 'space', // Resolve conflict: was ctrl+p, now leader+space
        stop_app: stripPrefix(v1Keybinds.stop_app || 'ctrl+x'),
        kill_all: 'K',
        quit: stripPrefix(v1Keybinds.quit || 'ctrl+q'),
      },
      direct: {
        navigate_up: 'k',
        navigate_down: 'j',
        select: 'enter',
        go_top: 'g',
        go_bottom: 'G',
      },
    },
  }
}
```

### Migration Location

Add migration call in `loadConfig()` at `src/lib/config.ts:138-141`:

```typescript
const content = await readFile(configPath, "utf-8")
const parsed = parse(content)
const migrated = migrateConfig(parsed) // NEW
const validated = ConfigSchema.parse(migrated)
```

---

## UI Text Updates Required

### StatusBar (`src/components/StatusBar.tsx:32-42`)

**Before:**
```
Ctrl+A:Focus | Ctrl+Space:Palette | Ctrl+E:Edit | ...
```

**After:**
```
^A+a:Focus | ^A+Space:Palette | ^A+e:Edit | ...
```

Or with helper:
```typescript
formatLeaderHint(leader, binding) // "^A+n" or "Leader+n"
```

### TerminalPane (`src/components/TerminalPane.tsx:29-31`)

**Before:**
```
No app selected. Press Ctrl+T to add one.
```

**After:**
```
No app selected. Press {formatLeaderHint(leader, 't')} to add one.
```

### Onboarding Steps

| File | Line | Current | Update |
|------|------|---------|--------|
| `CustomAppStep.tsx` | 305 | `Ctrl+A: Add` | Use new leader |
| `ConfirmationStep.tsx` | 137 | `Ctrl+T` | Use new leader |
| `PresetSelectionStep.tsx` | 267 | N/A (uses j/k) | No change |

---

## Testing Strategy

### Unit Tests (New)

- `matchesLeaderKey` correctly identifies leader combos
- `migrateConfig` preserves user values and applies defaults
- `formatLeaderHint` produces correct display strings

### Integration Tests (Manual)

| Scenario | Expected |
|----------|----------|
| Press leader, then `n` | Next tab selected |
| Press leader, wait 1.1s | Leader cancelled, no action |
| Press leader twice | Leader key sent to PTY |
| Press leader, then unknown | Leader cancelled |
| Open modal while leader active | Leader cleared |
| Type in modal after leader pressed | Modal receives input normally |
| Terminal focus: Ctrl+C | Sent to PTY (not intercepted) |
| Tabs focus: `gg` | Go to top (hardcoded) |

### Regression Tests

- All existing keybinds still work with V2 config
- V1 config auto-migrates without data loss
- Session persistence unaffected
- Onboarding completes and saves config

---

## Appendix: Leader Key Presets

| Preset | Key | Notes |
|--------|-----|-------|
| tmux-style | `Ctrl+A` | Most common, conflicts with readline "go to start" |
| tmux-alt | `Ctrl+B` | tmux default, less conflict |
| screen-style | `Ctrl+\` | GNU Screen default |
| desktop-style | `Alt+Space` | Familiar for Windows users |
| vim-style | `Ctrl+W` | Window commands, conflicts with "close" |
| emacs-style | `Ctrl+X` | Common prefix, conflicts with "cut" |

---

## Appendix: Migration Example

**Before (v1):**
```yaml
version: 1
keybinds:
  next_tab: "ctrl+n"
  prev_tab: "ctrl+p"
  toggle_focus: "ctrl+a"
```

**After (v2):**
```yaml
version: 2
keybinds:
  leader:
    key: "ctrl+a"
    timeout: 1000
  bindings:
    next_tab: "n"
    prev_tab: "p"
    toggle_focus: "a"
  direct:
    navigate_up: "k"
    navigate_down: "j"
```
