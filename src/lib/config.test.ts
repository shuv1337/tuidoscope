import { describe, expect, test } from "bun:test"
import { isV1Config, migrateV1ToV2, migrateConfig } from "./config"

describe("isV1Config", () => {
  test("detects V1 config with flat keybinds", () => {
    const v1Config = {
      version: 1,
      keybinds: {
        next_tab: "ctrl+n",
        prev_tab: "ctrl+p",
        toggle_focus: "ctrl+a",
        quit: "ctrl+q",
      },
    }
    expect(isV1Config(v1Config)).toBe(true)
  })

  test("detects V1 config with no keybinds section", () => {
    const configNoKeybinds = {
      version: 1,
      theme: {
        primary: "#82aaff",
      },
    }
    expect(isV1Config(configNoKeybinds)).toBe(true)
  })

  test("detects V2 config with leader object", () => {
    const v2Config = {
      version: 2,
      keybinds: {
        leader: {
          key: "ctrl+a",
          timeout: 1000,
        },
        bindings: {
          next_tab: "n",
        },
        direct: {
          navigate_up: "k",
        },
      },
    }
    expect(isV1Config(v2Config)).toBe(false)
  })

  test("handles null/undefined input", () => {
    expect(isV1Config(null)).toBe(false)
    expect(isV1Config(undefined)).toBe(false)
  })

  test("handles empty object", () => {
    expect(isV1Config({})).toBe(true) // No keybinds = treat as V1 for migration
  })
})

describe("migrateV1ToV2", () => {
  test("extracts leader key from toggle_focus", () => {
    const v1Config = {
      version: 1,
      keybinds: {
        toggle_focus: "ctrl+b",
      },
    }
    const result = migrateV1ToV2(v1Config)
    expect(result.keybinds).toBeDefined()
    const keybinds = result.keybinds as { leader: { key: string } }
    expect(keybinds.leader.key).toBe("ctrl+b")
  })

  test("uses default ctrl+a leader when toggle_focus not set", () => {
    const v1Config = {
      version: 1,
      keybinds: {},
    }
    const result = migrateV1ToV2(v1Config)
    const keybinds = result.keybinds as { leader: { key: string } }
    expect(keybinds.leader.key).toBe("ctrl+a")
  })

  test("strips ctrl+ prefix from bindings", () => {
    const v1Config = {
      version: 1,
      keybinds: {
        next_tab: "ctrl+n",
        prev_tab: "ctrl+p",
        new_tab: "ctrl+t",
      },
    }
    const result = migrateV1ToV2(v1Config)
    const keybinds = result.keybinds as { bindings: Record<string, string> }
    expect(keybinds.bindings.next_tab).toBe("n")
    expect(keybinds.bindings.prev_tab).toBe("p")
    expect(keybinds.bindings.new_tab).toBe("t")
  })

  test("strips ctrl+shift+ prefix and uppercases for shift bindings", () => {
    const v1Config = {
      version: 1,
      keybinds: {
        restart_app: "ctrl+shift+r",
        kill_all: "ctrl+shift+k",
      },
    }
    const result = migrateV1ToV2(v1Config)
    const keybinds = result.keybinds as { bindings: Record<string, string> }
    expect(keybinds.bindings.restart_app).toBe("R")
    expect(keybinds.bindings.kill_all).toBe("K")
  })

  test("sets command_palette to space to resolve ctrl+p conflict", () => {
    const v1Config = {
      version: 1,
      keybinds: {
        command_palette: "ctrl+p", // Conflicts with prev_tab in V1
      },
    }
    const result = migrateV1ToV2(v1Config)
    const keybinds = result.keybinds as { bindings: Record<string, string> }
    expect(keybinds.bindings.command_palette).toBe("space")
  })

  test("preserves custom user bindings", () => {
    const v1Config = {
      version: 1,
      keybinds: {
        quit: "ctrl+x", // Custom quit key
        close_tab: "ctrl+d", // Custom close key
      },
    }
    const result = migrateV1ToV2(v1Config)
    const keybinds = result.keybinds as { bindings: Record<string, string> }
    expect(keybinds.bindings.quit).toBe("x")
    expect(keybinds.bindings.close_tab).toBe("d")
  })

  test("adds direct bindings with vim-style defaults", () => {
    const v1Config = {
      version: 1,
      keybinds: {},
    }
    const result = migrateV1ToV2(v1Config)
    const keybinds = result.keybinds as { direct: Record<string, string> }
    expect(keybinds.direct.navigate_up).toBe("k")
    expect(keybinds.direct.navigate_down).toBe("j")
    expect(keybinds.direct.select).toBe("enter")
    expect(keybinds.direct.go_top).toBe("g")
    expect(keybinds.direct.go_bottom).toBe("G")
  })

  test("sets version to 2", () => {
    const v1Config = {
      version: 1,
      keybinds: {},
    }
    const result = migrateV1ToV2(v1Config)
    expect(result.version).toBe(2)
  })

  test("adds leader config with default timeout and hints", () => {
    const v1Config = {
      version: 1,
      keybinds: {},
    }
    const result = migrateV1ToV2(v1Config)
    const keybinds = result.keybinds as {
      leader: { timeout: number; show_hints: boolean; hint_delay: number }
    }
    expect(keybinds.leader.timeout).toBe(1000)
    expect(keybinds.leader.show_hints).toBe(true)
    expect(keybinds.leader.hint_delay).toBe(300)
  })

  test("preserves non-keybind config properties", () => {
    const v1Config = {
      version: 1,
      theme: {
        primary: "#ff0000",
        background: "#000000",
      },
      apps: [{ name: "shell", command: "bash" }],
      tab_width: 25,
    }
    const result = migrateV1ToV2(v1Config)
    expect(result.theme).toEqual(v1Config.theme)
    expect(result.apps).toEqual(v1Config.apps)
    expect(result.tab_width).toBe(25)
  })
})

