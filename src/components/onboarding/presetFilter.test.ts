import { describe, expect, test } from "bun:test"
import { buildFilteredRows, getPresetIndices } from "./presetFilter"
import type { AppPreset } from "./presets"

// Test fixtures
const testPresets: AppPreset[] = [
  {
    id: "htop",
    name: "htop",
    command: "htop",
    description: "Interactive process viewer",
    icon: "H",
    category: "monitor",
  },
  {
    id: "btop",
    name: "btop",
    command: "btop",
    description: "Resource monitor",
    icon: "B",
    category: "monitor",
  },
  {
    id: "lazygit",
    name: "lazygit",
    command: "lazygit",
    description: "Simple terminal UI for git commands",
    icon: "G",
    category: "git",
  },
  {
    id: "nvim",
    name: "Neovim",
    command: "nvim",
    description: "Hyperextensible Vim-based text editor",
    icon: "N",
    category: "editor",
  },
  {
    id: "ranger",
    name: "ranger",
    command: "ranger",
    description: "Console file manager with VI key bindings",
    icon: "R",
    category: "files",
  },
]

describe("buildFilteredRows", () => {
  test("returns all presets with headers when category='all' and query=''", () => {
    const rows = buildFilteredRows(testPresets, "all", "")

    // Should have headers for each category + preset rows
    // monitor: 1 header + 2 presets = 3
    // git: 1 header + 1 preset = 2
    // editor: 1 header + 1 preset = 2
    // files: 1 header + 1 preset = 2
    // Total: 9 rows
    expect(rows.length).toBe(9)

    // First row should be monitor header
    expect(rows[0]).toEqual({
      type: "header",
      category: "monitor",
      label: "System Monitors",
    })

    // Second row should be htop preset
    expect(rows[1].type).toBe("preset")
    if (rows[1].type === "preset") {
      expect(rows[1].preset.id).toBe("htop")
      expect(rows[1].originalIndex).toBe(0)
    }
  })

  test("filters by category correctly", () => {
    const rows = buildFilteredRows(testPresets, "git", "")

    // Should have 1 header + 1 preset
    expect(rows.length).toBe(2)

    expect(rows[0]).toEqual({
      type: "header",
      category: "git",
      label: "Git Tools",
    })

    if (rows[1].type === "preset") {
      expect(rows[1].preset.id).toBe("lazygit")
      expect(rows[1].originalIndex).toBe(2) // original index in testPresets
    }
  })

  test("query match is case-insensitive", () => {
    const rowsLower = buildFilteredRows(testPresets, "all", "htop")
    const rowsUpper = buildFilteredRows(testPresets, "all", "HTOP")
    const rowsMixed = buildFilteredRows(testPresets, "all", "HtOp")

    // All should return same results
    expect(rowsLower.length).toBe(rowsUpper.length)
    expect(rowsLower.length).toBe(rowsMixed.length)
    expect(rowsLower.length).toBe(2) // 1 header + 1 preset
  })

  test("query matches partial strings", () => {
    const rows = buildFilteredRows(testPresets, "all", "top")

    // Should match htop and btop
    expect(rows.length).toBe(3) // 1 header + 2 presets

    const presetRows = rows.filter((r) => r.type === "preset")
    expect(presetRows.length).toBe(2)
  })

  test("query matches against name", () => {
    const rows = buildFilteredRows(testPresets, "all", "neovim")

    expect(rows.length).toBe(2) // 1 header + 1 preset
    if (rows[1].type === "preset") {
      expect(rows[1].preset.id).toBe("nvim")
    }
  })

  test("query matches against description", () => {
    const rows = buildFilteredRows(testPresets, "all", "hyperextensible")

    expect(rows.length).toBe(2) // 1 header + 1 preset
    if (rows[1].type === "preset") {
      expect(rows[1].preset.id).toBe("nvim")
    }
  })

  test("query matches against command", () => {
    const rows = buildFilteredRows(testPresets, "all", "lazygit")

    expect(rows.length).toBe(2) // 1 header + 1 preset
    if (rows[1].type === "preset") {
      expect(rows[1].preset.id).toBe("lazygit")
    }
  })

  test("query matches against category label", () => {
    // "System Monitors" is the label for "monitor" category
    const rows = buildFilteredRows(testPresets, "all", "system monitors")

    expect(rows.length).toBe(3) // 1 header + 2 presets (htop, btop)
  })

  test("combined category + query uses AND logic", () => {
    // Search for "process" but only in "monitor" category
    const rows = buildFilteredRows(testPresets, "monitor", "process")

    // Should only find htop (has "process" in description and is in monitor category)
    expect(rows.length).toBe(2) // 1 header + 1 preset
    if (rows[1].type === "preset") {
      expect(rows[1].preset.id).toBe("htop")
    }
  })

  test("returns empty array when no matches", () => {
    const rows = buildFilteredRows(testPresets, "all", "nonexistent")

    expect(rows).toEqual([])
    expect(rows.length).toBe(0)
  })

  test("returns empty array when category has no matching presets", () => {
    // "ai" category doesn't exist in testPresets
    const rows = buildFilteredRows(testPresets, "ai", "")

    expect(rows).toEqual([])
  })

  test("only inserts headers for categories with matches", () => {
    // Search for "git" - should only show git category
    const rows = buildFilteredRows(testPresets, "all", "lazygit")

    const headerRows = rows.filter((r) => r.type === "header")
    expect(headerRows.length).toBe(1)
    if (headerRows[0].type === "header") {
      expect(headerRows[0].category).toBe("git")
    }
  })

  test("preserves originalIndex for selection tracking", () => {
    const rows = buildFilteredRows(testPresets, "all", "")

    // Check that originalIndex matches position in original array
    const presetRows = rows.filter((r) => r.type === "preset")
    expect(presetRows.length).toBe(5)

    // First preset (htop) should have originalIndex 0
    if (presetRows[0].type === "preset") {
      expect(presetRows[0].originalIndex).toBe(0)
      expect(presetRows[0].preset.id).toBe("htop")
    }

    // ranger (last in testPresets) should have originalIndex 4
    const rangerRow = presetRows.find(
      (r) => r.type === "preset" && r.preset.id === "ranger"
    )
    if (rangerRow?.type === "preset") {
      expect(rangerRow.originalIndex).toBe(4)
    }
  })

  test("trims whitespace from query", () => {
    const rows = buildFilteredRows(testPresets, "all", "  htop  ")

    expect(rows.length).toBe(2) // 1 header + 1 preset
  })
})

