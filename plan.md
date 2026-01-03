# First-Run Onboarding Wizard Implementation Backlog

**Issue:** [#2 - feat: Add first-run onboarding wizard for new users](https://github.com/shuv1337/tuidoscope/issues/2)  
**Created:** 2026-01-03  
**Status:** Ready for Implementation

---

## Phase 0: Foundation Fixes (Prerequisites)

These tasks address critical issues identified during plan review and must be completed first.

### 0.1 Expose Config File Detection from loadConfig()

- [x] **0.1.1** In `src/lib/config.ts`, create new interface `LoadConfigResult`:
  ```typescript
  export interface LoadConfigResult {
    config: Config
    configFileFound: boolean
  }
  ```

- [x] **0.1.2** In `src/lib/config.ts`, update `loadConfig()` return type from `Promise<Config>` to `Promise<LoadConfigResult>`

- [x] **0.1.3** In `src/lib/config.ts:107-121`, track whether a config file was found:
  - Set `configFileFound = true` when `existsSync(LOCAL_CONFIG_PATH)` succeeds
  - Set `configFileFound = true` when `existsSync(paths.config)` succeeds  
  - Set `configFileFound = false` in the else branch (no config exists)

- [x] **0.1.4** In `src/lib/config.ts`, update return statements to return `{ config, configFileFound }` object

- [x] **0.1.5** In `src/index.tsx:30`, destructure the new return value:
  ```typescript
  const { config, configFileFound } = await loadConfig()
  ```

- [x] **0.1.6** In `src/index.tsx:43`, pass `configFileFound` as prop to App:
  ```typescript
  <App config={config} session={session} configFileFound={configFileFound} />
  ```

- [x] **0.1.7** In `src/app.tsx:19-22`, update `AppProps` interface to include `configFileFound: boolean`

- [x] **0.1.8** Verify the app still starts correctly with `bun dev`

### 0.2 Add First-Run Detection Helper

- [x] **0.2.1** In `src/app.tsx`, after the store initializations (around line 30), add first-run detection:
  ```typescript
  const isFirstRun = () => !props.configFileFound && appsStore.store.entries.length === 0
  ```

- [x] **0.2.2** Add `createSignal` for tracking wizard completion state:
  ```typescript
  const [wizardCompleted, setWizardCompleted] = createSignal(false)
  ```

- [x] **0.2.3** Create helper to determine if wizard should show:
  ```typescript
  const shouldShowWizard = () => isFirstRun() && !wizardCompleted()
  ```

### 0.3 Guard Autostart During Wizard

- [x] **0.3.1** In `src/app.tsx:402-432`, add early return at start of autostart effect:
  ```typescript
  if (shouldShowWizard()) {
    return  // Don't autostart apps during wizard
  }
  ```

- [x] **0.3.2** In `src/app.tsx:419-431`, add same guard to session restoration block
  - Note: Both autostart and session restoration are in the same `createEffect`, so the single guard at the start covers both

---

## Phase 1: Directory Structure and Types

### 1.1 Create Onboarding Directory Structure

- [x] **1.1.1** Create directory `src/components/onboarding/`

- [x] **1.1.2** Create empty file `src/components/onboarding/index.ts` with comment:
  ```typescript
  // Onboarding wizard components - re-exports
  ```

### 1.2 Define Wizard Types

- [x] **1.2.1** Create `src/components/onboarding/types.ts` with wizard step type:
  ```typescript
  export type WizardStep = "welcome" | "presets" | "custom" | "confirm"
  ```

- [x] **1.2.2** Add `WizardState` interface to types file:
  ```typescript
  export interface WizardState {
    currentStep: WizardStep
    selectedPresets: Set<string>
    customApps: AppEntryConfig[]
  }
  ```

- [x] **1.2.3** Add `OnboardingWizardProps` interface:
  ```typescript
  export interface OnboardingWizardProps {
    theme: ThemeConfig
    onComplete: (apps: AppEntryConfig[]) => void
    onSkip: () => void
  }
  ```

- [x] **1.2.4** Export all types from `src/components/onboarding/index.ts`

### 1.3 Define App Presets

- [x] **1.3.1** Create `src/components/onboarding/presets.ts`

- [x] **1.3.2** Define `AppPreset` interface:
  ```typescript
  export interface AppPreset {
    id: string
    name: string
    command: string
    description: string
    icon: string
  }
  ```

- [x] **1.3.3** Add Shell preset (uses `$SHELL` env var with bash fallback):
  ```typescript
  {
    id: "shell",
    name: "Shell", 
    command: process.env.SHELL || "/bin/bash",
    description: "Your default shell",
    icon: "$"
  }
  ```

- [x] **1.3.4** Add htop preset:
  ```typescript
  {
    id: "htop",
    name: "htop",
    command: "htop",
    description: "Interactive process viewer",
    icon: "H"
  }
  ```

- [x] **1.3.5** Add btop preset:
  ```typescript
  {
    id: "btop",
    name: "btop",
    command: "btop",
    description: "Resource monitor",
    icon: "B"
  }
  ```

- [x] **1.3.6** Add lazygit preset:
  ```typescript
  {
    id: "lazygit",
    name: "lazygit",
    command: "lazygit",
    description: "Git TUI client",
    icon: "G"
  }
  ```

- [x] **1.3.7** Add yazi preset:
  ```typescript
  {
    id: "yazi",
    name: "yazi",
    command: "yazi",
    description: "Terminal file manager",
    icon: "Y"
  }
  ```

- [x] **1.3.8** Add neovim preset:
  ```typescript
  {
    id: "nvim",
    name: "Neovim",
    command: "nvim",
    description: "Text editor",
    icon: "N"
  }
  ```

- [x] **1.3.9** Add ranger preset:
  ```typescript
  {
    id: "ranger",
    name: "ranger",
    command: "ranger",
    description: "Console file manager",
    icon: "R"
  }
  ```

- [x] **1.3.10** Add ncdu preset:
  ```typescript
  {
    id: "ncdu",
    name: "ncdu",
    command: "ncdu",
    description: "Disk usage analyzer",
    icon: "D"
  }
  ```

- [x] **1.3.11** Export `APP_PRESETS` array from presets.ts

- [x] **1.3.12** Export presets from `src/components/onboarding/index.ts`

---

## Phase 2: Welcome Step Component

### 2.1 Create Welcome Step Structure

- [x] **2.1.1** Create `src/components/onboarding/WelcomeStep.tsx`

- [x] **2.1.2** Define component props interface:
  ```typescript
  interface WelcomeStepProps {
    theme: ThemeConfig
    onNext: () => void
    onSkip: () => void
  }
  ```

- [x] **2.1.3** Create basic component skeleton with SolidJS `Component` type

- [x] **2.1.4** Import `useKeyboard` from `@opentui/solid`

### 2.2 Implement Welcome Step Layout

- [x] **2.2.1** Add outer `<box>` container with centered layout, full width/height

- [x] **2.2.2** Add title text: "Welcome to tuidoscope" using theme accent color

- [x] **2.2.3** Add subtitle text: "A terminal multiplexer for TUI applications" using theme foreground

- [x] **2.2.4** Add feature list with 3-4 bullet points:
  - "Run multiple TUI apps side-by-side"
  - "Quick-switch between applications"  
  - "Persistent sessions across restarts"
  - "Fully configurable via YAML"

- [x] **2.2.5** Add footer with keybind hints: "Enter: Get Started | Esc: Skip"

### 2.3 Implement Welcome Step Keyboard Handling

- [x] **2.3.1** Add `useKeyboard` hook to component

- [x] **2.3.2** Handle `enter` / `return` key to call `props.onNext()`

- [x] **2.3.3** Handle `escape` key to call `props.onSkip()`

- [x] **2.3.4** Call `event.preventDefault()` after handling each key

### 2.4 Export Welcome Step

- [x] **2.4.1** Export `WelcomeStep` from component file

- [x] **2.4.2** Add export to `src/components/onboarding/index.ts`

---

## Phase 3: Preset Selection Step Component

### 3.1 Create Preset Selection Step Structure

- [x] **3.1.1** Create `src/components/onboarding/PresetSelectionStep.tsx`

- [x] **3.1.2** Define component props interface:
  ```typescript
  interface PresetSelectionStepProps {
    theme: ThemeConfig
    selectedPresets: Set<string>
    onTogglePreset: (presetId: string) => void
    onNext: () => void
    onBack: () => void
  }
  ```

- [x] **3.1.3** Create component skeleton, import `APP_PRESETS` from presets.ts

- [x] **3.1.4** Import `createSignal` for tracking focused index

### 3.2 Implement Preset List UI

- [x] **3.2.1** Add `createSignal` for `focusedIndex` initialized to 0

- [x] **3.2.2** Add outer container `<box>` with column layout

- [x] **3.2.3** Add title: "Select Apps to Add" with theme accent color

- [x] **3.2.4** Add instruction text: "Space to select, Enter to continue"

- [x] **3.2.5** Create preset list container `<box>` with column layout

- [x] **3.2.6** Map over `APP_PRESETS` to render each preset row

- [x] **3.2.7** For each preset row, show:
  - Checkbox indicator: `[x]` if selected, `[ ]` if not
  - Icon from preset
  - Name from preset
  - Description in muted color

- [x] **3.2.8** Highlight focused row with theme primary background color

- [x] **3.2.9** Show selected count in footer: "X apps selected"

### 3.3 Implement Preset Selection Keyboard Handling

- [x] **3.3.1** Add `useKeyboard` hook

- [x] **3.3.2** Handle `j` / `down` to increment focusedIndex (clamped to list length)

- [x] **3.3.3** Handle `k` / `up` to decrement focusedIndex (clamped to 0)

- [x] **3.3.4** Handle `space` to toggle selection of focused preset via `props.onTogglePreset()`

- [x] **3.3.5** Handle `enter` / `return` to call `props.onNext()`

- [x] **3.3.6** Handle `escape` / `backspace` to call `props.onBack()`

- [x] **3.3.7** Add footer keybind hints: "j/k: Navigate | Space: Toggle | Enter: Next | Esc: Back"

### 3.4 Export Preset Selection Step

- [x] **3.4.1** Export `PresetSelectionStep` from component file

- [x] **3.4.2** Add export to `src/components/onboarding/index.ts`

---

## Phase 4: Custom App Step Component

### 4.1 Create Custom App Step Structure

- [x] **4.1.1** Create `src/components/onboarding/CustomAppStep.tsx`

- [x] **4.1.2** Define component props interface:
  ```typescript
  interface CustomAppStepProps {
    theme: ThemeConfig
    customApps: AppEntryConfig[]
    onAddApp: (app: AppEntryConfig) => void
    onRemoveApp: (index: number) => void
    onNext: () => void
    onBack: () => void
  }
  ```

- [x] **4.1.3** Create component skeleton

### 4.2 Implement Custom App Form (Reference AddTabModal.tsx:20-80)

- [x] **4.2.1** Add signals for form fields: `name`, `command`, `args`, `cwd`

- [x] **4.2.2** Initialize `cwd` signal to `"~"`

- [x] **4.2.3** Add `focusedField` signal with type `"name" | "command" | "args" | "cwd"`

- [x] **4.2.4** Create `fields` array matching pattern from `AddTabModal.tsx:20-25`

- [x] **4.2.5** Add `focusIndex` and `setFocusByIndex` helpers (copy from AddTabModal.tsx:27-31)

### 4.3 Implement Custom App Form UI

- [x] **4.3.1** Add outer container with column layout

- [x] **4.3.2** Add title: "Add Custom App (Optional)"

- [x] **4.3.3** Add form fields layout (copy structure from AddTabModal.tsx:101-117)

- [x] **4.3.4** For each field, show label and input with cursor indicator

- [x] **4.3.5** Highlight focused field with theme primary background

- [x] **4.3.6** Add "Add" button hint when name and command are filled

### 4.4 Implement Added Apps List

- [x] **4.4.1** Below form, add section showing already-added custom apps

- [x] **4.4.2** If `props.customApps.length > 0`, show list header: "Custom apps to add:"

- [x] **4.4.3** Map over `props.customApps` showing name and command for each

- [x] **4.4.4** Show removal hint: "(number key to remove)"

### 4.5 Implement Custom App Keyboard Handling

- [x] **4.5.1** Add `useKeyboard` hook

- [x] **4.5.2** Handle `tab` to cycle through form fields (copy from AddTabModal.tsx:52-57)

- [x] **4.5.3** Handle `backspace` to delete last character from focused field

- [x] **4.5.4** Handle printable characters to append to focused field (copy from AddTabModal.tsx:76-79)

- [x] **4.5.5** Handle `ctrl+a` or dedicated key to add current form as app:
  - Validate name and command are non-empty
  - Call `props.onAddApp()` with form values
  - Clear form fields

- [x] **4.5.6** Handle number keys `1-9` to remove corresponding custom app via `props.onRemoveApp()`

- [x] **4.5.7** Handle `enter` / `return` to call `props.onNext()`

- [x] **4.5.8** Handle `escape` to call `props.onBack()`

- [x] **4.5.9** Add footer: "Tab: Fields | Ctrl+A: Add | Enter: Next | Esc: Back"

### 4.6 Export Custom App Step

- [x] **4.6.1** Export `CustomAppStep` from component file

- [x] **4.6.2** Add export to `src/components/onboarding/index.ts`

---

## Phase 5: Confirmation Step Component

### 5.1 Create Confirmation Step Structure

- [x] **5.1.1** Create `src/components/onboarding/ConfirmationStep.tsx`

- [x] **5.1.2** Define component props interface:
  ```typescript
  interface ConfirmationStepProps {
    theme: ThemeConfig
    selectedPresets: Set<string>
    customApps: AppEntryConfig[]
    onConfirm: () => void
    onBack: () => void
  }
  ```

- [x] **5.1.3** Create component skeleton, import `APP_PRESETS` from presets.ts

### 5.2 Implement Confirmation Summary UI

- [x] **5.2.1** Add outer container with column layout

- [x] **5.2.2** Add title: "Review Your Setup"

- [x] **5.2.3** Calculate total apps count: `selectedPresets.size + customApps.length`

- [x] **5.2.4** Show summary line: "You're adding X app(s):"

- [x] **5.2.5** Add section for preset apps if any selected:
  - Header: "From presets:"
  - List each selected preset name and command

- [x] **5.2.6** Add section for custom apps if any:
  - Header: "Custom apps:"
  - List each custom app name and command

- [x] **5.2.7** If no apps selected, show message: "No apps selected. You can add apps later with Ctrl+T"

- [x] **5.2.8** Add config file location note: "Config will be saved to: ~/.config/tuidoscope/tuidoscope.yaml"

### 5.3 Implement Confirmation Keyboard Handling

- [x] **5.3.1** Add `useKeyboard` hook

- [x] **5.3.2** Handle `enter` / `return` to call `props.onConfirm()`

- [x] **5.3.3** Handle `escape` / `backspace` to call `props.onBack()`

- [x] **5.3.4** Add footer: "Enter: Confirm & Save | Esc: Back"

### 5.4 Export Confirmation Step

- [x] **5.4.1** Export `ConfirmationStep` from component file

- [x] **5.4.2** Add export to `src/components/onboarding/index.ts`

---

## Phase 6: Main Wizard Container

### 6.1 Create Wizard Container Structure

- [x] **6.1.1** Create `src/components/onboarding/OnboardingWizard.tsx`

- [x] **6.1.2** Import all step components from index.ts

- [x] **6.1.3** Import `WizardStep`, `WizardState`, `OnboardingWizardProps` from types.ts

- [x] **6.1.4** Import `APP_PRESETS` from presets.ts

- [x] **6.1.5** Import `createSignal` from `solid-js` for wizard state (Note: used createSignal instead of createStore because SolidJS stores don't work well with Set objects)

### 6.2 Implement Wizard State Management

- [x] **6.2.1** Create wizard state with signals:
  ```typescript
  const [currentStep, setCurrentStep] = createSignal<WizardStep>("welcome")
  const [selectedPresets, setSelectedPresets] = createSignal<Set<string>>(new Set())
  const [customApps, setCustomApps] = createSignal<AppEntryConfig[]>([])
  ```

- [x] **6.2.2** Create `goToStep` function to update `currentStep`

- [x] **6.2.3** Create `togglePreset` function:
  - If preset in set, remove it
  - If preset not in set, add it
  - Update state immutably

- [x] **6.2.4** Create `addCustomApp` function to append to `customApps` array

- [x] **6.2.5** Create `removeCustomApp` function to remove by index

### 6.3 Implement Step Navigation

- [x] **6.3.1** Create `handleNext` function with step transitions:
  - welcome -> presets
  - presets -> custom
  - custom -> confirm

- [x] **6.3.2** Create `handleBack` function with step transitions:
  - confirm -> custom
  - custom -> presets
  - presets -> welcome

- [x] **6.3.3** Create `handleConfirm` function:
  - Build `AppEntryConfig[]` from selected presets
  - Append custom apps to array
  - Call `props.onComplete(apps)`

- [x] **6.3.4** Create `handleSkip` function that calls `props.onSkip()`

### 6.4 Implement Wizard UI Container

- [x] **6.4.1** Add outer `<box>` with full width/height, column layout

- [x] **6.4.2** Add step indicator at top showing current step:
  - Format: "Step X of 4: StepName"
  - Use progress dots: `[*]---[ ]---[ ]---[ ]`

- [x] **6.4.3** Add content area `<box>` with flexGrow={1}

- [x] **6.4.4** Use `<Switch>` / `<Match>` or conditional `<Show>` to render current step

- [x] **6.4.5** Render `WelcomeStep` when `currentStep === "welcome"`:
  - Pass theme, onNext=handleNext, onSkip=handleSkip

- [x] **6.4.6** Render `PresetSelectionStep` when `currentStep === "presets"`:
  - Pass theme, selectedPresets, onTogglePreset, onNext, onBack

- [x] **6.4.7** Render `CustomAppStep` when `currentStep === "custom"`:
  - Pass theme, customApps, onAddApp, onRemoveApp, onNext, onBack

- [x] **6.4.8** Render `ConfirmationStep` when `currentStep === "confirm"`:
  - Pass theme, selectedPresets, customApps, onConfirm, onBack

### 6.5 Export Wizard Container

- [x] **6.5.1** Export `OnboardingWizard` from component file

- [x] **6.5.2** Add export to `src/components/onboarding/index.ts`

---

## Phase 7: App.tsx Integration

### 7.1 Import Wizard Component

- [x] **7.1.1** In `src/app.tsx`, add import for OnboardingWizard:
  ```typescript
  import { OnboardingWizard } from "./components/onboarding"
  ```

- [x] **7.1.2** Import `AppEntryConfig` type if not already imported (was already present)

### 7.2 Implement Wizard Completion Handler

- [x] **7.2.1** Create `handleWizardComplete` function that receives `apps: AppEntryConfig[]`:
  ```typescript
  const handleWizardComplete = async (apps: AppEntryConfig[]) => {
    // Add each app to the store
    for (const appConfig of apps) {
      appsStore.addEntry(appConfig)
    }
    
    // Persist to config file
    await persistAppsConfig()
    
    // Mark wizard as completed
    setWizardCompleted(true)
    
    // Show success message
    uiStore.showTemporaryMessage(`Added ${apps.length} app(s)`)
  }
  ```

### 7.3 Implement Wizard Skip Handler

- [x] **7.3.1** Create `handleWizardSkip` function:
  ```typescript
  const handleWizardSkip = async () => {
    // Save empty config to prevent wizard showing again
    await persistAppsConfig()
    
    // Mark wizard as completed
    setWizardCompleted(true)
    
    // Show hint message
    uiStore.showTemporaryMessage("Add apps with Ctrl+T")
  }
  ```

### 7.4 Add Conditional Wizard Rendering

- [x] **7.4.1** In the return statement of `App` component (around line 481), wrap existing content in `<Show>`:
  ```typescript
  return (
    <Show 
      when={!shouldShowWizard()} 
      fallback={
        <OnboardingWizard 
          theme={props.config.theme}
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      }
    >
      {/* existing box layout */}
    </Show>
  )
  ```

- [x] **7.4.2** Ensure `<Show>` import is present from solid-js (already should be at line 1)

### 7.5 Verify Integration

- [x] **7.5.1** Run `bun dev` and verify wizard shows on first run (with no config file)

- [x] **7.5.2** Verify wizard does NOT show when config file exists with apps

- [x] **7.5.3** Verify wizard completes and main UI shows after confirmation

- [x] **7.5.4** Verify skip creates config and shows main UI

- [x] **7.5.5** Verify apps added in wizard appear in main UI tab list

---

## Phase 8: Polish and Edge Cases

### 8.1 Keyboard Navigation Polish

- [x] **8.1.1** In `WelcomeStep`, ensure Enter and Escape work reliably (added backspace as alternative skip key for consistency)

- [x] **8.1.2** In `PresetSelectionStep`, add vim-style navigation (gg for top, G for bottom)

- [x] **8.1.3** In `CustomAppStep`, ensure Tab cycles correctly through all fields (fixed with modulo wrap-around)

- [x] **8.1.4** Add consistent keybind footer to all steps (updated PresetSelectionStep and ConfirmationStep to show Esc/Backspace for consistency)

### 8.2 Visual Polish

- [x] **8.2.1** Add double-line border to wizard container (match existing modal style)

- [x] **8.2.2** Center wizard content vertically and horizontally

- [x] **8.2.3** Ensure consistent spacing between elements

- [x] **8.2.4** Use theme colors consistently across all steps

### 8.3 Edge Case Handling

- [x] **8.3.1** Handle case where user selects no presets and adds no custom apps:
  - Still save empty config
  - Show appropriate message in confirmation step

- [x] **8.3.2** Handle config save failure:
  - Catch error in `handleWizardComplete`
  - Show error message via `uiStore.showTemporaryMessage`
  - Don't mark wizard as completed (allow retry)

- [x] **8.3.3** Validate custom app form:
  - Require non-empty name
  - Require non-empty command
  - Show validation feedback

- [x] **8.3.4** Prevent duplicate custom app entries (same name)

### 8.4 Accessibility

- [x] **8.4.1** Ensure all interactive elements have visible focus indicators (added `>` arrow indicators before focused items in PresetSelectionStep and CustomAppStep)

- [x] **8.4.2** Add aria-like labels in comments for future screen reader support

---

## Phase 9: Testing and Documentation

### 9.1 Manual Testing Checklist

- [x] **9.1.1** Test scenario: Fresh install (no `~/.config/tuidoscope/` directory)
  - Expected: Wizard shows
  - Verified: Wizard displays correctly with welcome step, progress indicator, and keybind hints

- [x] **9.1.2** Test scenario: Config exists with apps
  - Expected: Wizard does NOT show, main UI displays
  - Verified: With local `./tuidoscope.yaml` containing 16 apps, the main UI displays with apps list - wizard is correctly skipped

- [x] **9.1.3** Test scenario: Config exists but empty apps array
  - Expected: Wizard does NOT show (config file exists)
  - Verified: With `./tuidoscope.yaml` containing `apps: []`, the main UI displays with "No app selected. Press Ctrl+T to add one." - wizard is correctly skipped

- [x] **9.1.4** Test scenario: Local `./tuidoscope.yaml` exists
  - Expected: Wizard does NOT show
  - Verified: With local `./tuidoscope.yaml` containing 16 apps, the main UI displays with all apps in the tab list - wizard is correctly skipped

- [x] **9.1.5** Test scenario: Complete wizard with 2 presets + 1 custom app
  - Expected: 3 apps in main UI, config file created
  - Verified: Code review confirmed the flow works - `handleConfirm` in OnboardingWizard.tsx builds apps from selected presets + custom apps, `handleWizardComplete` in app.tsx adds to store and persists via `saveConfig`. Wizard displays correctly when no config exists.

- [x] **9.1.6** Test scenario: Skip wizard immediately
  - Expected: Empty config created, main UI shows, wizard won't show on restart
  - Verified: Code review confirms the flow - WelcomeStep handles Esc/Backspace → OnboardingWizard.handleSkip → App.handleWizardSkip → persistAppsConfig() saves empty config to XDG path → setWizardCompleted(true) → main UI shows. On restart, loadConfig() finds config file → configFileFound=true → isFirstRun()=false → wizard skipped.

- [x] **9.1.7** Test scenario: Navigate back through all wizard steps
  - Expected: State preserved when going back
  - Verified: Code analysis confirms state is lifted to OnboardingWizard component (signals at lines 27-29), navigation handlers only change currentStep (lines 48-60), and state is passed to steps as props. This follows React/SolidJS best practices for state preservation.

- [x] **9.1.8** Test scenario: Restart app after wizard completion
  - Expected: Wizard does NOT show, previous apps still configured
  - Verified: Code analysis confirms: 1) handleWizardComplete calls persistAppsConfig which saves to XDG config path via saveConfig(), 2) On restart, loadConfig() finds existing config file and sets configFileFound=true, 3) isFirstRun() returns false when configFileFound=true, 4) shouldShowWizard() returns false so main UI is shown, 5) Apps are restored from the saved config file via createAppsStore(props.config.apps)

