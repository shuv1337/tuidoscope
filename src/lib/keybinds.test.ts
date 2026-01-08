import { describe, expect, test } from "bun:test"
import {
  parseKeybind,
  matchesKeybind,
  formatKeybind,
} from "./keybinds"
import type { KeyEvent } from "@opentui/core"

// Helper to create mock KeyEvent objects
// We use type assertion since KeyEvent is a class with private members
function createKeyEvent(overrides: Partial<KeyEvent>): KeyEvent {
  return {
    name: "",
    sequence: "",
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    number: false,
    raw: "",
    eventType: "keypress",
    source: "raw",
    defaultPrevented: false,
    preventDefault: () => {},
    ...overrides,
  } as KeyEvent
}

describe("parseKeybind", () => {
  test("parses simple key", () => {
    const result = parseKeybind("a")
    expect(result.key).toBe("a")
    expect(result.ctrl).toBe(false)
    expect(result.alt).toBe(false)
    expect(result.shift).toBe(false)
    expect(result.meta).toBe(false)
  })

  test("parses ctrl+key", () => {
    const result = parseKeybind("ctrl+a")
    expect(result.key).toBe("a")
    expect(result.ctrl).toBe(true)
    expect(result.alt).toBe(false)
  })

  test("parses alt+key", () => {
    const result = parseKeybind("alt+x")
    expect(result.key).toBe("x")
    expect(result.alt).toBe(true)
  })

  test("parses multiple modifiers", () => {
    const result = parseKeybind("ctrl+shift+alt+k")
    expect(result.key).toBe("k")
    expect(result.ctrl).toBe(true)
    expect(result.shift).toBe(true)
    expect(result.alt).toBe(true)
  })

  test("normalizes to lowercase", () => {
    const result = parseKeybind("CTRL+A")
    expect(result.key).toBe("a")
    expect(result.ctrl).toBe(true)
  })

  test("parses cmd as meta", () => {
    const result = parseKeybind("cmd+s")
    expect(result.meta).toBe(true)
    expect(result.key).toBe("s")
  })
})

describe("matchesKeybind", () => {
  test("matches simple key", () => {
    const event = createKeyEvent({ name: "a" })
    expect(matchesKeybind(event, "a")).toBe(true)
    expect(matchesKeybind(event, "b")).toBe(false)
  })

  test("matches ctrl+key", () => {
    const event = createKeyEvent({ name: "a", ctrl: true })
    expect(matchesKeybind(event, "ctrl+a")).toBe(true)
    expect(matchesKeybind(event, "a")).toBe(false) // ctrl is pressed but not expected
    expect(matchesKeybind(event, "ctrl+b")).toBe(false)
  })

  test("matches ctrl sequence", () => {
    // Ctrl+A sends \x01 (ASCII 1)
    const event = createKeyEvent({ name: "a", sequence: "\x01", ctrl: true })
    expect(matchesKeybind(event, "ctrl+a")).toBe(true)
  })

  test("matches space key", () => {
    const event = createKeyEvent({ name: "space", sequence: " " })
    expect(matchesKeybind(event, "space")).toBe(true)
  })

  test("rejects when modifier mismatch", () => {
    const event = createKeyEvent({ name: "a", ctrl: true })
    expect(matchesKeybind(event, "shift+a")).toBe(false)
    expect(matchesKeybind(event, "alt+a")).toBe(false)
  })

  test("handles option as alt", () => {
    const event = createKeyEvent({ name: "a", option: true })
    expect(matchesKeybind(event, "alt+a")).toBe(true)
  })
})

describe("formatKeybind", () => {
  test("capitalizes each part", () => {
    expect(formatKeybind("ctrl+p")).toBe("Ctrl+P")
    expect(formatKeybind("ctrl+shift+a")).toBe("Ctrl+Shift+A")
  })
})
