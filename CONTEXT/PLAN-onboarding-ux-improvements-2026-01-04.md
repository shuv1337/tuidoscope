# Plan: Onboarding UX Improvements

**Created:** 2026-01-04  
**Status:** Pending Implementation  
**Scope:** Getting Started Wizard Enhancements

---

## Overview

This plan addresses several UX issues in the tuidoscope Getting Started (onboarding) wizard:

1. **Leader Key Tooltips** - Add explanatory tooltips for keybinding style presets
2. **Search Bar for App Selection** - Add filtering capability to find apps quickly
3. **Category Filtering** - Allow users to filter apps by category
4. **Show App Names** - Display both name and description for better app identification
5. **Selection Indicators** - Visual feedback for selected apps
6. **Fix Malformed App Names** - Fix rendering bug on review screen

---

## Issue Analysis

### Issue 1: Leader Key Screen Missing Tooltips

**Current State:**
- `src/components/onboarding/KeybindingStep.tsx` displays preset options like "tmux-style", "GNU Screen style" without explaining what these mean
- Users unfamiliar with terminal multiplexers won't understand the difference

**Current Code (`keybindingPresets.ts:13-44`):**
```typescript
export const LEADER_PRESETS: LeaderPreset[] = [
  { id: "tmux", key: "ctrl+a", name: "Ctrl+A", description: "tmux-style (recommended)" },
  { id: "tmux-alt", key: "ctrl+b", name: "Ctrl+B", description: "tmux alternate" },
  { id: "screen", key: "ctrl+\\", name: "Ctrl+\\", description: "GNU Screen style" },
  { id: "desktop", key: "alt+space", name: "Alt+Space", description: "Desktop-style" },
  { id: "custom", key: "", name: "Custom...", description: "Choose your own" },
]
```

**Required:**
- Add expanded descriptions explaining each style
- Show example key combinations for each style
- Display as a tooltip/help panel when user presses `?` or hovers

---

### Issue 2: No Search Bar on App Selection Screen

**Current State:**
- `src/components/onboarding/PresetSelectionStep.tsx` shows all ~30 apps in a scrollable list
- Users must scroll through entire list to find specific apps
- No way to quickly filter by name

**Required:**
- Add text input field at top for searching
- Filter list in real-time as user types
- Maintain vim-style navigation (j/k) while search is active

---

### Issue 3: No Category Filtering

**Current State:**
- Apps are visually grouped by category with headers (see `presets.ts:14-24`)
- Categories exist: shell, productivity, monitor, files, git, dev, editor, ai, utility
- No way to filter to show only one category

**Required:**
- Add category filter UI (tabs, dropdown, or sidebar)
- Allow users to focus on relevant app types
- Combine with search for powerful filtering

---

### Issue 4: App Names vs Descriptions

**Current State (PresetSelectionStep.tsx:237):**
```tsx
{" "}{preset.icon} {preset.name}
<text fg={...}> - {preset.description}</text>
```

- Already shows both name and description
- This issue appears to be already addressed in current implementation

**Verification Needed:**
- Confirm the name field in `presets.ts` is being displayed
- Example: `name: "Claude Code"` should show "Claude Code", not just "Anthropic AI coding agent"

---

### Issue 5: No Visual Selection Indicator

**Current State (PresetSelectionStep.tsx:218-228):**
```tsx
<text ...>
  {isSelected() ? "[x]" : "[ ]"}
</text>
```

- Already shows `[x]` checkbox for selected items
- Selected items show green color (`#22c55e`)

**Potential Enhancements:**
- Make selection more prominent (background highlight?)
- Add count badge showing "X selected"
- Already has count at bottom: `{props.selectedPresets.size} app(s) selected`

---

### Issue 6: Malformed App Names on Review Screen (BUG)

**Current State:**
Screenshot shows "Claude Code" rendered as `(claude)e Code` on the review screen.

**Root Cause Analysis:**
Looking at `ConfirmationStep.tsx:98-108`:
```tsx
<For each={selectedPresetApps()}>
  {(preset) => (
    <box height={1}>
      <text fg={props.theme.foreground}>
        {"  "}{preset.icon} {preset.name}
      </text>
      <text fg={props.theme.muted}> ({preset.command})</text>
    </box>
  )}
</For>
```