describe("migrateConfig", () => {
  test("migrates V1 config to V2", () => {
    const v1Config = {
      version: 1,
      keybinds: {
        next_tab: "ctrl+n",
        toggle_focus: "ctrl+a",
      },
    }
    const result = migrateConfig(v1Config) as { version: number }
    expect(result.version).toBe(2)
  })

  test("returns V2 config unchanged", () => {
    const v2Config = {
      version: 2,
      keybinds: {
        leader: {
          key: "ctrl+b",
          timeout: 2000,
          show_hints: false,
          hint_delay: 500,
        },
        bindings: {
          next_tab: "x",
          prev_tab: "y",
          close_tab: "w",
          new_tab: "t",
          toggle_focus: "a",
          edit_app: "e",
          restart_app: "r",
          command_palette: "space",
          stop_app: "z",
          kill_all: "K",
          quit: "q",
        },
        direct: {
          navigate_up: "p",
          navigate_down: "n",
          select: "enter",
          go_top: "h",
          go_bottom: "l",
        },
      },
    }
    const result = migrateConfig(v2Config)
    expect(result).toEqual(v2Config)
  })

  test("handles null/undefined input", () => {
    expect(migrateConfig(null)).toBe(null)
    expect(migrateConfig(undefined)).toBe(undefined)
  })

  test("migrates default V1 config with no customizations", () => {
    const defaultV1 = {
      version: 1,
    }
    const result = migrateConfig(defaultV1) as {
      version: number
      keybinds: {
        leader: { key: string }
        bindings: Record<string, string>
        direct: Record<string, string>
      }
    }
    expect(result.version).toBe(2)
    expect(result.keybinds.leader.key).toBe("ctrl+a")
    expect(result.keybinds.bindings.next_tab).toBe("n")
    expect(result.keybinds.direct.navigate_up).toBe("k")
  })
})
