import { Component, createSignal } from "solid-js"
import type { ThemeConfig, AppEntryConfig } from "../types"

export interface AddTabModalProps {
  theme: ThemeConfig
  onAdd: (entry: AppEntryConfig) => void
  onClose: () => void
}

type Field = "name" | "command" | "cwd"

export const AddTabModal: Component<AddTabModalProps> = (props) => {
  const [name, setName] = createSignal("")
  const [command, setCommand] = createSignal("")
  const [cwd, setCwd] = createSignal("~")
  const [focusedField, setFocusedField] = createSignal<Field>("name")

  const fields: { key: Field; label: string; value: () => string; setValue: (v: string) => void }[] = [
    { key: "name", label: "Name", value: name, setValue: setName },
    { key: "command", label: "Command", value: command, setValue: setCommand },
    { key: "cwd", label: "Directory", value: cwd, setValue: setCwd },
  ]

  const handleSubmit = () => {
    if (name() && command()) {
      props.onAdd({
        name: name(),
        command: command(),
        cwd: cwd() || "~",
        autostart: false,
      })
    }
  }

  return (
    <box
      position="absolute"
      top="30%"
      left="25%"
      width="50%"
      height={10}
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