The bug appears to be a **text rendering/layout issue** where the two `<text>` elements are not being laid out sequentially on the same line. The `({preset.command})` text is overlapping or replacing part of the first `<text>` element.

**Expected rendering:**
```
  C Claude Code (claude)
```

**Actual rendering (from screenshot):**
```
  (claude)e Code
```

This suggests the icon `C` and first part of the name are being overwritten by `(claude)`.

**Likely Fix:**
- Combine into single `<text>` element, OR
- Ensure proper horizontal layout using `<box flexDirection="row">`

---

## Technical Specifications

### Data Model Changes

#### Enhanced LeaderPreset Interface
**File:** `src/components/onboarding/keybindingPresets.ts`

```typescript
export interface LeaderPreset {
  id: string
  key: string
  name: string
  description: string
  // NEW: Extended information for tooltips
  tooltip: {
    origin: string           // "Used by tmux terminal multiplexer"
    example: string          // "Press Ctrl+A, then 'n' for next tab"
    conflicts?: string[]     // Common apps/shells that use this key
  }
}
```

#### Category Filter Type
```typescript
type CategoryFilter = 'all' | keyof typeof CATEGORY_LABELS
```

### Component State Changes

#### PresetSelectionStep New State
```typescript
const [searchQuery, setSearchQuery] = createSignal("")
const [activeCategory, setActiveCategory] = createSignal<CategoryFilter>("all")
const [isSearchFocused, setIsSearchFocused] = createSignal(false)
```

---

## Implementation Tasks

### Phase 1: Fix Critical Bug (Malformed Names)

- [ ] **1.1 Diagnose rendering issue in ConfirmationStep**
  - File: `src/components/onboarding/ConfirmationStep.tsx`
  - Lines: 98-108
  - Reproduce the bug locally
  - Test with different preset selections

- [ ] **1.2 Fix text layout for preset apps display**
  - Option A: Combine into single `<text>` element with template literal
  - Option B: Wrap in `<box flexDirection="row">` for proper layout
  - Ensure icon, name, and command all display correctly

- [ ] **1.3 Fix text layout for custom apps display**
  - File: `src/components/onboarding/ConfirmationStep.tsx`
  - Lines: 121-129
  - Apply same fix pattern as preset apps

- [ ] **1.4 Test all app types render correctly**
  - Test with multiple preset selections
  - Test with custom apps
  - Test with mix of both
  - Verify long names don't truncate improperly

### Phase 2: Leader Key Tooltips

- [ ] **2.1 Extend LeaderPreset interface with tooltip data**
  - File: `src/components/onboarding/keybindingPresets.ts`
  - Add `tooltip` object to interface
  - Keep backward compatible

- [ ] **2.2 Add tooltip content to each preset**
  - tmux: "The standard tmux prefix key. Press Ctrl+A, release, then press the action key (e.g., 'n' for next tab)"
  - tmux-alt: "Alternative tmux prefix. Some prefer this to avoid conflict with 'go to beginning of line' in shells"
  - screen: "Classic GNU Screen prefix key. Traditional terminal multiplexer binding"
  - desktop: "Familiar to users of desktop app launchers like Alfred/Spotlight"
  - custom: "Choose your own key combination with Ctrl, Alt, or Cmd modifier"

- [ ] **2.3 Create TooltipPanel component**
  - File: `src/components/onboarding/TooltipPanel.tsx` (new)
  - Displays expanded information for focused preset
  - Shows: origin, example keybinds, potential conflicts

- [ ] **2.4 Integrate tooltip into KeybindingStep**
  - File: `src/components/onboarding/KeybindingStep.tsx`
  - Show tooltip panel when preset is focused
  - OR add `?` key to toggle detailed help overlay

- [ ] **2.5 Add keyboard hint for tooltip**
  - Update footer hints to show "?: Help" or similar
  - Ensure consistent with other step footers

### Phase 3: Search Bar Implementation

- [ ] **3.1 Create SearchInput component**
  - File: `src/components/onboarding/SearchInput.tsx` (new)
  - Text input with placeholder "Search apps..."
  - Visual styling consistent with theme
  - Focus/blur state management

