import type { AppPreset } from "./presets"
import { CATEGORY_LABELS } from "./presets"
import type { ListRow } from "./types"

/**
 * Build a filtered list of rows (headers + presets) based on category and search query.
 * Returns ListRow[] with category headers inserted when category changes.
 */
export function buildFilteredRows(
  presets: AppPreset[],
  category: string | "all",
  query: string
): ListRow[] {
  const normalizedQuery = query.toLowerCase().trim()
  const rows: ListRow[] = []
  let lastCategory: string | undefined

  presets.forEach((preset, originalIndex) => {
    // Skip if category filter is active and doesn't match
    if (category !== "all" && preset.category !== category) {
      return
    }

    // Build searchable text from name, description, command, and category label
    const categoryLabel = preset.category ? CATEGORY_LABELS[preset.category] ?? preset.category : ""
    const searchableText = [
      preset.name,
      preset.description,
      preset.command,
      categoryLabel,
    ]
      .join(" ")
      .toLowerCase()

    // Skip if query doesn't match searchable text
    if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
      return
    }

    // Insert category header row when category changes
    if (preset.category && preset.category !== lastCategory) {
      rows.push({
        type: "header",
        category: preset.category,
        label: CATEGORY_LABELS[preset.category] ?? preset.category,
      })
      lastCategory = preset.category
    }

    // Push preset row with originalIndex for selection tracking
    rows.push({
      type: "preset",
      preset,
      originalIndex,
    })
  })

  return rows
}

/**
 * Extract indices of preset rows (skip headers) from a ListRow array.
 * Returns the array indices where type === "preset".
 */
export function getPresetIndices(rows: ListRow[]): number[] {
  const indices: number[] = []
  rows.forEach((row, index) => {
    if (row.type === "preset") {
      indices.push(index)
    }
  })
  return indices
}
