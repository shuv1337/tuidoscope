import { mkdir } from "fs/promises"
import { dirname } from "path"
import { paths } from "./xdg"
import type { AppEntry, AppStatus } from "../types"

export const SOCKET_PATH = paths.socket

export async function ensureSocketDir(): Promise<void> {
  await mkdir(dirname(SOCKET_PATH), { recursive: true })
}

export interface RunningAppSnapshot {
  entry: AppEntry
  status: AppStatus
  buffer: string
  runId: number
}

export type ClientMessage =
  | { type: "start"; entry: AppEntry }
  | { type: "stop"; id: string }
  | { type: "stop_all" }
  | { type: "restart"; entry: AppEntry }
  | { type: "input"; id: string; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "set_active"; id: string | null }
  | { type: "update_entry"; id: string; updates: Partial<AppEntry> }
  | { type: "shutdown" }

export type ServerMessage =
  | { type: "snapshot"; runningApps: RunningAppSnapshot[]; activeTabId: string | null }
  | { type: "started"; app: RunningAppSnapshot }
  | { type: "stopped"; id: string }
  | { type: "status"; id: string; status: AppStatus }
  | { type: "output"; id: string; data: string }
  | { type: "active"; id: string | null }
  | { type: "error"; message: string }

export function serializeMessage(message: ClientMessage | ServerMessage): string {
  return `${JSON.stringify(message)}\n`
}
