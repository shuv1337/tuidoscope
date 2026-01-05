import { describe, expect, test } from "bun:test"
import {
  parseKeybind,
  matchesKeybind,
  matchesLeaderKey,
  matchesSingleKey,
  formatLeaderKeybind,
  formatLeaderKey,
  formatKeybind,
  leaderKeyToSequence,
  createLeaderBindingHandler,
} from "./keybinds"
import {
  eventToKeybindString,
  isValidLeaderKey,
} from "./key-capture"
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

describe("matchesLeaderKey", () => {
  test("delegates to matchesKeybind", () => {
    const event = createKeyEvent({ name: "a", ctrl: true, sequence: "\x01" })
    expect(matchesLeaderKey(event, "ctrl+a")).toBe(true)
    expect(matchesLeaderKey(event, "ctrl+b")).toBe(false)
  })
})

describe("matchesSingleKey", () => {
  test("matches simple letter", () => {
    const event = createKeyEvent({ name: "n" })
    expect(matchesSingleKey(event, "n")).toBe(true)
    expect(matchesSingleKey(event, "p")).toBe(false)
  })

  test("matches space key", () => {
    const event = createKeyEvent({ name: "space", sequence: " " })
    expect(matchesSingleKey(event, "space")).toBe(true)
  })

  test("matches enter key", () => {
    const event = createKeyEvent({ name: "return" })
    expect(matchesSingleKey(event, "enter")).toBe(true)
    
    const event2 = createKeyEvent({ name: "enter" })
    expect(matchesSingleKey(event2, "enter")).toBe(true)
  })

  test("matches uppercase (shift+letter)", () => {
    const event = createKeyEvent({ name: "k", shift: true })
    expect(matchesSingleKey(event, "K")).toBe(true)
    
    // Lowercase k should not match uppercase K
    const eventLower = createKeyEvent({ name: "k" })
    expect(matchesSingleKey(eventLower, "K")).toBe(false)
  })

  test("rejects when modifiers present for simple keys", () => {
    const event = createKeyEvent({ name: "n", ctrl: true })
    expect(matchesSingleKey(event, "n")).toBe(false)
    
    const event2 = createKeyEvent({ name: "n", shift: true })
    expect(matchesSingleKey(event2, "n")).toBe(false)
  })
})

describe("formatLeaderKeybind", () => {
  test("formats ctrl+a leader with binding", () => {
    expect(formatLeaderKeybind("ctrl+a", "n")).toBe("^A+n")
    expect(formatLeaderKeybind("ctrl+a", "p")).toBe("^A+p")
  })

  test("formats ctrl+b leader with binding", () => {
    expect(formatLeaderKeybind("ctrl+b", "t")).toBe("^B+t")
  })
})

describe("formatLeaderKey", () => {
  test("formats ctrl+letter as caret notation", () => {
    expect(formatLeaderKey("ctrl+a")).toBe("^A")
    expect(formatLeaderKey("ctrl+b")).toBe("^B")
    expect(formatLeaderKey("ctrl+z")).toBe("^Z")
  })

  test("handles alt modifier", () => {
    expect(formatLeaderKey("alt+x")).toBe("Alt+X")
  })

  test("handles multiple modifiers", () => {
    expect(formatLeaderKey("ctrl+shift+a")).toBe("^A") // ctrl+letter takes precedence
  })
})

describe("formatKeybind", () => {
  test("capitalizes each part", () => {
    expect(formatKeybind("ctrl+p")).toBe("Ctrl+P")
    expect(formatKeybind("ctrl+shift+a")).toBe("Ctrl+Shift+A")
  })
})

describe("leaderKeyToSequence", () => {
  test("converts ctrl+a to \\x01", () => {
    expect(leaderKeyToSequence("ctrl+a")).toBe("\x01")
  })

  test("converts ctrl+b to \\x02", () => {
    expect(leaderKeyToSequence("ctrl+b")).toBe("\x02")
  })

  test("converts ctrl+z to \\x1a", () => {
    expect(leaderKeyToSequence("ctrl+z")).toBe("\x1a")
  })

  test("returns null for non-ctrl keys", () => {
    expect(leaderKeyToSequence("alt+a")).toBe(null)
    expect(leaderKeyToSequence("space")).toBe(null)
  })

  test("returns null for ctrl+non-letter", () => {
    expect(leaderKeyToSequence("ctrl+1")).toBe(null)
    expect(leaderKeyToSequence("ctrl+space")).toBe(null)
  })
})

