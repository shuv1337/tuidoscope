import type { AppEntryConfig, ThemeConfig } from "../../types"

export type WizardStep = "welcome" | "keybindings" | "presets" | "custom" | "confirm"

export interface WizardState {
  currentStep: WizardStep
  selectedPresets: Set<string>
  customApps: AppEntryConfig[]
  selectedLeaderKey: string
}

export interface OnboardingWizardProps {
  theme: ThemeConfig
  onComplete: (apps: AppEntryConfig[], leaderKey: string) => void
  onSkip: () => void
}

export interface KeybindingStepProps {
  theme: ThemeConfig
  selectedLeaderKey: string
  onSelectLeader: (key: string) => void
  onNext: () => void
  onBack: () => void
}
