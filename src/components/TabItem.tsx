import { Component } from "solid-js"
import type { AppEntry, AppStatus } from "../types"
import type { ThemeConfig } from "../types"

export interface TabItemProps {
  entry: AppEntry
  status: AppStatus
  isActive: boolean
  isFocused: boolean
  width: number
  theme: ThemeConfig
  onSelect: () => void
}

/**
 * Get status indicator character
 */
function getStatusIndicator(status: AppStatus): string {
  switch (status) {
    case "running":
      return "●"
    case "stopped":
      return "○"
    case "error":
      return "✖"
  }
}

/**
 * Get status color
 */
function getStatusColor(status: AppStatus, theme: ThemeConfig): string {
  switch (status) {
    case "running":
      return "#9ece6a" // Green
    case "stopped":
      return theme.muted
    case "error":
      return "#f7768e" // Red
  }
}

export const TabItem: Component<TabItemProps> = (props) => {
  const truncatedName = () => {
    const maxLen = props.width - 4 // Account for status indicator and padding
    if (props.entry.name.length > maxLen) {
      return props.entry.name.slice(0, maxLen - 1) + "…"
    }
    return props.entry.name
  }

  const bgColor = () => {
    if (props.isActive) {
      return props.theme.primary
    }
    if (props.isFocused) {
      return props.theme.muted
    }
    return props.theme.background
  }

  const fgColor = () => {
    if (props.isActive) {
      return props.theme.background
    }
    return props.theme.foreground
  }

  return (
    <box
      height={1}
      width={props.width}
      flexDirection="row"
      onMouseDown={props.onSelect}
    >
      <text fg={getStatusColor(props.status, props.theme)}>
        {getStatusIndicator(props.status)}
      </text>
      <text> </text>
      <text fg={fgColor()} bg={bgColor()}>
        {props.isActive ? <b>{truncatedName()}</b> : truncatedName()}
      </text>
    </box>
  )
}
