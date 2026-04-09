import Phaser from 'phaser';
import type { TileData } from '../models/Tile';
import type { BoardState } from '../models/BoardState';
import {
    createRoundState,
    ROUND_DURATION_SECONDS,
    type RoundState,
} from '../models/RoundState';
import { generateBoard } from '../utils/boardGenerator';
import { canAppendTile } from '../utils/adjacency';
import { submitWord } from '../utils/submission';
import type { WordHistoryEntry } from '../models/WordHistoryEntry';
import { createHighScoreStore, type HighScoreStore } from '../utils/highScoreStorage';

// ─── Layout constants ───────────────────────────────────────────────────────
const GAME_W = 480;
const GAME_H = 640;

const BOARD_COLS = 4;
const TILE_SIZE = 88;
const TILE_GAP = 8;
const BOARD_SIZE = BOARD_COLS * TILE_SIZE + (BOARD_COLS - 1) * TILE_GAP; // 380
const BOARD_ORIGIN_X = (GAME_W - BOARD_SIZE) / 2; // 50
const BOARD_ORIGIN_Y = 120;

const COLOR_BG = 0x1a1a2e;
const COLOR_TILE_IDLE = 0x16213e;
const COLOR_TILE_SELECTED = 0xe94560;
const COLOR_TILE_HOVER = 0x0f3460;
const COLOR_TEXT = 0xf5f5f5;
const COLOR_TIMER_LOW = 0xe94560;
const COLOR_ACCEPT = 0x4caf50;
const COLOR_REJECT = 0xe94560;
const WORD_HISTORY_LIMIT = 8;