- [ ] **3.2 Add search state to PresetSelectionStep**
  - File: `src/components/onboarding/PresetSelectionStep.tsx`
  - `searchQuery` signal
  - `isSearchFocused` signal for keyboard handling

- [ ] **3.3 Implement search filtering logic**
  - Filter `APP_PRESETS` by search query
  - Search in: name, description, command, category
  - Case-insensitive matching
  - Maintain category headers for matching items

- [ ] **3.4 Update keyboard handler for search mode**
  - `/` key to focus search input
  - `Escape` to clear search and exit search mode
  - Letter keys type into search when focused
  - `j`/`k` still navigate filtered results

- [ ] **3.5 Update filtered list display**
  - Only show matching presets
  - Show category headers only if category has matches
  - Adjust navigation indices for filtered list
  - Show "No results" message if empty

- [ ] **3.6 Update footer hints**
  - Add "/: Search" hint
  - Show "Esc: Clear" when search is active

### Phase 4: Category Filtering

- [ ] **4.1 Add category filter state**
  - File: `src/components/onboarding/PresetSelectionStep.tsx`
  - `activeCategory` signal
  - Default to "all"

- [ ] **4.2 Create CategoryTabs component**
  - File: `src/components/onboarding/CategoryTabs.tsx` (new)
  - Horizontal tab bar with category names
  - "All" + each category from `CATEGORY_LABELS`
  - Highlight active category

- [ ] **4.3 Integrate category tabs into PresetSelectionStep**
  - Position above search bar or as header row
  - Navigate tabs with `Tab`/`Shift+Tab` or `[`/`]`

- [ ] **4.4 Combine category filter with search**
  - Filter by both category AND search query
  - "All" category searches across everything
  - Specific category limits search to that category

- [ ] **4.5 Update keyboard navigation**
  - Define keys for category switching
  - Options: `Tab`/`Shift+Tab`, number keys 1-9, `[`/`]`
  - Update footer hints

### Phase 5: Enhanced Selection Indicators

- [ ] **5.1 Improve checkbox visibility**
  - File: `src/components/onboarding/PresetSelectionStep.tsx`
  - Consider larger/bolder checkbox: `[*]` vs `[ ]` or `[x]` vs `[ ]`
  - Current uses `[x]` - evaluate if sufficient

- [ ] **5.2 Add row background highlight for selected items**
  - Subtle background color for selected rows
  - Different from focus highlight
  - Use theme color with opacity

- [ ] **5.3 Add selection summary header**
  - Show "3 apps selected" at top of list area
  - Update in real-time as selections change
  - Consider showing selected app names in compact form

- [ ] **5.4 Add "Select All" / "Deselect All" functionality**
  - Keyboard shortcut: `a` to toggle all visible (after category/search filter)
  - Or `Ctrl+A` for select all

### Phase 6: Testing & Validation

- [ ] **6.1 Write unit tests for search filtering**
  - File: `src/components/onboarding/PresetSelectionStep.test.ts` (new or extend)
  - Test search matches name, description, command
  - Test case-insensitive matching
  - Test empty search returns all

- [ ] **6.2 Write unit tests for category filtering**
  - Test each category filters correctly
  - Test "all" returns everything
  - Test combination with search

- [ ] **6.3 Write integration tests for full wizard flow**
  - Test: Welcome -> Keybindings -> App Selection -> Custom -> Review -> Confirm
  - Verify selected apps persist through navigation
  - Verify back/forward navigation preserves state

- [ ] **6.4 Manual QA checklist**
  - [ ] All preset names render correctly on review screen
  - [ ] Custom app names render correctly on review screen
  - [ ] Search filters apps in real-time
  - [ ] Category tabs filter correctly
  - [ ] Selection checkboxes are visible and correct
  - [ ] Keyboard navigation works with filters active
  - [ ] Tooltips display correct information
  - [ ] All footer hints are accurate

---

## File Reference

### Files to Modify

