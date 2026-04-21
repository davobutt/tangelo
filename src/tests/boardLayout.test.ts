import { describe, expect, it } from 'vitest';
import { calculateBoardLayout } from '../utils/boardLayout';

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
});
