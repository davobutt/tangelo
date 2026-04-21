import { describe, expect, it } from 'vitest';
import { calculateBoardLayout, calculateBoardOutlineRect } from '../utils/boardLayout';

const viewport = {
    x: 24,
    y: 110,
    width: 432,
    height: 320,
};

const options = {
    tileSize: 72,
    gap: 8,
    minScale: 0.4,
    fitPadding: 0.95,
};

describe('calculateBoardLayout', () => {
    it('keeps initial 4x4 board fully visible in viewport', () => {
        const layout = calculateBoardLayout(
            { minRow: 0, maxRow: 3, minCol: 0, maxCol: 3 },
            viewport,
            options,
        );

        expect(layout.originX).toBeGreaterThanOrEqual(viewport.x);
        expect(layout.originY).toBeGreaterThanOrEqual(viewport.y);
        expect(layout.originX + layout.boardWidth).toBeLessThanOrEqual(viewport.x + viewport.width);
        expect(layout.originY + layout.boardHeight).toBeLessThanOrEqual(viewport.y + viewport.height);
    });

    it('scales down expanded board so full grid remains visible', () => {
        const layout = calculateBoardLayout(
            { minRow: -2, maxRow: 5, minCol: -2, maxCol: 5 },
            viewport,
            options,
        );

        expect(layout.scale).toBeLessThan(1);
        expect(layout.originX).toBeGreaterThanOrEqual(viewport.x);
        expect(layout.originY).toBeGreaterThanOrEqual(viewport.y);
        expect(layout.originX + layout.boardWidth).toBeLessThanOrEqual(viewport.x + viewport.width);
        expect(layout.originY + layout.boardHeight).toBeLessThanOrEqual(viewport.y + viewport.height);
    });

    it('keeps a full 8x8 capped board visible in viewport', () => {
        const layout = calculateBoardLayout(
            { minRow: -1, maxRow: 6, minCol: -1, maxCol: 6 },
            viewport,
            options,
        );

        expect(layout.cols).toBe(8);
        expect(layout.rows).toBe(8);
        expect(layout.originX).toBeGreaterThanOrEqual(viewport.x);
        expect(layout.originY).toBeGreaterThanOrEqual(viewport.y);
        expect(layout.originX + layout.boardWidth).toBeLessThanOrEqual(viewport.x + viewport.width);
        expect(layout.originY + layout.boardHeight).toBeLessThanOrEqual(viewport.y + viewport.height);
    });

    it('aligns the original 4x4 outline with the starting board footprint', () => {
        const bounds = { minRow: 0, maxRow: 3, minCol: 0, maxCol: 3 };
        const layout = calculateBoardLayout(bounds, viewport, options);
        const outline = calculateBoardOutlineRect(bounds, bounds, layout, 6);

        expect(outline.x).toBe(layout.originX - 6);
        expect(outline.y).toBe(layout.originY - 6);
        expect(outline.width).toBe(layout.boardWidth + 12);
        expect(outline.height).toBe(layout.boardHeight + 12);
    });

    it('keeps the original 4x4 outline aligned after the board expands and shifts', () => {
        const bounds = { minRow: -1, maxRow: 6, minCol: -1, maxCol: 6 };
        const layout = calculateBoardLayout(bounds, viewport, options);
        const outline = calculateBoardOutlineRect(
            bounds,
            { minRow: 0, maxRow: 3, minCol: 0, maxCol: 3 },
            layout,
            4,
        );

        const step = layout.tileSize + layout.gap;
        expect(outline.x).toBe(layout.originX + step - 4);
        expect(outline.y).toBe(layout.originY + step - 4);
        expect(outline.width).toBe(4 * layout.tileSize + 3 * layout.gap + 8);
        expect(outline.height).toBe(4 * layout.tileSize + 3 * layout.gap + 8);
        expect(outline.x + outline.width).toBeLessThanOrEqual(viewport.x + viewport.width);
        expect(outline.y + outline.height).toBeLessThanOrEqual(viewport.y + viewport.height);
    });
});
