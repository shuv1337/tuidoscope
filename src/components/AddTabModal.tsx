import { Component, createSignal, createMemo } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { execSync } from "child_process"
import type { ThemeConfig, AppEntryConfig } from "../types"
import { APP_PRESETS, type AppPreset } from "../lib/presets"

/**
 * Check if a command is available in the system PATH
 */
function checkAvailability(command: string): boolean {
  try {
    execSync(`which ${command.split(" ")[0]}`, { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

export interface AddTabModalProps {
  theme: ThemeConfig
  onAdd: (entry: AppEntryConfig) => void
  onClose: () => void
}

type Field = "name" | "command" | "args" | "cwd"

export const AddTabModal: Component<AddTabModalProps> = (props) => {
  const [mode, setMode] = createSignal<"preset" | "custom">("preset")
  const [selectedPresetIndex, setSelectedPresetIndex] = createSignal(0)

  // Create memoized presets with availability, sorted: available first, unavailable last
  const presetsWithAvailability = createMemo(() => {
    const presets = APP_PRESETS.map((preset) => ({
      ...preset,
      available: checkAvailability(preset.command),
    }))
    // Sort: available first, then by name within each group
    return presets.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  })

  const [name, setName] = createSignal("")
  const [command, setCommand] = createSignal("")
  const [args, setArgs] = createSignal("")
  const [cwd, setCwd] = createSignal("~")
  const [focusedField, setFocusedField] = createSignal<Field>("name")

  const fields: { key: Field; label: string; value: () => string; setValue: (v: string) => void }[] = [
    { key: "name", label: "Name", value: name, setValue: setName },
    { key: "command", label: "Command", value: command, setValue: setCommand },
    { key: "args", label: "Arguments", value: args, setValue: setArgs },
    { key: "cwd", label: "Directory", value: cwd, setValue: setCwd },
  ]

  const focusIndex = () => fields.findIndex((field) => field.key === focusedField())
  const setFocusByIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(fields.length - 1, index))
    setFocusedField(fields[clamped].key)
  }

  const handleSubmit = () => {
    if (name() && command()) {
      props.onAdd({
        name: name(),
        command: command(),
        args: args().trim() || undefined,
        cwd: cwd() || "~",
        autostart: false,
      })
    }
  }

  const handlePresetSelect = (preset: AppPreset) => {
    props.onAdd({
      name: preset.name,
      command: preset.command,
      cwd: "~",
      autostart: false,
    })
  }

  useKeyboard((event) => {
    if (event.name === "escape") {
      props.onClose()
      event.preventDefault()
      return
    }

    // Tab key toggles between preset and custom mode
    if (event.name === "tab") {
      setMode(mode() === "preset" ? "custom" : "preset")
      event.preventDefault()
      return
    }

    // Handle preset mode navigation
    if (mode() === "preset") {
      const presets = presetsWithAvailability()
      if (event.name === "return" || event.name === "enter") {
        const selectedPreset = presets[selectedPresetIndex()]
        if (selectedPreset && selectedPreset.available) {
          handlePresetSelect(selectedPreset)
        }
        event.preventDefault()
        return
      }

      if (event.sequence === "j" || event.name === "down") {
        setSelectedPresetIndex(Math.min(selectedPresetIndex() + 1, presets.length - 1))
        event.preventDefault()
        return
      }

      if (event.sequence === "k" || event.name === "up") {
        setSelectedPresetIndex(Math.max(selectedPresetIndex() - 1, 0))
        event.preventDefault()
        return
      }
      return
    }

    // Handle custom mode
    if (event.name === "return" || event.name === "enter") {
      handleSubmit()
      event.preventDefault()
      return
    }

    const focused = fields[focusIndex()]
    if (!focused) {
      return
    }

    // Up/Down for field navigation in custom mode
    if (event.name === "down") {
      setFocusByIndex(focusIndex() + 1)
      event.preventDefault()
      return
    }

    if (event.name === "up") {
      setFocusByIndex(focusIndex() - 1)
      event.preventDefault()
      return
    }

    if (event.name === "backspace") {
      focused.setValue(focused.value().slice(0, -1))
      event.preventDefault()
      return
    }

    if (!event.ctrl && !event.meta && !event.option && event.sequence && event.sequence.length === 1) {
      focused.setValue(focused.value() + event.sequence)
      event.preventDefault()
    }
  })

  return (
    <box
      position="absolute"
      top="30%"
      left="25%"
      width="50%"
      height={20}
      flexDirection="column"
      borderStyle="double"
      borderColor={props.theme.primary}
      backgroundColor={props.theme.background}
    >
      {/* Title */}
      <box height={1}>
        <text fg={props.theme.accent}>
          <b> Add New App</b>
        </text>
      </box>

      {/* Mode tabs */}
      <box height={1} flexDirection="row">
        <text
          fg={mode() === "preset" ? props.theme.background : props.theme.muted}
          bg={mode() === "preset" ? props.theme.primary : undefined}
        >
          {" [Presets] "}
        </text>
        <text
          fg={mode() === "custom" ? props.theme.background : props.theme.muted}
          bg={mode() === "custom" ? props.theme.primary : undefined}
        >
          {" [Custom] "}
        </text>
      </box>

      {/* Fields */}
      {fields.map((field) => {
        const isFocused = () => focusedField() === field.key
        return (
          <box height={1} flexDirection="row">
            <box width={12}>
              <text fg={isFocused() ? props.theme.accent : props.theme.muted}>{field.label}:</text>
            </box>
            <text
              fg={isFocused() ? props.theme.foreground : props.theme.muted}
              bg={isFocused() ? props.theme.primary : undefined}
            >
              {" "}{field.value()}{isFocused() ? "█" : " "}
            </text>
          </box>
        )
      })}

      {/* Footer */}
      <box height={1}>
        <text fg={props.theme.muted}>
          Enter:Add | Esc:Cancel | Tab:Next field
        </text>
      </box>
    </box>
  )
}