describe("getPresetIndices", () => {
  test("returns only indices of preset rows", () => {
    const rows = buildFilteredRows(testPresets, "all", "")
    const indices = getPresetIndices(rows)

    // Should have 5 preset indices
    expect(indices.length).toBe(5)

    // Verify all indices point to preset rows
    for (const idx of indices) {
      expect(rows[idx].type).toBe("preset")
    }
  })

  test("skips header rows", () => {
    const rows = buildFilteredRows(testPresets, "all", "")
    const indices = getPresetIndices(rows)

    // Header rows should not be in indices
    const headerIndices = rows
      .map((r, i) => (r.type === "header" ? i : -1))
      .filter((i) => i >= 0)

    for (const headerIdx of headerIndices) {
      expect(indices).not.toContain(headerIdx)
    }
  })

  test("returns empty array when no preset rows", () => {
    const rows = buildFilteredRows(testPresets, "all", "nonexistent")
    const indices = getPresetIndices(rows)

    expect(indices).toEqual([])
  })

  test("returns correct indices for filtered results", () => {
    const rows = buildFilteredRows(testPresets, "monitor", "")
    const indices = getPresetIndices(rows)

    // monitor category: 1 header (idx 0) + 2 presets (idx 1, 2)
    expect(indices).toEqual([1, 2])
  })

  test("handles single category with single preset", () => {
    const rows = buildFilteredRows(testPresets, "git", "")
    const indices = getPresetIndices(rows)

    // git category: 1 header (idx 0) + 1 preset (idx 1)
    expect(indices).toEqual([1])
  })
})
