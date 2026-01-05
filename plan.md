# Onboarding UX Improvements - Implementation Backlog

## Phase 0: Type Refactoring

- [x] 0.1 Open `src/components/onboarding/types.ts` and add import for `AppPreset` type from `./presets`
- [x] 0.2 Add `ListRow` type definition to `types.ts` with two variants: `header` (category, label) and `preset` (preset, originalIndex)
- [x] 0.3 Export `ListRow` type from `types.ts`
- [x] 0.4 Open `src/components/onboarding/PresetSelectionStep.tsx` and find local `ListRow` type definition
- [x] 0.5 Remove local `ListRow` type definition from `PresetSelectionStep.tsx`
- [x] 0.6 Add import for `ListRow` from `./types` in `PresetSelectionStep.tsx`
- [x] 0.7 Run `bun run typecheck` to verify no type errors

## Phase 1: Confirmation Screen Bug Verification

- [ ] 1.1 Run `bun run dev` and complete onboarding wizard to reach ConfirmationStep
- [ ] 1.2 Test ConfirmationStep rendering in Ghostty terminal at 80x24
- [ ] 1.3 Test ConfirmationStep rendering in default terminal at 80x24
- [ ] 1.4 Document findings: if name/command render correctly, mark bug as "not reproducible"
- [ ] 1.5 If bug IS reproducible: open `src/components/onboarding/ConfirmationStep.tsx`
- [ ] 1.6 If bug IS reproducible: combine name and command into single `<text>` template string
- [ ] 1.7 If bug IS reproducible: apply same fix to both preset list (lines ~98-108) and custom app list (lines ~121-131)
- [ ] 1.8 If bug IS reproducible: verify fix in multiple terminals

## Phase 2: Leader Key Tooltip Data

- [x] 2.1 Open `src/components/onboarding/keybindingPresets.ts`
- [x] 2.2 Add optional `tooltip` property to `LeaderPreset` interface with shape: `{ origin: string, example: string, conflicts?: string[] }`
- [x] 2.3 Add tooltip data to "tmux" preset (ctrl+a): origin about GNU Screen, example usage, readline/emacs conflicts
- [x] 2.4 Add tooltip data to "tmux-alt" preset (ctrl+b): origin about tmux default, example usage, tmux/readline conflicts
- [x] 2.5 Add tooltip data to "screen" preset (ctrl+\): origin about Screen alternative, example usage, SIGQUIT conflict
- [x] 2.6 Add tooltip data to "desktop" preset (alt+space): origin about desktop apps, example usage, GNOME/macOS/Windows conflicts
- [x] 2.7 Add tooltip data to "custom" preset: generic origin/example, no conflicts array
- [x] 2.8 Run `bun run typecheck` to verify tooltip types are correct

## Phase 2: Leader Key Tooltip UI

- [x] 2.9 Open `src/components/onboarding/KeybindingStep.tsx`
- [x] 2.10 Add `showHelp` signal: `const [showHelp, setShowHelp] = createSignal(false)`
- [x] 2.11 Find the `useKeyboard` hook call and add handler for `?` key to toggle `showHelp`
- [x] 2.12 Create tooltip panel JSX that renders when `showHelp()` is true
- [x] 2.13 In tooltip panel: display "Origin:" label with `props.theme.muted` color
- [x] 2.14 In tooltip panel: display origin value from focused preset's tooltip
- [x] 2.15 In tooltip panel: display "Example:" label with `props.theme.muted` color
- [x] 2.16 In tooltip panel: display example value from focused preset's tooltip
- [x] 2.17 In tooltip panel: display "Conflicts:" label with `props.theme.muted` color (only if conflicts exist)
- [x] 2.18 In tooltip panel: display each conflict as bulleted list item
- [x] 2.19 Position tooltip panel below preset list, above footer hints
- [x] 2.20 Add `?: Help` to footer hints line
- [x] 2.21 Test: `?` toggles tooltip visibility
- [x] 2.22 Test: tooltip content updates when focus changes via j/k

## Phase 3: Filter Helper Module

- [x] 3.1 Create new file `src/components/onboarding/presetFilter.ts`
- [x] 3.2 Add imports: `AppPreset` from `./presets`, `ListRow` from `./types`, `CATEGORY_LABELS` from `./presets`
- [x] 3.3 Implement `buildFilteredRows` function signature: `(presets: AppPreset[], category: string | "all", query: string) => ListRow[]`
- [x] 3.4 In `buildFilteredRows`: normalize query to lowercase and trim whitespace
- [x] 3.5 In `buildFilteredRows`: iterate over presets with forEach, tracking originalIndex
- [x] 3.6 In `buildFilteredRows`: skip preset if category filter is active and doesn't match
- [x] 3.7 In `buildFilteredRows`: build searchable text from name, description, command, category label
- [x] 3.8 In `buildFilteredRows`: skip preset if normalized query doesn't match searchable text
- [x] 3.9 In `buildFilteredRows`: insert category header row when category changes
- [x] 3.10 In `buildFilteredRows`: push preset row with originalIndex for selection tracking
- [x] 3.11 Implement `getPresetIndices` function: extract indices of preset rows (skip headers)
- [x] 3.12 Export both functions from `presetFilter.ts`
- [x] 3.13 Run `bun run typecheck` to verify module compiles

