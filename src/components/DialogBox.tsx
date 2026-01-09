import { Component } from "solid-js"
import type { JSX } from "solid-js"
import type { ThemeConfig } from "../types"

export interface DialogBoxProps {
  theme: ThemeConfig
  top?: number | string
  left?: number | string
  width?: number | string
  height?: number | string
  children?: JSX.Element
}

export const DialogBox: Component<DialogBoxProps> = (props) => {
  return (
    <box
      position="absolute"
      top={props.top ?? "20%"}
      left={props.left ?? "20%"}
      width={props.width ?? "60%"}
      height={props.height ?? 10}
      flexDirection="column"
      borderStyle="double"
      borderColor={props.theme.primary}
      backgroundColor={props.theme.background}
    >
      {props.children}
    </box>
  )
}