// ─── GameScene ───────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
    // Board / round state
    private boardState!: BoardState;
    private roundState!: RoundState;

    // Phaser display objects
    private tileObjects: Phaser.GameObjects.Container[] = [];
    private pathGraphics!: Phaser.GameObjects.Graphics;
    private timerText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private highScoreText!: Phaser.GameObjects.Text;
    private currentWordText!: Phaser.GameObjects.Text;
    private feedbackText!: Phaser.GameObjects.Text;
    private wordListText!: Phaser.GameObjects.Text;
    private submitButton!: Phaser.GameObjects.Container;
    private restartButton!: Phaser.GameObjects.Container;

    // Timer tracking
    private timerEvent!: Phaser.Time.TimerEvent;

    private highScoreStore: HighScoreStore = createHighScoreStore();
    private highScore = 0;

    constructor() {
        super({ key: 'GameScene' });
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    create(): void {
        this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, COLOR_BG);

        this.pathGraphics = this.add.graphics();

        this.highScore = this.highScoreStore.get();

        this.buildHUD();
        this.startRound();
    }

    // ─── Round management ──────────────────────────────────────────────────────

    private startRound(): void {
        // Tear down any previous round
        this.timerEvent?.remove(false);
        this.tileObjects.forEach((c) => c.destroy());
        this.tileObjects = [];

        // Fresh state
        const tiles = generateBoard();
        this.boardState = { tiles, selectedPath: [] };
        this.roundState = createRoundState();
        this.roundState.status = 'running';

        this.buildBoard();
        this.updateHUD();
        this.submitButton.setVisible(true);

        // 60-second countdown
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            repeat: ROUND_DURATION_SECONDS - 1,
            callback: this.onTimerTick,
            callbackScope: this,
        });
    }

    private onTimerTick(): void {
        this.roundState.timeRemaining = Math.max(
            0,
            this.roundState.timeRemaining - 1,
        );

        if (this.roundState.timeRemaining === 0) {
            this.endRound();
        } else {
            this.updateHUD();
        }
    }

    private endRound(): void {
        this.roundState.status = 'ended';
        this.timerEvent.remove(false);
        this.boardState.selectedPath = [];

        if (this.roundState.score > this.highScore) {
            this.highScore = this.roundState.score;
            this.highScoreStore.set(this.highScore);
            this.showFeedback(`New High Score: ${this.highScore}!`, COLOR_ACCEPT, 0);
        } else {
            this.showFeedback("Time's up!", COLOR_REJECT, 0);
        }

        this.updateHUD();
        this.redrawPath();
        this.refreshTileHighlights();
    }

    // ─── Board rendering ───────────────────────────────────────────────────────

    private buildBoard(): void {
        this.boardState.tiles.forEach((tile) => {
            const container = this.makeTileObject(tile);
            this.tileObjects.push(container);
        });
    }

    private makeTileObject(tile: TileData): Phaser.GameObjects.Container {
        const x = BOARD_ORIGIN_X + tile.col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
        const y = BOARD_ORIGIN_Y + tile.row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;

        const bg = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, COLOR_TILE_IDLE, 1)
            .setStrokeStyle(2, 0x2a2a4e);

        const label = this.add.text(0, 0, tile.letter, {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#f5f5f5',
        }).setOrigin(0.5);

        const container = this.add.container(x, y, [bg, label]);
        container.setSize(TILE_SIZE, TILE_SIZE);
        container.setInteractive();

        container.on('pointerover', () => this.onTileHover(tile, bg));
        container.on('pointerout', () => this.refreshTileBg(tile, bg));
        container.on('pointerdown', () => this.onTilePointerDown(tile, bg));

        // Store references for later highlight updates
        (container as unknown as { tileData: TileData; bg: Phaser.GameObjects.Rectangle }).tileData = tile;
        (container as unknown as { tileData: TileData; bg: Phaser.GameObjects.Rectangle }).bg = bg;

        return container;
    }

    // ─── Input handling ────────────────────────────────────────────────────────

    private onTileHover(
        tile: TileData,
        bg: Phaser.GameObjects.Rectangle,
    ): void {
        if (this.roundState.status !== 'running') return;
        const path = this.boardState.selectedPath;
        const alreadySelected = path.some((t) => t.index === tile.index);
        if (!alreadySelected && canAppendTile(path, tile)) {
            bg.setFillStyle(COLOR_TILE_HOVER);
        }
    }

    private onTilePointerDown(
        tile: TileData,
        _bg: Phaser.GameObjects.Rectangle,
    ): void {
        if (this.roundState.status !== 'running') return;

        const path = this.boardState.selectedPath;
        const alreadyInPath = path.some((t) => t.index === tile.index);

        if (alreadyInPath) {
            // Tapping an already-selected tile resets the selection
            this.boardState.selectedPath = [];
        } else if (canAppendTile(path, tile)) {
            this.boardState.selectedPath = [...path, tile];
        } else {
            // Non-adjacent and not in path → start fresh selection from this tile
            this.boardState.selectedPath = [tile];
        }

        this.updateHUD();
        this.refreshTileHighlights();
        this.redrawPath();
    }

    // ─── Highlights & path drawing ─────────────────────────────────────────────

    private refreshTileHighlights(): void {
        this.tileObjects.forEach((container) => {
            const c = container as unknown as { tileData: TileData; bg: Phaser.GameObjects.Rectangle };
            this.refreshTileBg(c.tileData, c.bg);
        });
    }

    private refreshTileBg(
        tile: TileData,
        bg: Phaser.GameObjects.Rectangle,
    ): void {
        const selected = this.boardState.selectedPath.some(
            (t) => t.index === tile.index,
        );
        bg.setFillStyle(selected ? COLOR_TILE_SELECTED : COLOR_TILE_IDLE);
    }

    private tileCenter(tile: TileData): { x: number; y: number } {
        return {
            x: BOARD_ORIGIN_X + tile.col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
            y: BOARD_ORIGIN_Y + tile.row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
        };
    }

    private redrawPath(): void {
        this.pathGraphics.clear();
        const path = this.boardState.selectedPath;
        if (path.length < 2) return;

        this.pathGraphics.lineStyle(4, COLOR_TILE_SELECTED, 0.6);
        this.pathGraphics.beginPath();
        const firstTile = path[0];
        if (!firstTile) return;
        const first = this.tileCenter(firstTile);
        this.pathGraphics.moveTo(first.x, first.y);
        for (let i = 1; i < path.length; i++) {
            const t = path[i];
            if (!t) continue;
            const pt = this.tileCenter(t);
            this.pathGraphics.lineTo(pt.x, pt.y);
        }
        this.pathGraphics.strokePath();
    }

    // ─── Submission ────────────────────────────────────────────────────────────

    private onSubmit(): void {
        const result = submitWord(this.roundState, this.boardState.selectedPath);

        if (result.accepted) {
            this.showFeedback(`✓ ${result.word} (+${result.score})`, COLOR_ACCEPT);
        } else {
            const messages: Record<string, string> = {
                round_not_running: 'Round has ended',
                too_short: 'Word too short (min 3)',
                duplicate: `"${result.word}" already submitted`,
                invalid_path: 'Invalid path',
                not_in_dictionary: `"${result.word}" is not in dictionary`,
            };
            this.showFeedback(messages[result.reason] ?? 'Rejected', COLOR_REJECT);
        }

        // Clear selection regardless of outcome
        this.boardState.selectedPath = [];
        this.updateHUD();
        this.refreshTileHighlights();
        this.redrawPath();
    }

    // ─── HUD ───────────────────────────────────────────────────────────────────

    private buildHUD(): void {
        // Title
        this.add.text(GAME_W / 2, 30, 'TANGELO', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#e94560',
        }).setOrigin(0.5);

        // Timer
        this.timerText = this.add.text(GAME_W / 2, 70, '60', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#f5f5f5',
        }).setOrigin(0.5);

        this.scoreText = this.add.text(28, 70, 'Score: 0', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#f5f5f5',
        }).setOrigin(0, 0.5);

        this.highScoreText = this.add.text(GAME_W - 28, 70, `High: ${this.highScore}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#f5f5f5',
        }).setOrigin(1, 0.5);

        // Current word display
        this.currentWordText = this.add.text(GAME_W / 2, BOARD_ORIGIN_Y + BOARD_SIZE + 24, '', {
            fontSize: '26px',
            fontFamily: 'Georgia, serif',
            color: '#f5f5f5',
            letterSpacing: 6,
        }).setOrigin(0.5);

        // Feedback message
        this.feedbackText = this.add.text(GAME_W / 2, BOARD_ORIGIN_Y + BOARD_SIZE + 58, '', {
            fontSize: '16px',
            fontFamily: 'sans-serif',
            color: '#4caf50',
        }).setOrigin(0.5);

        // Submit button
        this.submitButton = this.makeButton(
            GAME_W / 2,
            BOARD_ORIGIN_Y + BOARD_SIZE + 96,
            'SUBMIT',
            () => this.onSubmit(),
        );

        this.restartButton = this.makeButton(
            GAME_W - 90,
            30,
            'RESTART',
            () => {
                this.startRound();
                this.showFeedback('Round restarted', COLOR_ACCEPT);
            },
            0x0f3460,
        );

        // Word list label
        this.add.text(28, BOARD_ORIGIN_Y + BOARD_SIZE + 148, 'Words:', {
            fontSize: '14px',
            fontFamily: 'sans-serif',
            color: '#888',
        });

        // Word list scrollable area
        this.wordListText = this.add.text(28, BOARD_ORIGIN_Y + BOARD_SIZE + 168, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ccc',
            wordWrap: { width: GAME_W - 56 },
        });
    }

    private makeButton(
        x: number,
        y: number,
        label: string,
        onClick: () => void,
        bgColor = 0xe94560,
    ): Phaser.GameObjects.Container {
        const bg = this.add.rectangle(0, 0, 160, 44, bgColor, 1).setStrokeStyle(2, 0xffffff);
        const text = this.add.text(0, 0, label, {
            fontSize: '16px',
            fontFamily: 'sans-serif',
            color: '#ffffff',
        }).setOrigin(0.5);

        const btn = this.add.container(x, y, [bg, text]);
        btn.setSize(160, 44);
        btn.setInteractive();
        btn.on('pointerdown', onClick);
        btn.on('pointerover', () => bg.setFillStyle(Phaser.Display.Color.ValueToColor(bgColor).lighten(20).color));
        btn.on('pointerout', () => bg.setFillStyle(bgColor));
        return btn;
    }

    private updateHUD(): void {
        // Timer colour
        const t = this.roundState.timeRemaining;
        const timerColor = t <= 10 ? `#e94560` : `#f5f5f5`;
        this.timerText.setText(String(t).padStart(2, '0'));
        this.timerText.setColor(timerColor);

        // Current word
        const word = this.boardState.selectedPath.map((t) => t.letter).join('');
        this.currentWordText.setText(word);

        this.scoreText.setText(`Score: ${this.roundState.score}`);
        this.highScoreText.setText(`High: ${this.highScore}`);

        // Word list
        this.wordListText.setText(this.formatWordHistory(this.roundState.wordHistory));
    }

    private formatWordHistory(entries: WordHistoryEntry[]): string {
        if (entries.length === 0) {
            return '—';
        }

        return entries
            .slice(0, WORD_HISTORY_LIMIT)
            .map((entry) => {
                if (entry.status === 'accepted') {
                    return `+${entry.score} ${entry.word}`;
                }

                return `x ${entry.word} (${entry.reason.replace(/_/g, ' ')})`;
            })
            .join('\n');
    }

    private showFeedback(msg: string, color: number, duration = 1600): void {
        this.feedbackText.setText(msg);
        this.feedbackText.setColor(
            `#${color.toString(16).padStart(6, '0')}`,
        );

        if (duration > 0) {
            this.time.delayedCall(duration, () => {
                if (this.feedbackText.text === msg) this.feedbackText.setText('');
            });
        }
    }
}
