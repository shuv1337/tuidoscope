import { Component, createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig, AppEntryConfig } from "../types"

export interface AddTabModalProps {
  theme: ThemeConfig
  onAdd: (entry: AppEntryConfig) => void
  onClose: () => void
}

type Field = "name" | "command" | "args" | "cwd"

export const AddTabModal: Component<AddTabModalProps> = (props) => {
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

  useKeyboard((event) => {
    if (event.name === "escape") {
      props.onClose()
      event.preventDefault()
      return
    }

    if (event.name === "tab") {
      const direction = event.shift ? -1 : 1
      setFocusByIndex(focusIndex() + direction)
      event.preventDefault()
      return
    }

    if (event.name === "return" || event.name === "enter") {
      handleSubmit()
      event.preventDefault()
      return
    }

    const focused = fields[focusIndex()]
    if (!focused) {
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
      height={11}
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

      {/* Fields */}
      {fields.map((field) => (
        <box height={1} flexDirection="row">
          <box width={12}>
            <text fg={props.theme.muted}>{field.label}:</text>
          </box>
          <box
            flexGrow={1}
            borderStyle={focusedField() === field.key ? "single" : undefined}
            borderColor={props.theme.primary}
          >
            <text fg={props.theme.foreground}>
              {field.value()}
              {focusedField() === field.key ? "█" : ""}
            </text>
          </box>
        </box>
      ))}

      {/* Footer */}
      <box height={1}>
        <text fg={props.theme.muted}>
          Enter:Add | Esc:Cancel | Tab:Next field
        </text>
      </box>
    </box>
  )
}