describe("createLeaderBindingHandler", () => {
  const bindings = {
    next_tab: "n",
    prev_tab: "p",
    close_tab: "w",
    new_tab: "t",
    toggle_focus: "a",
    edit_app: "e",
    restart_app: "r",
    command_palette: "space",
    stop_app: "x",
    kill_all: "K",
    quit: "q",
  }

  test("returns action for matching key", () => {
    const handler = createLeaderBindingHandler(bindings, {})
    
    expect(handler(createKeyEvent({ name: "n" }))).toBe("next_tab")
    expect(handler(createKeyEvent({ name: "p" }))).toBe("prev_tab")
    expect(handler(createKeyEvent({ name: "q" }))).toBe("quit")
  })

  test("calls handler when action matched", () => {
    let called = false
    const handler = createLeaderBindingHandler(bindings, {
      next_tab: () => { called = true }
    })
    
    handler(createKeyEvent({ name: "n" }))
    expect(called).toBe(true)
  })

  test("returns null for unmatched key", () => {
    const handler = createLeaderBindingHandler(bindings, {})
    expect(handler(createKeyEvent({ name: "z" }))).toBe(null)
  })

  test("handles space binding for command_palette", () => {
    const handler = createLeaderBindingHandler(bindings, {})
    expect(handler(createKeyEvent({ name: "space", sequence: " " }))).toBe("command_palette")
  })

  test("handles uppercase K for kill_all", () => {
    const handler = createLeaderBindingHandler(bindings, {})
    expect(handler(createKeyEvent({ name: "k", shift: true }))).toBe("kill_all")
  })
})

describe("eventToKeybindString", () => {
  test("converts simple key", () => {
    expect(eventToKeybindString(createKeyEvent({ name: "a" }))).toBe("a")
  })

  test("converts ctrl+key", () => {
    expect(eventToKeybindString(createKeyEvent({ name: "a", ctrl: true }))).toBe("ctrl+a")
  })

  test("converts alt+key", () => {
    expect(eventToKeybindString(createKeyEvent({ name: "x", option: true }))).toBe("alt+x")
  })

  test("converts multiple modifiers", () => {
    const event = createKeyEvent({ name: "k", ctrl: true, shift: true })
    expect(eventToKeybindString(event)).toBe("ctrl+shift+k")
  })

  test("normalizes return to enter", () => {
    expect(eventToKeybindString(createKeyEvent({ name: "return" }))).toBe("enter")
  })

  test("normalizes space", () => {
    expect(eventToKeybindString(createKeyEvent({ name: " " }))).toBe("space")
  })
})

describe("isValidLeaderKey", () => {
  test("accepts ctrl+letter", () => {
    expect(isValidLeaderKey("ctrl+a")).toBe(true)
    expect(isValidLeaderKey("ctrl+b")).toBe(true)
  })

  test("accepts alt+letter", () => {
    expect(isValidLeaderKey("alt+x")).toBe(true)
  })

  test("accepts meta/cmd+letter", () => {
    expect(isValidLeaderKey("meta+k")).toBe(true)
    expect(isValidLeaderKey("cmd+k")).toBe(true)
  })

  test("rejects single letter without modifier", () => {
    expect(isValidLeaderKey("a")).toBe(false)
    expect(isValidLeaderKey("n")).toBe(false)
  })

  test("rejects reserved keys even with modifier", () => {
    expect(isValidLeaderKey("ctrl+enter")).toBe(false)
    expect(isValidLeaderKey("ctrl+escape")).toBe(false)
    expect(isValidLeaderKey("ctrl+tab")).toBe(false)
    expect(isValidLeaderKey("ctrl+backspace")).toBe(false)
  })

  test("accepts ctrl+space", () => {
    expect(isValidLeaderKey("ctrl+space")).toBe(true)
  })
})
