import { randomUUID } from "crypto"

export function generateId(): string {
  try {
    return randomUUID()
  } catch {
    return Math.random().toString(36).substring(2, 11)
  }
}
