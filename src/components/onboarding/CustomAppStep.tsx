import { Component, createSignal, For, Show } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig, AppEntryConfig } from "../../types"

export interface CustomAppStepProps {
  theme: ThemeConfig
  customApps: AppEntryConfig[]
  onAddApp: (app: AppEntryConfig) => void
  onRemoveApp: (index: number) => void
  onNext: () => void
  onBack: () => void
}

type Field = "name" | "command" | "args" | "cwd"

export const CustomAppStep: Component<CustomAppStepProps> = (props) => {
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

  const clearForm = () => {
    setName("")
    setCommand("")
    setArgs("")
    setCwd("~")
    setFocusedField("name")
  }

  const handleAddApp = () => {
    if (name().trim() && command().trim()) {
      props.onAddApp({
        name: name().trim(),
        command: command().trim(),
        args: args().trim() || undefined,
        cwd: cwd() || "~",
        autostart: false,
      })
      clearForm()
    }
  }

  useKeyboard((event) => {
    // Tab to cycle through form fields
    if (event.name === "tab") {
      const direction = event.shift ? -1 : 1
      setFocusByIndex(focusIndex() + direction)
      event.preventDefault()
      return
    }

    // Ctrl+A to add current form as app
    if (event.ctrl && event.name === "a") {
      handleAddApp()
      event.preventDefault()
      return
    }

    // Number keys 1-9 to remove corresponding custom app
    if (event.sequence && /^[1-9]$/.test(event.sequence)) {
      const index = parseInt(event.sequence, 10) - 1
      if (index < props.customApps.length) {
        props.onRemoveApp(index)
      }
      event.preventDefault()
      return
    }

    // Next step
    if (event.name === "return" || event.name === "enter") {
      props.onNext()
      event.preventDefault()
      return
    }

    // Back
    if (event.name === "escape") {
      props.onBack()
      event.preventDefault()
      return
    }

    // Handle text input for focused field
    const focused = fields[focusIndex()]
    if (!focused) {
      return
    }

    if (event.name === "backspace") {
      focused.setValue(focused.value().slice(0, -1))
      event.preventDefault()
      return
    }

    // Printable characters
    if (!event.ctrl && !event.meta && !event.option && event.sequence && event.sequence.length === 1) {
      focused.setValue(focused.value() + event.sequence)
      event.preventDefault()
    }
  })

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {/* Title */}
      <box height={1}>
        <text fg={props.theme.accent}>
          <b>Add Custom App (Optional)</b>
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* Form fields */}
      <box flexDirection="column" alignItems="flex-start">
        <For each={fields}>
          {(field) => {
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
          }}
        </For>
      </box>

      {/* Add button hint */}
      <box height={1}>
        <Show
          when={name().trim() && command().trim()}
          fallback={
            <text fg={props.theme.muted}>
              Fill name and command to add
            </text>
          }
        >
          <text fg={props.theme.accent}>
            Press Ctrl+A to add this app
          </text>
        </Show>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* Already-added custom apps section */}
      <Show when={props.customApps.length > 0}>
        <box height={1}>
          <text fg={props.theme.foreground}>
            <b>Custom apps to add:</b>
          </text>
        </box>
        <box flexDirection="column" alignItems="flex-start">
          <For each={props.customApps}>
            {(app, index) => (
              <box height={1}>
                <text fg={props.theme.foreground}>
                  {index() + 1}. {app.name}
                </text>
                <text fg={props.theme.muted}>
                  {" "}({app.command})
                </text>
              </box>
            )}
          </For>
        </box>
        <box height={1}>
          <text fg={props.theme.muted}>
            (press 1-9 to remove)
          </text>
        </box>
      </Show>

      {/* Spacer */}
      <box height={1} />

      {/* Footer keybind hints */}
      <box height={1}>
        <text fg={props.theme.primary}>
          Tab: Fields | Ctrl+A: Add | Enter: Next | Esc: Back
        </text>
      </box>
    </box>
  )
}