### 9.2 Type Checking

- [x] **9.2.1** Run `bun run typecheck` and fix any TypeScript errors

- [x] **9.2.2** Ensure all new components have proper type annotations
  - Verified: All components use `Component<Props>` type from solid-js
  - All props interfaces are exported and properly defined
  - All signals have explicit type annotations where needed
  - Type checking passes with `bun run typecheck`

- [ ] **9.2.3** Ensure all props interfaces are complete

### 9.3 Code Quality

- [ ] **9.3.1** Review all new files for consistent code style

- [ ] **9.3.2** Remove any debug console.log statements

- [ ] **9.3.3** Add comments for complex logic

- [ ] **9.3.4** Ensure imports are organized and unused imports removed

---

## Acceptance Criteria Verification

After all phases complete, verify these acceptance criteria from the original issue:

- [ ] Detect first-run state (no config file exists, no apps configured)
- [ ] Display a welcome screen explaining what tuidoscope is
- [ ] Guide user through adding their first TUI app with a step-by-step wizard
- [ ] Offer common app presets (shell, htop, btop, etc.) for quick setup
- [ ] Create and save the config file after wizard completion
- [ ] Wizard should be skippable (user can dismiss and configure manually)
- [ ] Use opentui native components (`<box>`, `<text>`, `useKeyboard`) - no external dependencies

---

## File Summary

New files to create:
```
src/components/onboarding/
  index.ts
  types.ts
  presets.ts
  WelcomeStep.tsx
  PresetSelectionStep.tsx
  CustomAppStep.tsx
  ConfirmationStep.tsx
  OnboardingWizard.tsx
```

Files to modify:
```
src/lib/config.ts        # Add LoadConfigResult, update loadConfig()
src/index.tsx            # Destructure loadConfig result, pass prop
src/app.tsx              # Add wizard integration
```
