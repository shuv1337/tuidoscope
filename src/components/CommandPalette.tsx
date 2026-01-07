import { Component, For, Show, createSignal, createMemo, createEffect } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { AppEntry, ThemeConfig } from "../types"
import { createAppSearch } from "../lib/fuzzy"
import { buildEntryCommand } from "../lib/command"

export type CommandAction = "switch" | "start" | "stop" | "restart" | "edit"
export type GlobalAction = "rerun_onboarding"

export interface CommandPaletteProps {
  entries: AppEntry[]
  theme: ThemeConfig
  onSelect: (entry: AppEntry, action: CommandAction) => void
  onGlobalAction?: (action: GlobalAction) => void
  onClose: () => void
}

interface GlobalCommand {
  id: GlobalAction
  name: string
  description: string
  keywords: string[]
}

// Global commands that appear based on search query
const GLOBAL_COMMANDS: GlobalCommand[] = [
  {
    id: "rerun_onboarding",
    name: "Add Apps (Onboarding)",
    description: "Rerun the onboarding wizard to add preset apps",
    keywords: ["onboarding", "wizard", "add", "apps", "presets", "setup"],
  },
]

type ResultItem = 
  | { type: "app"; item: AppEntry }
  | { type: "global"; command: GlobalCommand }

export const CommandPalette: Component<CommandPaletteProps> = (props) => {
  const [query, setQuery] = createSignal("")
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  const search = createMemo(() => createAppSearch(props.entries))

  // Combined results: apps + matching global commands
  const results = createMemo((): ResultItem[] => {
    const q = query().toLowerCase()
    const appResults = search().search(query())
    
    // Find matching global commands
    const matchingGlobalCommands = GLOBAL_COMMANDS.filter((cmd) => {
      if (q.length === 0) return true // Show all global commands when no query
      return (
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.keywords.some((kw) => kw.includes(q))
      )
    })
    
    // Combine results: global commands first (when matching), then apps
    const combined: ResultItem[] = [
      ...matchingGlobalCommands.map((cmd): ResultItem => ({ type: "global", command: cmd })),
      ...appResults.map((r): ResultItem => ({ type: "app", item: r.item })),
    ]
    
    return combined
  })

  const handleSelect = (result: ResultItem, action: CommandAction) => {
    if (result.type === "global") {
      props.onGlobalAction?.(result.command.id)
    } else {
      props.onSelect(result.item, action)
    }
  }

  useKeyboard((event) => {
    if (event.name === "escape") {
      props.onClose()
      event.preventDefault()
      return
    }

    if (event.name === "return" || event.name === "enter") {
      const selected = results()[selectedIndex()]
      if (selected) {
        handleSelect(selected, "switch")
      }
      event.preventDefault()
      return
    }

    if (event.name === "x") {
      const selected = results()[selectedIndex()]
      if (selected && selected.type === "app") {
        props.onSelect(selected.item, "stop")
      }
      event.preventDefault()
      return
    }

    if ((event.ctrl && event.name === "e") || event.sequence === "\u0005") {
      const selected = results()[selectedIndex()]
      if (selected && selected.type === "app") {
        props.onSelect(selected.item, "edit")
      }
      event.preventDefault()
      return
    }

    if (event.name === "up" || event.name === "k") {
      setSelectedIndex((current) => Math.max(0, current - 1))
      event.preventDefault()
      return
    }

    if (event.name === "down" || event.name === "j") {
      setSelectedIndex((current) => Math.min(results().length - 1, current + 1))
      event.preventDefault()
      return
    }

    if (event.name === "backspace") {
      setQuery((current) => current.slice(0, -1))
      event.preventDefault()
      return
    }

    if (!event.ctrl && !event.meta && !event.option && event.sequence && event.sequence.length === 1) {
      setQuery((current) => current + event.sequence)
      event.preventDefault()
    }
  })

  // Reset selection when results change
  createEffect(() => {
    results()
    setSelectedIndex(0)
  })

  return (
    <box
      position="absolute"
      top="20%"
      left="20%"
      width="60%"
      height="60%"
      flexDirection="column"
      borderStyle="double"
      borderColor={props.theme.primary}
      backgroundColor={props.theme.background}
    >
      {/* Search input */}
      <box
        height={1}
        flexDirection="row"
        borderStyle="single"
        borderColor={props.theme.muted}
      >
        <text fg={props.theme.foreground}>{`> ${query()}█`}</text>
      </box>

      {/* Results list */}
      <box flexDirection="column" flexGrow={1} overflow="hidden">
        <For each={results().slice(0, 10)}>
          {(result, index) => {
            const isSelected = () => index() === selectedIndex()
            const displayText = () => {
              if (result.type === "global") {
                return `[*] ${result.command.name}`
              }
              return `${result.item.name} - ${buildEntryCommand(result.item)}`
            }
            
            return (
              <box
                height={1}
                width="100%"
                flexDirection="row"
                backgroundColor={isSelected() ? props.theme.primary : props.theme.background}
                onMouseDown={() => handleSelect(result, "switch")}
              >
                <text
                  width="100%"
                  fg={isSelected() ? props.theme.background : (result.type === "global" ? props.theme.accent : props.theme.foreground)}
                  bg={isSelected() ? props.theme.primary : props.theme.background}
                >
                  {" "}{displayText()}
                </text>
              </box>
            )
          }}
        </For>
      </box>

      {/* Footer hints */}
      <box height={1} borderStyle="single" borderColor={props.theme.muted}>
        <text fg={props.theme.muted}>
          Enter:Select | x:Stop | Ctrl+E:Edit | Esc:Close | ↑↓:Navigate
        </text>
      </box>
    </box>
  )
}
