import { Component, createSignal, Show, Switch, Match } from "solid-js"
import type { AppEntryConfig } from "../../types"
import type { WizardStep, OnboardingWizardProps } from "./types"
import { APP_PRESETS } from "./presets"
import { WelcomeStep } from "./WelcomeStep"
import { PresetSelectionStep } from "./PresetSelectionStep"
import { CustomAppStep } from "./CustomAppStep"
import { ConfirmationStep } from "./ConfirmationStep"

export const OnboardingWizard: Component<OnboardingWizardProps> = (props) => {
  // Wizard state using signals (createStore doesn't work well with Set)
  const [currentStep, setCurrentStep] = createSignal<WizardStep>("welcome")
  const [selectedPresets, setSelectedPresets] = createSignal<Set<string>>(new Set())
  const [customApps, setCustomApps] = createSignal<AppEntryConfig[]>([])

  // Step navigation
  const goToStep = (step: WizardStep) => setCurrentStep(step)

  const handleNext = () => {
    switch (currentStep()) {
      case "welcome":
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
        goToStep("welcome")
        break
    }
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

  // Confirmation handler - builds final app list from presets and custom apps
  const handleConfirm = () => {
    const apps: AppEntryConfig[] = []

    // Add selected presets as apps
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

    // Append custom apps
    apps.push(...customApps())

    props.onComplete(apps)
  }

  // Skip handler
  const handleSkip = () => {
    props.onSkip()
  }

  // Step indicator helpers
  const stepNumber = () => {
    const steps: WizardStep[] = ["welcome", "presets", "custom", "confirm"]
    return steps.indexOf(currentStep()) + 1
  }

  const stepName = () => {
    switch (currentStep()) {
      case "welcome":
        return "Welcome"
      case "presets":
        return "Select Apps"
      case "custom":
        return "Custom Apps"
      case "confirm":
        return "Review"
    }
  }

  const stepIndicator = () => {
    const steps: WizardStep[] = ["welcome", "presets", "custom", "confirm"]
    return steps
      .map((step, i) => (i < stepNumber() ? "[*]" : "[ ]"))
      .join("---")
  }

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      borderStyle="double"
      borderColor={props.theme.accent}
    >
      {/* Step indicator */}
      <box height={1} justifyContent="center">
        <text fg={props.theme.muted}>
          Step {stepNumber()} of 4: {stepName()}
        </text>
      </box>
      <box height={1} justifyContent="center">
        <text fg={props.theme.accent}>
          {stepIndicator()}
        </text>
      </box>

      {/* Content area */}
      <box flexGrow={1}>
        <Switch>
          <Match when={currentStep() === "welcome"}>
            <WelcomeStep
              theme={props.theme}
              onNext={handleNext}
              onSkip={handleSkip}
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
