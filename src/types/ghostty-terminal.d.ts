import type { GhosttyTerminalOptions, GhosttyTerminalRenderable } from "ghostty-opentui/terminal-buffer"

type GhosttyTerminalProps = GhosttyTerminalOptions & {
  style?: { width?: number; height?: number }
  ref?: (el: GhosttyTerminalRenderable) => void
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ghostty-terminal": GhosttyTerminalProps
    }
  }
}

export {}
