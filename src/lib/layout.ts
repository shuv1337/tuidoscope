import type { PaneId, PaneLayoutNode, PaneSplitDirection } from "../types"

export interface PaneRect {
  x: number
  y: number
  width: number
  height: number
}

function splitSize(total: number): [number, number] {
  const first = Math.floor(total / 2)
  const second = total - first
  return [first, second]
}

export function computePaneRects(
  layout: PaneLayoutNode,
  width: number,
  height: number,
  origin: { x: number; y: number } = { x: 0, y: 0 }
): Map<PaneId, PaneRect> {
  const rects = new Map<PaneId, PaneRect>()

  const walk = (node: PaneLayoutNode, x: number, y: number, w: number, h: number) => {
    if (node.type === "leaf") {
      rects.set(node.paneId, { x, y, width: w, height: h })
      return
    }

    if (node.direction === "vertical") {
      const [leftWidth, rightWidth] = splitSize(w)
      walk(node.children[0], x, y, leftWidth, h)
      walk(node.children[1], x + leftWidth, y, rightWidth, h)
      return
    }

    const [topHeight, bottomHeight] = splitSize(h)
    walk(node.children[0], x, y, w, topHeight)
    walk(node.children[1], x, y + topHeight, w, bottomHeight)
  }

  walk(layout, origin.x, origin.y, width, height)
  return rects
}

export function replacePaneLeaf(
  layout: PaneLayoutNode,
  paneId: PaneId,
  replacement: PaneLayoutNode
): PaneLayoutNode {
  if (layout.type === "leaf") {
    return layout.paneId === paneId ? replacement : layout
  }

  const [left, right] = layout.children
  return {
    ...layout,
    children: [
      replacePaneLeaf(left, paneId, replacement),
      replacePaneLeaf(right, paneId, replacement),
    ],
  }
}

export function removePaneLeaf(
  layout: PaneLayoutNode,
  paneId: PaneId
): { layout: PaneLayoutNode | null; removed: boolean } {
  if (layout.type === "leaf") {
    if (layout.paneId === paneId) {
      return { layout: null, removed: true }
    }
    return { layout, removed: false }
  }

  const leftResult = removePaneLeaf(layout.children[0], paneId)
  if (leftResult.removed) {
    if (!leftResult.layout) {
      const remaining = layout.children[1]
      return { layout: remaining, removed: true }
    }
    return {
      layout: {
        ...layout,
        children: [leftResult.layout, layout.children[1]],
      },
      removed: true,
    }
  }

  const rightResult = removePaneLeaf(layout.children[1], paneId)
  if (rightResult.removed) {
    if (!rightResult.layout) {
      const remaining = layout.children[0]
      return { layout: remaining, removed: true }
    }
    return {
      layout: {
        ...layout,
        children: [layout.children[0], rightResult.layout],
      },
      removed: true,
    }
  }

  return { layout, removed: false }
}

export function collectPaneIds(layout: PaneLayoutNode): PaneId[] {
  if (layout.type === "leaf") {
    return [layout.paneId]
  }
  return [...collectPaneIds(layout.children[0]), ...collectPaneIds(layout.children[1])]
}

export function buildSplitNode(
  direction: PaneSplitDirection,
  firstPaneId: PaneId,
  secondPaneId: PaneId
): PaneLayoutNode {
  return {
    type: "split",
    direction,
    children: [
      { type: "leaf", paneId: firstPaneId },
      { type: "leaf", paneId: secondPaneId },
    ],
  }
}