## Phase 3: Search State in PresetSelectionStep

- [x] 3.14 Open `src/components/onboarding/PresetSelectionStep.tsx`
- [x] 3.15 Add import for `buildFilteredRows` and `getPresetIndices` from `./presetFilter`
- [x] 3.16 Add `searchQuery` signal: `const [searchQuery, setSearchQuery] = createSignal("")`
- [x] 3.17 Add `isSearchFocused` signal: `const [isSearchFocused, setIsSearchFocused] = createSignal(false)`
- [x] 3.18 Add `activeCategory` signal: `const [activeCategory, setActiveCategory] = createSignal<string>("all")`
- [x] 3.19 Define category order array: `["all", "shell", "productivity", "monitor", "files", "git", "dev", "editor", "ai", "utility"]`

## Phase 3: Filtered List Integration

- [x] 3.20 Find existing `listRows` memo in PresetSelectionStep
- [x] 3.21 Replace `listRows` computation to use `buildFilteredRows(APP_PRESETS, activeCategory(), searchQuery())`
- [x] 3.22 Add `presetIndices` memo using `getPresetIndices(filteredRows())`
- [x] 3.23 Add `createEffect` to reset `focusedIndex` to 0 when `filteredRows` changes
- [x] 3.24 Update navigation logic to use `presetIndices()` for j/k/arrow navigation
- [x] 3.25 Update selection toggle to use `originalIndex` from ListRow for correct selection state

## Phase 3: Keyboard Mode State Machine

- [x] 3.26 Find `useKeyboard` hook in PresetSelectionStep
- [x] 3.27 Add `/` key handler: set `isSearchFocused(true)` to enter search mode
- [x] 3.28 In search mode: capture printable characters and append to `searchQuery`
- [x] 3.29 In search mode: `Backspace` deletes last character from query (not go back)
- [x] 3.30 In search mode: `Enter` exits search mode by setting `isSearchFocused(false)`
- [x] 3.31 In search mode: arrow keys (↑/↓) navigate filtered results
- [x] 3.32 In search mode: j/k type characters into query (not navigate)
- [x] 3.33 In search mode: Space appends space to query (not toggle selection)
- [x] 3.34 Implement Esc priority chain: (1) if search focused, blur search
- [x] 3.35 Implement Esc priority chain: (2) if query non-empty, clear query and reset focus
- [x] 3.36 Implement Esc priority chain: (3) if no search state, call `props.onBack()`
- [x] 3.37 In navigation mode: ensure j/k/gg/G navigate as before
- [x] 3.38 In navigation mode: ensure Backspace calls `props.onBack()` as before

## Phase 3: Search Input Rendering

- [x] 3.39 Add search input row to JSX, positioned below category tabs (Phase 4) or at top
- [x] 3.40 When `isSearchFocused()`: render `Search: ` prefix with `props.theme.primary` background
- [x] 3.41 When `isSearchFocused()`: render query text followed by cursor block `█`
- [x] 3.42 When `!isSearchFocused() && searchQuery()`: render dimmed `Filter: {query}`
- [x] 3.43 When `!isSearchFocused() && !searchQuery()`: hide search input row or show placeholder
- [x] 3.44 Update footer hints to show `/: Search` when not in search mode
- [x] 3.45 Update footer hints to show `Enter: Done` and `Esc: Cancel` when in search mode

## Phase 3: Empty Results Handling

- [x] 3.46 Add conditional rendering when `presetIndices().length === 0`
- [x] 3.47 Display "No matching apps" message centered with `props.theme.muted` color
- [x] 3.48 Disable j/k/↑/↓ navigation when results are empty (no-op)
- [x] 3.49 Disable Space key when results are empty (no-op)
- [x] 3.50 Ensure Enter key still advances to next step when results are empty

## Phase 3: Layout Adjustments

- [x] 3.51 Find `justifyContent="center"` in PresetSelectionStep outer box
- [x] 3.52 Change `justifyContent="center"` to `justifyContent="flex-start"`
- [x] 3.53 Find spacer `<box height={1} />` elements and reduce or remove them
- [x] 3.54 Add `maxHeight` or `flexGrow={1}` to preset list container to fill available space
- [x] 3.55 Test layout at 80x24 terminal size to verify no overflow (added overflow="hidden" to preset list container)

## Phase 4: Category Tabs Data

- [x] 4.1 Define display labels for category tabs (can use existing `CATEGORY_LABELS` or define new short labels)
- [x] 4.2 Ensure "All" is first in category order array

## Phase 4: Category Tabs Rendering

