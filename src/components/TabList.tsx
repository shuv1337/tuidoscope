import { Component, For, createMemo } from "solid-js"
import { TabItem } from "./TabItem"
import type { AppEntry, AppStatus, ThemeConfig } from "../types"

export interface TabListProps {
  entries: AppEntry[]
  activeTabId: string | null
  selectedIndex: number
  getStatus: (id: string) => AppStatus
  isFocused: boolean
  width: number
  height: number
  scrollOffset: number
  theme: ThemeConfig
  onSelect: (id: string) => void
  onAddClick: () => void
}

export const TabList: Component<TabListProps> = (props) => {
  const visibleHeight = () => props.height - 2 // Reserve space for header and add button

  const visibleEntries = createMemo(() => {
    const start = props.scrollOffset
    const end = start + visibleHeight()
    return props.entries.slice(start, end)
  })

  const hasScrollUp = () => props.scrollOffset > 0
  const hasScrollDown = () => props.scrollOffset + visibleHeight() < props.entries.length

  return (
    <box
      flexDirection="column"
      width={props.width}
      height={props.height}
      borderStyle="single"
      borderColor={props.isFocused ? props.theme.primary : props.theme.muted}
    >
      {/* Header */}
      <box height={1} width={props.width - 2}>
        <text fg={props.theme.accent}>
          <b>Apps {hasScrollUp() ? "▲" : " "}{hasScrollDown() ? "▼" : " "}</b>
        </text>
      </box>

      {/* Tab entries */}
      <box flexDirection="column" flexGrow={1}>
        <For each={visibleEntries()}>
          {(entry, index) => {
            const actualIndex = () => props.scrollOffset + index()
            return (
              <TabItem
                entry={entry}
                status={props.getStatus(entry.id)}
                isActive={entry.id === props.activeTabId}
                isFocused={props.isFocused && actualIndex() === props.selectedIndex}
                width={props.width - 2}
                theme={props.theme}
                onSelect={() => props.onSelect(entry.id)}
              />
            )
          }}
        </For>
      </box>

      {/* Add button */}
      <box height={1} width={props.width - 2} onMouseDown={props.onAddClick}>
        <text fg={props.theme.muted}>[+ Add]</text>
      </box>
    </box>
  )
}
