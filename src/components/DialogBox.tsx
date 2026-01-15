import { Component } from "solid-js"
import type { JSX } from "solid-js"
import type { ThemeConfig } from "../types"

type DimensionValue = number | "auto" | `${number}%`

export interface DialogBoxProps {
  theme: ThemeConfig
  top?: DimensionValue
  left?: DimensionValue
  width?: DimensionValue
  height?: DimensionValue
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