- [x] 4.3 Add category tabs row to JSX, positioned above search input
- [x] 4.4 Render each category as text with spacing between them
- [x] 4.5 When category is "all": render as `[All]` with brackets
- [x] 4.6 When category is active (not "all"): render with accent color or underline
- [x] 4.7 When category is inactive: render with `props.theme.muted` color
- [x] 4.8 Handle overflow: truncate or wrap if too many categories for terminal width

## Phase 4: Category Keyboard Navigation

- [x] 4.9 Add `[` key handler: cycle to previous category in order array
- [x] 4.10 Add `]` key handler: cycle to next category in order array
- [x] 4.11 Ensure category cycling wraps around (last -> first, first -> last)
- [x] 4.12 Ensure `[` and `]` work in both navigation mode and search mode
- [x] 4.13 Update footer hints to show `[/]: Category`

## Phase 4: Category Filter Integration

- [x] 4.14 Verify `buildFilteredRows` correctly filters by `activeCategory()`
- [x] 4.15 Verify category headers only appear for categories with matching presets
- [x] 4.16 Test: category + search query filters combine with AND logic
- [ ] 4.17 Test: switching category resets focus to first result

## Phase 5: Selection Polish (Optional)

- [ ] 5.1 Assess remaining vertical space at 80x24 after Phase 3-4 changes
- [ ] 5.2 If space allows: add subtle background highlight to selected rows
- [ ] 5.3 Selected row background: use dim version of accent color (distinct from focus)
- [ ] 5.4 If space allows: add selection summary header above preset list
- [ ] 5.5 Selection summary format: `3 selected: htop, lazygit, nvim...`
- [ ] 5.6 Truncate selection summary at ~40 characters with ellipsis
- [ ] 5.7 Only show selection summary when 1+ apps selected
- [ ] 5.8 Test layout at 80x24 to ensure no overflow with polish features

## Phase 6: Layout Verification

- [ ] 6.1 Set terminal to exactly 80 columns x 24 rows
- [ ] 6.2 Run `bun run dev` and navigate to PresetSelectionStep
- [ ] 6.3 Verify category tabs row fits without wrapping
- [ ] 6.4 Verify search input row renders correctly
- [ ] 6.5 Verify preset list fills remaining space
- [ ] 6.6 Verify footer hints and selected count are visible
- [ ] 6.7 Test with search query active at 80x24
- [ ] 6.8 Test with 10+ presets selected at 80x24
- [ ] 6.9 Set terminal to 120 columns x 40 rows
- [ ] 6.10 Verify UI scales gracefully without excessive whitespace
- [ ] 6.11 Test KeybindingStep tooltip panel at 80x24

## Phase 7: Unit Tests

- [ ] 7.1 Create new file `src/components/onboarding/presetFilter.test.ts`
- [ ] 7.2 Add imports: `describe`, `it`, `expect` from bun test, filter functions, test data
- [ ] 7.3 Test: `buildFilteredRows` returns all presets when category="all" and query=""
- [ ] 7.4 Test: `buildFilteredRows` filters by category correctly
- [ ] 7.5 Test: `buildFilteredRows` query match is case-insensitive
- [ ] 7.6 Test: `buildFilteredRows` query matches partial strings
- [ ] 7.7 Test: `buildFilteredRows` query matches against name, description, command
- [ ] 7.8 Test: `buildFilteredRows` combined category + query uses AND logic
- [ ] 7.9 Test: `buildFilteredRows` returns empty array when no matches
- [ ] 7.10 Test: `buildFilteredRows` only inserts headers for categories with matches
- [ ] 7.11 Test: `getPresetIndices` returns only indices of preset rows
- [ ] 7.12 Test: `getPresetIndices` skips header rows
- [ ] 7.13 Run `bun test` to verify all tests pass

## Phase 7: Manual QA Checklist

- [ ] 7.14 QA: Press `/` to focus search input, verify cursor appears
- [ ] 7.15 QA: Type query, verify results filter in real-time
- [ ] 7.16 QA: In search mode, press `j` and `k`, verify they type characters
- [ ] 7.17 QA: In search mode, press ↑/↓ arrows, verify they navigate results
- [ ] 7.18 QA: In search mode, press `Enter`, verify search blurs but query persists
- [ ] 7.19 QA: Press `Esc` once (search focused), verify search blurs
- [ ] 7.20 QA: Press `Esc` again (query exists), verify query clears
- [ ] 7.21 QA: Press `Esc` again (no search state), verify goes back to previous step
- [ ] 7.22 QA: Press `[` and `]`, verify category cycles
- [ ] 7.23 QA: Select category + type query, verify combined filtering
- [ ] 7.24 QA: Filter to zero results, verify "No matching apps" message
- [ ] 7.25 QA: With zero results, press `Enter`, verify advances to next step
- [ ] 7.26 QA: On KeybindingStep, press `?`, verify tooltip panel appears
- [ ] 7.27 QA: With tooltip visible, press j/k, verify tooltip content updates
- [ ] 7.28 QA: Verify all UI fits in 80x24 terminal without scrolling
- [ ] 7.29 Run `bun run typecheck` one final time
- [ ] 7.30 Run `bun test` one final time