| File | Purpose |
|------|---------|
| `src/components/onboarding/KeybindingStep.tsx` | Add tooltip display, help key handler |
| `src/components/onboarding/keybindingPresets.ts` | Extend preset data with tooltip info |
| `src/components/onboarding/PresetSelectionStep.tsx` | Add search, category filter, improve selection UI |
| `src/components/onboarding/ConfirmationStep.tsx` | **FIX BUG**: Fix text layout for app names |
| `src/components/onboarding/presets.ts` | May need to export category helpers |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/onboarding/TooltipPanel.tsx` | Reusable tooltip/help panel component |
| `src/components/onboarding/SearchInput.tsx` | Text input component for search |
| `src/components/onboarding/CategoryTabs.tsx` | Category filter tab bar |

### Test Files

| File | Purpose |
|------|---------|
| `src/components/onboarding/PresetSelectionStep.test.ts` | Unit tests for filtering logic |
| `src/components/onboarding/ConfirmationStep.test.ts` | Tests for app name rendering |

---

## External References

### Similar TUI Implementations

- **fzf** - Terminal fuzzy finder with search input
  - URL: https://github.com/junegunn/fzf
  - Relevance: Search/filter UX patterns

- **lazygit** - Git TUI with category tabs
  - URL: https://github.com/jesseduffield/lazygit
  - Relevance: Tab-based category navigation

- **@opentui/solid** - The TUI framework being used
  - URL: https://github.com/nicksrandall/opentui (if public)
  - Relevance: Understand text/box layout behavior

### Related Project Files

- `src/components/LeaderHints.tsx` - Example of popup/overlay component pattern
- `src/lib/key-capture.ts` - Keyboard handling utilities

---

## Validation Criteria

### Phase 1 Complete When:
- [ ] "Claude Code" displays correctly as "C Claude Code (claude)" on review screen
- [ ] All preset apps render with icon, name, and command visible
- [ ] No text overlap or truncation issues

### Phase 2 Complete When:
- [ ] Each leader key preset shows expanded tooltip when focused or when `?` pressed
- [ ] Tooltips explain what the style means and show example usage
- [ ] User can understand difference between tmux, screen, and desktop styles

### Phase 3 Complete When:
- [ ] Search input visible at top of app selection screen
- [ ] Typing filters list in real-time
- [ ] `/` focuses search, `Escape` clears and exits
- [ ] Navigation works correctly on filtered list

### Phase 4 Complete When:
- [ ] Category tabs visible and navigable
- [ ] Selecting category filters app list
- [ ] Category filter combines correctly with search
- [ ] "All" shows all apps regardless of category

### Phase 5 Complete When:
- [ ] Selected apps clearly distinguishable from unselected
- [ ] Selection count displayed prominently
- [ ] Optional: Select all/deselect all functionality

### Phase 6 Complete When:
- [ ] All unit tests pass
- [ ] Manual QA checklist complete
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes

---

## Implementation Order & Dependencies

```
Phase 1 (Bug Fix) ─────────────────────────────────────> Can ship independently
                                                         
Phase 2 (Tooltips) ────────────────────────────────────> Can ship independently

Phase 3 (Search) ──────┐
                       ├──> Phase 4 depends on Phase 3
Phase 4 (Categories) ──┘    (uses same filtering pattern)

Phase 5 (Selection UI) ────────────────────────────────> Can ship independently

Phase 6 (Testing) ─────────────────────────────────────> After all other phases
```

**Recommended order:** 1 -> 2 -> 3 -> 4 -> 5 -> 6

Phase 1 should be done first as it's a visible bug. Other phases can be parallelized if multiple developers are available.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| @opentui text layout behavior unclear | Medium | Test fix locally before implementing, check if library update available |
| Search performance with 30+ items | Low | Current list is small, but use `createMemo` for filtered results |
| Keyboard conflicts with search mode | Medium | Clear state machine: search mode vs navigation mode |
| Category tabs take too much vertical space | Medium | Consider horizontal scroll or dropdown instead of full tabs |

---

## Notes

- The current implementation already has good accessibility annotations as comments (aria-* attributes for future screen reader support)
- The project uses SolidJS signals pattern - maintain consistency
- Follow existing code style (e.g., `createSignal`, `createMemo`, `For` loops)
- Theme colors should come from `props.theme.*` not hardcoded values
