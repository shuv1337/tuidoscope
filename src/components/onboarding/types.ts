import type { AppEntryConfig, ThemeConfig } from "../../types"
import type { AppPreset } from "./presets"

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

/** A row in the preset list - either a category header or a preset item */
export type ListRow =
  | { type: "header"; category: string; label: string }
  | { type: "preset"; preset: AppPreset; originalIndex: number }
