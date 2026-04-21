import type { BoardBounds } from './boardGeometry';

export interface BoardViewport {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BoardLayoutOptions {
    tileSize: number;
    gap: number;
    minScale?: number;
    maxScale?: number;
    fitPadding?: number;
}

export interface BoardLayout {
    scale: number;
    tileSize: number;
    gap: number;
    boardWidth: number;
    boardHeight: number;
    originX: number;
    originY: number;
    cols: number;
    rows: number;
}

export interface BoardOutlineRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

function spanSize(count: number, tileSize: number, gap: number): number {
    if (count <= 0) return 0;
    return count * tileSize + (count - 1) * gap;
}

export function calculateBoardLayout(
    bounds: BoardBounds,
    viewport: BoardViewport,
    options: BoardLayoutOptions,
): BoardLayout {
    const cols = bounds.maxCol - bounds.minCol + 1;
    const rows = bounds.maxRow - bounds.minRow + 1;

    const baseWidth = spanSize(cols, options.tileSize, options.gap);
    const baseHeight = spanSize(rows, options.tileSize, options.gap);
    const fitPadding = options.fitPadding ?? 0.95;

    const widthScale = baseWidth > 0 ? (viewport.width / baseWidth) * fitPadding : 1;
    const heightScale = baseHeight > 0 ? (viewport.height / baseHeight) * fitPadding : 1;

    const rawScale = Math.min(1, widthScale, heightScale);
    const minScale = options.minScale ?? 0.4;
    const maxScale = options.maxScale ?? 1;
    const scale = Math.max(minScale, Math.min(maxScale, rawScale));

    const tileSize = options.tileSize * scale;
    const gap = options.gap * scale;
    const boardWidth = spanSize(cols, tileSize, gap);
    const boardHeight = spanSize(rows, tileSize, gap);
    const originX = viewport.x + (viewport.width - boardWidth) / 2;
    const originY = viewport.y + (viewport.height - boardHeight) / 2;

    return {
        scale,
        tileSize,
        gap,
        boardWidth,
        boardHeight,
        originX,
        originY,
        cols,
        rows,
    };
}

export function calculateBoardOutlineRect(
    boardBounds: BoardBounds,
    targetBounds: BoardBounds,
    layout: BoardLayout,
    padding = 0,
): BoardOutlineRect {
    const step = layout.tileSize + layout.gap;
    const cols = targetBounds.maxCol - targetBounds.minCol + 1;
    const rows = targetBounds.maxRow - targetBounds.minRow + 1;

    return {
        x: layout.originX + (targetBounds.minCol - boardBounds.minCol) * step - padding,
        y: layout.originY + (targetBounds.minRow - boardBounds.minRow) * step - padding,
        width: spanSize(cols, layout.tileSize, layout.gap) + padding * 2,
        height: spanSize(rows, layout.tileSize, layout.gap) + padding * 2,
    };
}
