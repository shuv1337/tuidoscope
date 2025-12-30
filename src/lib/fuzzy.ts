import Fuse from "fuse.js"
import type { AppEntry } from "../types"

export interface SearchResult {
  item: AppEntry
  score: number
}

/**
 * Create a fuzzy search instance for app entries
 */
export function createAppSearch(entries: AppEntry[]) {
  const fuse = new Fuse(entries, {
    keys: ["name", "command"],
    threshold: 0.4,
    includeScore: true,
  })

  return {
    search: (query: string): SearchResult[] => {
      if (!query.trim()) {
        // Return all entries when no query
        return entries.map((item) => ({ item, score: 0 }))
      }

      const results = fuse.search(query)
      return results.map((r) => ({
        item: r.item,
        score: r.score ?? 0,
      }))
    },

    /**
     * Update the search index with new entries
     */
    update: (newEntries: AppEntry[]) => {
      fuse.setCollection(newEntries)
    },
  }
}

/**
 * Highlight matching characters in a string
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  let result = ""
  let queryIndex = 0

  for (let i = 0; i < text.length; i++) {
    if (queryIndex < lowerQuery.length && lowerText[i] === lowerQuery[queryIndex]) {
      result += `\x1b[1m${text[i]}\x1b[22m` // Bold matching chars
      queryIndex++
    } else {
      result += text[i]
    }
  }

  return result
}
