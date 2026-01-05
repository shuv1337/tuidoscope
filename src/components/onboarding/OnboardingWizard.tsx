import { Component, createSignal, Switch, Match } from "solid-js"
import type { AppEntryConfig } from "../../types"
import type { WizardStep, OnboardingWizardProps } from "./types"
import { APP_PRESETS } from "./presets"
import { WelcomeStep } from "./WelcomeStep"
import { KeybindingStep } from "./KeybindingStep"
import { PresetSelectionStep } from "./PresetSelectionStep"
import { CustomAppStep } from "./CustomAppStep"
import { ConfirmationStep } from "./ConfirmationStep"

/**
 * OnboardingWizard - Main container for the first-run onboarding wizard
 *
 * Accessibility annotations for future screen reader support:
 * - role="dialog" aria-modal="true" aria-label="First-run setup wizard"
 * - Step indicator should be:
 *   - role="navigation" aria-label="Wizard progress"
 *   - Current step text: role="status" aria-live="polite" aria-atomic="true"
 *   - Progress dots: role="progressbar" aria-valuemin="1" aria-valuemax="5"
 *     aria-valuenow={stepNumber} aria-valuetext="Step X of 5: StepName"
 * - Content area should be role="main" with aria-live="polite" for step changes
 * - Each step transition should announce the new step to screen readers
 * - The outer border provides visual containment (aria-hidden for the border itself)
 */

export const OnboardingWizard: Component<OnboardingWizardProps> = (props) => {
  // Wizard state using signals (createStore doesn't work well with Set)
  const [currentStep, setCurrentStep] = createSignal<WizardStep>("welcome")
  const [selectedPresets, setSelectedPresets] = createSignal<Set<string>>(new Set())
  const [customApps, setCustomApps] = createSignal<AppEntryConfig[]>([])
  const [selectedLeaderKey, setSelectedLeaderKey] = createSignal("ctrl+a")

  // Step navigation
  const goToStep = (step: WizardStep) => setCurrentStep(step)

  const handleNext = () => {
    switch (currentStep()) {
      case "welcome":
        goToStep("keybindings")
        break
      case "keybindings":
        goToStep("presets")
        break
      case "presets":
        goToStep("custom")
        break
      case "custom":
        goToStep("confirm")
        break
    }
  }

  const handleBack = () => {
    switch (currentStep()) {
      case "confirm":
        goToStep("custom")
        break
      case "custom":
        goToStep("presets")
        break
      case "presets":
        goToStep("keybindings")
        break
      case "keybindings":
        goToStep("welcome")
        break
    }
  }

  // Leader key selection
  const handleSelectLeader = (key: string) => {
    setSelectedLeaderKey(key)
  }

  // Preset management
  const togglePreset = (presetId: string) => {
    setSelectedPresets((prev) => {
      const next = new Set(prev)
      if (next.has(presetId)) {
        next.delete(presetId)
      } else {
        next.add(presetId)
      }
      return next
    })
  }

  // Custom app management
  const addCustomApp = (app: AppEntryConfig) => {
    setCustomApps((prev) => [...prev, app])
  }

  const removeCustomApp = (index: number) => {
    setCustomApps((prev) => prev.filter((_, i) => i !== index))
  }

  /**
   * Builds the final app configuration list and triggers wizard completion.
   * Converts selected preset IDs to AppEntryConfig objects and merges with custom apps.
   * The resulting array and selected leader key are passed to the parent component to save to config.
   */
  const handleConfirm = () => {
    const apps: AppEntryConfig[] = []

    // Convert each selected preset ID to an AppEntryConfig object.
    // Presets only store minimal info (id, name, command), so we add
    // default values for cwd and autostart to create a complete config entry.
    for (const presetId of selectedPresets()) {
      const preset = APP_PRESETS.find((p) => p.id === presetId)
      if (preset) {
        apps.push({
          name: preset.name,
          command: preset.command,
          cwd: "~",
          autostart: false,
        })
      }
    }

    // Custom apps are already in AppEntryConfig format, just append them
    apps.push(...customApps())

    // Pass both apps and selected leader key to parent
    props.onComplete(apps, selectedLeaderKey())
  }

  // Skip handler
  const handleSkip = () => {
    props.onSkip()
  }

  // Step indicator helpers for the progress display at the top of the wizard.
  // These render a visual indicator like: [*]---[*]---[ ]---[ ]---[ ] for step 2 of 5.
  
  // Returns 1-based step number (1-5) for display
  const stepNumber = () => {
    const steps: WizardStep[] = ["welcome", "keybindings", "presets", "custom", "confirm"]
    return steps.indexOf(currentStep()) + 1
  }

  // Returns human-readable step name for the header
  const stepName = () => {
    switch (currentStep()) {
      case "welcome":
        return "Welcome"
      case "keybindings":
        return "Keybindings"
      case "presets":
        return "Select Apps"
      case "custom":
        return "Custom Apps"
      case "confirm":
        return "Review"
    }
  }

  // Renders visual progress indicator: filled [*] for completed/current steps,
  // empty [ ] for future steps, connected with dashes
  const stepIndicator = () => {
    const steps: WizardStep[] = ["welcome", "keybindings", "presets", "custom", "confirm"]
    return steps
      .map((step, i) => (i < stepNumber() ? "[*]" : "[ ]"))
      .join("---")
  }

  return (
    // role="dialog" aria-modal="true" aria-label="First-run setup wizard"
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      borderStyle="double"
      borderColor={props.theme.accent}
    >
      {/* role="navigation" aria-label="Wizard progress" - Step indicator */}
      {/* role="status" aria-live="polite" aria-atomic="true" - current step announcement */}
      <box height={1} justifyContent="center">
        <text fg={props.theme.muted}>
          Step {stepNumber()} of 5: {stepName()}
        </text>
      </box>
      {/* role="progressbar" aria-valuemin="1" aria-valuemax="5" aria-valuenow={stepNumber} */}
      {/* aria-valuetext="Step X of 5: StepName" */}
      <box height={1} justifyContent="center">
        <text fg={props.theme.accent}>
          {stepIndicator()}
        </text>
      </box>

      {/* role="main" aria-live="polite" - Content area */}
      <box flexGrow={1}>
        <Switch>
          <Match when={currentStep() === "welcome"}>
            <WelcomeStep
              theme={props.theme}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          </Match>
          <Match when={currentStep() === "keybindings"}>
            <KeybindingStep
              theme={props.theme}
              selectedLeaderKey={selectedLeaderKey()}
              onSelectLeader={handleSelectLeader}
              onNext={handleNext}
              onBack={handleBack}
            />
          </Match>
          <Match when={currentStep() === "presets"}>
            <PresetSelectionStep
              theme={props.theme}
              selectedPresets={selectedPresets()}
              onTogglePreset={togglePreset}
              onNext={handleNext}
              onBack={handleBack}
            />
          </Match>
          <Match when={currentStep() === "custom"}>
            <CustomAppStep
              theme={props.theme}
              customApps={customApps()}
              selectedPresets={selectedPresets()}
              onAddApp={addCustomApp}
              onRemoveApp={removeCustomApp}
              onNext={handleNext}
              onBack={handleBack}
            />
          </Match>
          <Match when={currentStep() === "confirm"}>
            <ConfirmationStep
              theme={props.theme}
              selectedPresets={selectedPresets()}
              customApps={customApps()}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
          </Match>
        </Switch>
      </box>
    </box>
  )
}
