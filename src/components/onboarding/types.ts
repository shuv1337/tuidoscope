import type { AppEntryConfig, ThemeConfig } from "../../types"

export type WizardStep = "welcome" | "presets" | "custom" | "confirm"

export interface WizardState {
  currentStep: WizardStep
  selectedPresets: Set<string>
  customApps: AppEntryConfig[]
}

export interface OnboardingWizardProps {
  theme: ThemeConfig
  onComplete: (apps: AppEntryConfig[]) => void
  onSkip: () => void
}
