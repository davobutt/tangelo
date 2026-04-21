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
import type { AcceptedSubmissionResult } from '../models/SubmissionResult';
import type { WordHistoryEntry } from '../models/WordHistoryEntry';
import { createHighScoreStore, type HighScoreStore } from '../utils/highScoreStorage';
import { applyEdgeExpansions } from '../utils/endlessExpansion';
import { applyExpansionTimeBonus } from '../utils/endlessTimer';
import { tickRoundTimer } from '../utils/endlessRunLifecycle';
import { getBoardBounds } from '../utils/boardGeometry';
import { calculateBoardLayout, type BoardLayout } from '../utils/boardLayout';
import { scoreSubmission } from '../utils/scoring';
import { UI_THEME, themeColorHex, uiTextStyles } from '../theme/uiTheme';
import {
    fetchLeaderboard,
    fetchActiveChallenge,
    submitLeaderboardScore,
    type ActiveChallenge,
    type LeaderboardEntry,
} from '../utils/leaderboardClient';
import { resolveRunContext, type LaunchMode, type RunContext } from '../utils/runContext';
import { sanitizeSeedCodeInput, normalizeSeedCode, SEED_CODE_LENGTH } from '../utils/seedCode';
import {
    loadPlayerProfile,
    savePlayerProfile,
    createPlayerProfile,
    clearPlayerProfile,
    updatePlayerDisplayName,
    validateDisplayName,
    type PlayerProfile,
} from '../utils/playerProfile';

// ─── Layout constants ───────────────────────────────────────────────────────
const GAME_W = 480;
const GAME_H = 640;

const BASE_TILE_SIZE = 72;
const BASE_TILE_GAP = 8;
const BOARD_VIEWPORT = {
    x: 24,
    y: 110,
    width: GAME_W - 48,
    height: 320,
};

const INITIAL_BOARD_SIZE = 4 * BASE_TILE_SIZE + 3 * BASE_TILE_GAP;
const HUD_BOTTOM_ANCHOR_Y = BOARD_VIEWPORT.y + INITIAL_BOARD_SIZE;

const WORD_HISTORY_LIMIT = UI_THEME.tuning.wordHistoryLimit;
const GROWTH_FADE_IN_MS = UI_THEME.tuning.growthFadeInMs;
const TILE_LETTER_COLORS = [
    0xff6b6b,
    0xf97316,
    0xfacc15,
    0x4ade80,
    0x2dd4bf,
    0x38bdf8,
    0x818cf8,
    0xe879f9,
] as const;

const HUD_LAYOUT = {
    statusPanelY: 70,
    statusPanelHeight: 86,
    controlsPanelY: HUD_BOTTOM_ANCHOR_Y + 92,
    controlsPanelHeight: 120,
    wordsPanelHeight: 92,
    panelInsetX: UI_THEME.spacing.lg,
    restartButton: {
        x: GAME_W - 54,
        y: 30,
        width: 84,
        height: 28,
        fontSize: 12,
    },
    leaderboardButton: {
        x: 64,
        y: 30,
        width: 112,
        height: 28,
        fontSize: 12,
    },
    submitButton: {
        width: 164,
        height: 46,
    },
};

const RUN_SEED_REGISTRY_KEY = 'runSeed';
const RUN_LAUNCH_MODE_REGISTRY_KEY = 'launchMode';

type UIButton = {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    baseColor: number;
    onClick: () => void;
    enabled: boolean;
};

type OverlayTextInput = {
    inputField: HTMLInputElement;
    focus: () => void;
    cleanup: () => void;
};

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
    private modeText!: Phaser.GameObjects.Text;
    private currentWordText!: Phaser.GameObjects.Text;
    private feedbackText!: Phaser.GameObjects.Text;
    private wordListText!: Phaser.GameObjects.Text;
    private submitButton!: UIButton;
    private restartButton!: UIButton;
    private leaderboardButton!: UIButton;
    private startOverlay: Phaser.GameObjects.Container | null = null;
    private startGateStatusText: Phaser.GameObjects.Text | null = null;
    private startGateChallengeButton: UIButton | null = null;
    private profileOverlay: Phaser.GameObjects.Container | null = null;
    private codeEntryOverlay: Phaser.GameObjects.Container | null = null;
    private leaderboardOverlay: Phaser.GameObjects.Container | null = null;
    private settingsOverlay: Phaser.GameObjects.Container | null = null;
    private leaderboardStatusText: Phaser.GameObjects.Text | null = null;
    private leaderboardEntriesText: Phaser.GameObjects.Text | null = null;
    private leaderboardProfileText: Phaser.GameObjects.Text | null = null;
    private playerProfile!: PlayerProfile;

    // Timer tracking
    private timerEvent!: Phaser.Time.TimerEvent;
    private roundHasStarted = false;
    private expansionInputLockedUntil = 0;

    private highScoreStore: HighScoreStore = createHighScoreStore();
    private highScore = 0;
    private activeChallenge: ActiveChallenge | null = null;
    private activeRunSeed: string | null = null;
    private activeRunContext: RunContext = resolveRunContext();
    private challengeLaunchInFlight = false;
    private tileLetterColors = new Map<number, number>();
    private boardMinRow = 0;
    private boardMinCol = 0;
    private boardLayout: BoardLayout = {
        scale: 1,
        tileSize: BASE_TILE_SIZE,
        gap: BASE_TILE_GAP,
        boardWidth: INITIAL_BOARD_SIZE,
        boardHeight: INITIAL_BOARD_SIZE,
        originX: BOARD_VIEWPORT.x + (BOARD_VIEWPORT.width - INITIAL_BOARD_SIZE) / 2,
        originY: BOARD_VIEWPORT.y,
        cols: 4,
        rows: 4,
    };

    constructor() {
        super({ key: 'GameScene' });
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    create(): void {
        this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, UI_THEME.palette.backdropDeep);
        this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W - 24, GAME_H - 24, UI_THEME.palette.backdropMid, 0.45);

        this.pathGraphics = this.add.graphics();

        this.ensureLaunchSelection();
        this.syncRunContext();

        this.buildHUD();

        // Check if player profile exists; if not, show profile gate first
        const existingProfile = loadPlayerProfile();
        if (existingProfile) {
            this.playerProfile = existingProfile;
            this.showStartGate();
        } else {
            this.showProfileGate();
        }
    }

    // ─── Round management ──────────────────────────────────────────────────────

    private startRound(): void {
        // Tear down any previous round
        this.timerEvent?.remove(false);
        this.clearBoardObjects();

        // Fresh state
        this.syncRunContext();
        const tiles = this.activeRunSeed
            ? generateBoard({ seed: this.activeRunSeed })
            : generateBoard();
        this.tileLetterColors.clear();
        this.boardState = { tiles, selectedPath: [] };
        this.roundState = createRoundState();
        this.roundHasStarted = true;
        this.expansionInputLockedUntil = 0;

        this.rebuildBoard();
        this.updateHUD();
        this.feedbackText.setVisible(true);
        this.feedbackText.setText('');
        this.submitButton.container.setVisible(true);
        this.setButtonEnabled(this.restartButton, true);
        this.setButtonEnabled(this.leaderboardButton, true);

        // 60-second countdown
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: this.onTimerTick,
            callbackScope: this,
        });
    }

    private showStartGate(): void {
        this.timerEvent?.remove(false);
        this.pathGraphics.clear();
        this.clearBoardObjects();
        this.codeEntryOverlay?.destroy(true);
        this.codeEntryOverlay = null;
        this.roundHasStarted = false;
        this.syncRunContext();

        if (this.roundState) {
            this.roundState.status = 'ended';
            this.boardState.selectedPath = [];
        }

        this.timerText.setText(String(ROUND_DURATION_SECONDS));
        this.timerText.setColor(themeColorHex(UI_THEME.palette.textStrong));
        this.scoreText.setText('Score: 0');
        this.currentWordText.setText('');
        this.feedbackText.setText('');
        this.feedbackText.setVisible(false);
        this.wordListText.setText('—');
        this.submitButton.container.setVisible(false);
        this.setButtonEnabled(this.submitButton, false);
        this.setButtonEnabled(this.restartButton, false);
        this.setButtonEnabled(this.leaderboardButton, true);

        this.startOverlay?.destroy(true);

        const blocker = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W,
            GAME_H,
            UI_THEME.palette.backdropDeep,
            0.72,
        );

        const panel = this.add.rectangle(GAME_W / 2, GAME_H / 2 + 8, GAME_W - 72, 336, UI_THEME.palette.surfaceBase, 0.95);

        const heading = this.add
            .text(GAME_W / 2, GAME_H / 2 - 126, 'CHOOSE MODE', uiTextStyles.title())
            .setOrigin(0.5)
            .setScale(0.8);

        const body = this.add
            .text(
                GAME_W / 2,
                GAME_H / 2 - 74,
                'Find words. Grow the board.\nPick Free Play, Challenge, or Enter Code.',
                {
                    ...uiTextStyles.body(),
                    align: 'center',
                    lineSpacing: 4,
                    fontSize: '13px',
                },
            )
            .setOrigin(0.5);

        const freePlayButton = this.makeButton(
            GAME_W / 2,
            GAME_H / 2 + 6,
            'FREE PLAY',
            () => {
                this.selectLaunchMode('free-play');
                this.enterRoundFromGate();
            },
            UI_THEME.palette.accent,
            {
                width: 220,
            },
        );

        const challengeButton = this.makeButton(
            GAME_W / 2,
            GAME_H / 2 + 58,
            'CHALLENGE',
            () => void this.launchActiveChallenge(),
            UI_THEME.palette.accentAlt,
            {
                width: 220,
            },
        );

        const statusText = this.add
            .text(GAME_W / 2, GAME_H / 2 + 156, '', {
                ...uiTextStyles.body(),
                align: 'center',
                fontSize: '12px',
                wordWrap: { width: 260 },
            })
            .setOrigin(0.5);
        statusText.setColor(themeColorHex(UI_THEME.palette.textMuted));

        const enterCodeButton = this.makeButton(
            GAME_W / 2,
            GAME_H / 2 + 110,
            'ENTER CODE',
            () => this.showCodeEntryOverlay(),
            UI_THEME.palette.surfaceRaised,
            {
                width: 220,
            },
        );

        this.startOverlay = this.add.container(0, 0, [
            blocker,
            panel,
            heading,
            body,
            freePlayButton.container,
            challengeButton.container,
            enterCodeButton.container,
            statusText,
        ]);
        this.startOverlay.setDepth(200);
        this.startOverlay.setAlpha(0);
        this.startGateStatusText = statusText;
        this.startGateChallengeButton = challengeButton;

        this.tweens.add({
            targets: this.startOverlay,
            alpha: 1,
            duration: 220,
            ease: 'Sine.easeOut',
        });
    }

    private enterRoundFromGate(): void {
        if (!this.startOverlay) {
            this.startRound();
            return;
        }

        const overlay = this.startOverlay;
        this.startOverlay = null;
        this.startGateStatusText = null;
        this.startGateChallengeButton = null;

        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 200,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                overlay.destroy(true);
                this.startRound();
            },
        });
    }

    private showCodeEntryOverlay(): void {
        this.codeEntryOverlay?.destroy(true);

        const blocker = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W,
            GAME_H,
            UI_THEME.palette.backdropDeep,
            0.82,
        );

        const panel = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W - 88,
            220,
            UI_THEME.palette.surfaceBase,
            0.97,
        );

        const title = this.add
            .text(GAME_W / 2, GAME_H / 2 - 86, 'ENTER CODE', {
                ...uiTextStyles.title(),
                fontSize: '24px',
            })
            .setOrigin(0.5)
            .setScale(0.8);

        const codeBoxY = GAME_H / 2 - 12;
        const codeBoxSize = 40;
        const codeBoxGap = 12;
        const totalCodeWidth = codeBoxSize * 5 + codeBoxGap * 4;
        const firstCodeX = GAME_W / 2 - totalCodeWidth / 2 + codeBoxSize / 2;
        const codeBoxes: Array<{ box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = [];

        for (let index = 0; index < 5; index++) {
            const x = firstCodeX + index * (codeBoxSize + codeBoxGap);
            const box = this.add.rectangle(
                x,
                codeBoxY,
                codeBoxSize,
                codeBoxSize,
                UI_THEME.palette.surfaceMuted,
                0.72,
            );
            box.setStrokeStyle(1, UI_THEME.palette.borderSoft, 0.5);

            const text = this.add
                .text(x, codeBoxY, '', {
                    ...uiTextStyles.body(),
                    fontSize: '20px',
                })
                .setOrigin(0.5)
                .setColor(themeColorHex(UI_THEME.palette.textStrong));

            codeBoxes.push({ box, text });
        }

        const updateCodeBoxes = (value: string): void => {
            const activeIndex = Math.min(value.length, SEED_CODE_LENGTH - 1);
            codeBoxes.forEach(({ box, text }, index) => {
                const char = value[index] ?? '';
                text.setText(char);
                box.setStrokeStyle(
                    1,
                    index === activeIndex && value.length < SEED_CODE_LENGTH ? UI_THEME.palette.accent : UI_THEME.palette.borderSoft,
                    index === activeIndex && value.length < SEED_CODE_LENGTH ? 0.95 : 0.5,
                );
                box.setFillStyle(UI_THEME.palette.surfaceMuted, char ? 0.9 : 0.72);
            });
        };

        let startButton: UIButton | null = null;
        const initialCode = '';
        const { inputField, focus, cleanup } = this.createOverlayTextInput({
            centerX: GAME_W / 2,
            centerY: codeBoxY,
            width: totalCodeWidth,
            height: codeBoxSize,
            initialValue: initialCode,
            maxLength: SEED_CODE_LENGTH,
            ariaLabel: 'Seed code',
            autocomplete: 'off',
            autocapitalize: 'characters',
            onInput: (value) => {
                const normalizedValue = sanitizeSeedCodeInput(value);
                if (inputField.value !== normalizedValue) {
                    inputField.value = normalizedValue;
                }
                updateCodeBoxes(normalizedValue);
                if (startButton) {
                    this.setButtonEnabled(startButton, normalizedValue.length === SEED_CODE_LENGTH);
                }
            },
            onEnter: () => {
                if (inputField.value.length === SEED_CODE_LENGTH) {
                    startButton?.onClick();
                }
            },
        });

        startButton = this.makeButton(
            GAME_W / 2 - 70,
            GAME_H / 2 + 62,
            'START',
            () => {
                const nextCode = normalizeSeedCode(inputField.value);
                if (!nextCode) {
                    return;
                }

                this.selectLaunchMode('enter-code', nextCode);
                this.codeEntryOverlay?.destroy(true);
                this.codeEntryOverlay = null;
                this.enterRoundFromGate();
            },
            UI_THEME.palette.accent,
            {
                width: 100,
                height: 34,
                fontSize: 12,
            },
        );
        this.setButtonEnabled(startButton, inputField.value.length === SEED_CODE_LENGTH);

        const cancelButton = this.makeButton(
            GAME_W / 2 + 70,
            GAME_H / 2 + 62,
            'CANCEL',
            () => {
                this.codeEntryOverlay?.destroy(true);
                this.codeEntryOverlay = null;
            },
            UI_THEME.palette.surfaceRaised,
            {
                width: 100,
                height: 34,
                fontSize: 12,
            },
        );

        this.codeEntryOverlay = this.add.container(0, 0, [
            blocker,
            panel,
            title,
            ...codeBoxes.flatMap(({ box, text }) => [box, text]),
            startButton.container,
            cancelButton.container,
        ]);
        this.codeEntryOverlay.setDepth(220);
        this.codeEntryOverlay.setAlpha(0);
        this.codeEntryOverlay.once('destroy', cleanup);

        updateCodeBoxes(initialCode);

        this.tweens.add({
            targets: this.codeEntryOverlay,
            alpha: 1,
            duration: 160,
            ease: 'Sine.easeOut',
        });

        window.requestAnimationFrame(focus);
    }

    private showProfileGate(): void {
        this.profileOverlay?.destroy(true);
        this.setButtonEnabled(this.leaderboardButton, false);

        const blocker = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W,
            GAME_H,
            UI_THEME.palette.backdropDeep,
            0.72,
        );

        const panel = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W - 72,
            260,
            UI_THEME.palette.surfaceBase,
            0.95,
        );

        const heading = this.add
            .text(GAME_W / 2, GAME_H / 2 - 90, 'SET YOUR NAME', uiTextStyles.title())
            .setOrigin(0.5)
            .setScale(0.85);

        const subtitle = this.add
            .text(
                GAME_W / 2,
                GAME_H / 2 - 40,
                'Enter your name to begin.\nMax 20 characters.',
                {
                    ...uiTextStyles.body(),
                    align: 'center',
                    lineSpacing: 3,
                    fontSize: '14px',
                },
            )
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textMuted));

        const errorText = this.add
            .text(GAME_W / 2, GAME_H / 2 + 12, '', {
                ...uiTextStyles.body(),
                fontSize: '12px',
                align: 'center',
            })
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.danger));

        const inputBox = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2 + 50,
            GAME_W - 120,
            44,
            UI_THEME.palette.surfaceMuted,
            0.6,
        );
        inputBox.setStrokeStyle(1, UI_THEME.palette.borderSoft, 0.5);

        const inputText = this.add
            .text(GAME_W / 2, GAME_H / 2 + 50, '', {
                ...uiTextStyles.body(),
                fontSize: '18px',
            })
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textStrong));

        const { inputField, focus, cleanup } = this.createOverlayTextInput({
            centerX: GAME_W / 2,
            centerY: GAME_H / 2 + 50,
            width: GAME_W - 120,
            height: 44,
            placeholder: 'Your name...',
            onInput: (value) => {
                inputText.setText(value);
                errorText.setText('');
            },
            onEnter: () => this.handleProfileSubmit(inputField.value.trim(), errorText, inputText),
        });

        const submitButton = this.makeButton(
            GAME_W / 2,
            GAME_H / 2 + 130,
            'CONTINUE',
            () => this.handleProfileSubmit(inputField.value.trim(), errorText, inputText),
            UI_THEME.palette.accent,
        );

        this.profileOverlay = this.add.container(0, 0, [
            blocker,
            panel,
            heading,
            subtitle,
            errorText,
            inputBox,
            inputText,
            submitButton.container,
        ]);
        this.profileOverlay.setDepth(200);
        this.profileOverlay.setAlpha(0);
        this.profileOverlay.once('destroy', cleanup);

        this.tweens.add({
            targets: this.profileOverlay,
            alpha: 1,
            duration: 220,
            ease: 'Sine.easeOut',
        });

        window.requestAnimationFrame(focus);
    }

    private handleProfileSubmit(
        name: string,
        errorText: Phaser.GameObjects.Text,
        inputText: Phaser.GameObjects.Text,
    ): void {
        const error = validateDisplayName(name);
        if (error) {
            errorText.setText(error);
            return;
        }

        // Create and save profile
        this.playerProfile = createPlayerProfile(name);
        savePlayerProfile(this.playerProfile);

        // Fade out profile overlay and show start gate
        const overlay = this.profileOverlay;
        this.profileOverlay = null;

        if (overlay) {
            this.tweens.add({
                targets: overlay,
                alpha: 0,
                duration: 200,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    overlay.destroy(true);
                    this.showStartGate();
                },
            });
        } else {
            this.showStartGate();
        }
    }

    private ensureLaunchSelection(): void {
        const existingMode = this.registry.get(RUN_LAUNCH_MODE_REGISTRY_KEY);
        if (existingMode !== 'free-play' && existingMode !== 'challenge' && existingMode !== 'enter-code') {
            this.registry.set(RUN_LAUNCH_MODE_REGISTRY_KEY, 'free-play');
        }
    }

    private setStartGateStatus(message: string, color: number = UI_THEME.palette.textMuted): void {
        if (!this.startGateStatusText) {
            return;
        }

        this.startGateStatusText.setText(message);
        this.startGateStatusText.setColor(themeColorHex(color));
    }

    private setStartGateChallengeLoading(loading: boolean): void {
        if (!this.startGateChallengeButton) {
            return;
        }

        this.startGateChallengeButton.label.setText(loading ? 'LOADING...' : 'CHALLENGE');
        this.setButtonEnabled(this.startGateChallengeButton, !loading);
    }

    private async launchActiveChallenge(): Promise<void> {
        if (this.challengeLaunchInFlight) {
            return;
        }

        this.challengeLaunchInFlight = true;
        this.setStartGateStatus('Loading the active challenge...', UI_THEME.palette.textMuted);
        this.setStartGateChallengeLoading(true);

        const result = await fetchActiveChallenge();

        this.challengeLaunchInFlight = false;
        this.setStartGateChallengeLoading(false);

        if (!result.ok || !result.activeChallenge) {
            this.setStartGateStatus(
                `Challenge unavailable. ${result.error ?? 'Check the backend connection and try again.'}`,
                UI_THEME.palette.danger,
            );
            return;
        }

        this.activeChallenge = result.activeChallenge;
        this.setStartGateStatus('', UI_THEME.palette.textMuted);
        this.selectLaunchMode('challenge');
        this.enterRoundFromGate();
    }

    private syncRunContext(): void {
        this.activeRunContext = resolveRunContext({
            launchMode: this.registry.get(RUN_LAUNCH_MODE_REGISTRY_KEY),
            manualSeed: this.registry.get(RUN_SEED_REGISTRY_KEY),
            activeChallenge: this.activeChallenge,
        });
        this.activeRunSeed = this.activeRunContext.boardSeed;
        this.highScoreStore = createHighScoreStore(undefined, this.activeRunContext.highScoreStorageKey);
        this.highScore = this.highScoreStore.get();
        this.modeText?.setText(this.activeRunContext.modeLabel);
        this.highScoreText?.setText(`High: ${this.highScore}`);
    }

    private selectLaunchMode(mode: LaunchMode, seed?: string | null): void {
        this.registry.set(RUN_LAUNCH_MODE_REGISTRY_KEY, mode);
        const normalizedSeed = mode === 'enter-code' ? normalizeSeedCode(seed) : seed?.trim() ?? null;
        if (normalizedSeed && normalizedSeed.length > 0) {
            this.registry.set(RUN_SEED_REGISTRY_KEY, normalizedSeed);
        } else {
            this.registry.remove(RUN_SEED_REGISTRY_KEY);
        }
        this.syncRunContext();
    }

    private createOverlayTextInput(options: {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
        initialValue?: string;
        placeholder?: string;
        maxLength?: number;
        ariaLabel?: string;
        autocomplete?: string;
        autocapitalize?: string;
        inputMode?: 'text' | 'search' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal';
        onInput: (value: string) => void;
        onEnter: () => void;
    }): OverlayTextInput {
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.maxLength = options.maxLength ?? 20;
        inputField.value = options.initialValue ?? '';
        inputField.placeholder = options.placeholder ?? '';
        inputField.inputMode = options.inputMode ?? 'text';
        inputField.autocapitalize = options.autocapitalize ?? 'words';
        inputField.spellcheck = false;
        inputField.setAttribute('aria-label', options.ariaLabel ?? 'Display name');
        inputField.setAttribute('autocomplete', options.autocomplete ?? 'nickname');
        inputField.style.position = 'absolute';
        inputField.style.zIndex = '1000';
        inputField.style.margin = '0';
        inputField.style.padding = '0 14px';
        inputField.style.border = '0';
        inputField.style.borderRadius = '10px';
        inputField.style.background = 'transparent';
        inputField.style.color = 'transparent';
        inputField.style.caretColor = 'transparent';
        inputField.style.outline = 'none';
        inputField.style.opacity = '0.01';
        inputField.style.fontSize = '16px';
        inputField.style.pointerEvents = 'auto';

        const updatePosition = () => {
            const canvas = this.game.canvas;
            if (!(canvas instanceof HTMLCanvasElement)) {
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const scaleX = rect.width / GAME_W;
            const scaleY = rect.height / GAME_H;
            inputField.style.left = `${window.scrollX + rect.left + (options.centerX - options.width / 2) * scaleX}px`;
            inputField.style.top = `${window.scrollY + rect.top + (options.centerY - options.height / 2) * scaleY}px`;
            inputField.style.width = `${options.width * scaleX}px`;
            inputField.style.height = `${options.height * scaleY}px`;
        };

        const handleInput = () => {
            options.onInput(inputField.value);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                options.onEnter();
            }
        };

        const focus = () => {
            updatePosition();
            inputField.focus();
        };

        const cleanup = () => {
            inputField.removeEventListener('input', handleInput);
            inputField.removeEventListener('keydown', handleKeyDown);
            this.scale.off('resize', updatePosition);
            window.removeEventListener('resize', updatePosition);
            if (inputField.parentNode) {
                inputField.parentNode.removeChild(inputField);
            }
        };

        inputField.addEventListener('input', handleInput);
        inputField.addEventListener('keydown', handleKeyDown);
        document.body.appendChild(inputField);
        updatePosition();
        this.scale.on('resize', updatePosition);
        window.addEventListener('resize', updatePosition);
        window.requestAnimationFrame(updatePosition);

        return { inputField, focus, cleanup };
    }

    private onTimerTick(): void {
        if (tickRoundTimer(this.roundState)) {
            this.endRound();
        } else {
            this.updateHUD();
        }
    }

    private reduceTimerForDebug(seconds: number): void {
        if (!this.roundHasStarted || this.roundState.status !== 'running') {
            return;
        }

        this.roundState.timeRemaining = Math.max(0, this.roundState.timeRemaining - seconds);

        if (this.roundState.timeRemaining <= 0) {
            this.endRound();
            return;
        }

        this.updateHUD();
        this.showFeedback(`-${seconds}s`, UI_THEME.palette.accentAlt, 700);
    }

    private endRound(): void {
        this.roundState.status = 'ended';
        this.timerEvent.remove(false);
        this.boardState.selectedPath = [];

        const finalScore = this.roundState.score;
        this.submitRoundScore(finalScore);

        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            this.highScoreStore.set(this.highScore);
            this.showFeedback(`New High Score: ${this.highScore}!`, UI_THEME.palette.success, 0);
        } else {
            this.showFeedback("Time's up!", UI_THEME.palette.danger, 0);
        }

        this.updateHUD();
        this.redrawPath();
        this.refreshTileHighlights();
        this.setButtonEnabled(this.leaderboardButton, true);
    }

    private submitRoundScore(score: number): void {
        if (!this.playerProfile || score < 0) {
            return;
        }

        const payload = {
            playerGUID: this.playerProfile.guid,
            displayName: this.playerProfile.displayName,
            score,
            runMode: this.activeRunContext.mode,
            ...(this.activeRunContext.leaderboardSeedKey
                ? { seedKey: this.activeRunContext.leaderboardSeedKey }
                : {}),
        } as const;

        void submitLeaderboardScore(payload).then((result) => {
            if (result.ok) {
                return;
            }

            // Surface the failure without interrupting gameplay flow.
            this.time.delayedCall(850, () => {
                this.showFeedback('Online sync failed. You can keep playing.', UI_THEME.palette.danger, 1800);
            });
        });
    }

    private showLeaderboardOverlay(): void {
        this.leaderboardOverlay?.destroy(true);
        this.settingsOverlay?.destroy(true);

        const blocker = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W,
            GAME_H,
            UI_THEME.palette.backdropDeep,
            0.78,
        );

        const panel = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W - 52,
            GAME_H - 150,
            UI_THEME.palette.surfaceBase,
            0.96,
        );

        const heading = this.add
            .text(GAME_W / 2, GAME_H / 2 - 235, 'LEADERBOARD', {
                ...uiTextStyles.title(),
                fontSize: '28px',
            })
            .setOrigin(0.5)
            .setScale(0.82);

        const profileText = this.add
            .text(
                GAME_W / 2,
                GAME_H / 2 - 206,
                `Profile: ${this.playerProfile.displayName} • ${this.activeRunContext.modeLabel}`,
                {
                    ...uiTextStyles.body(),
                    fontSize: '12px',
                    align: 'center',
                },
            )
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textMuted));

        const status = this.add
            .text(GAME_W / 2, GAME_H / 2 - 180, 'Loading...', {
                ...uiTextStyles.body(),
                fontSize: '13px',
                align: 'center',
            })
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textMuted));

        const entries = this.add.text(GAME_W / 2, GAME_H / 2 - 140, '', {
            ...uiTextStyles.body(),
            align: 'left',
            lineSpacing: 4,
            wordWrap: { width: GAME_W - 140 },
        }).setOrigin(0.5, 0);

        const editNameButton = this.makeButton(
            GAME_W / 2 - 112,
            GAME_H / 2 + 181,
            'EDIT NAME',
            () => this.showEditNameOverlay(),
            UI_THEME.palette.accentAlt,
            {
                width: 106,
                height: 32,
                fontSize: 12,
            },
        );

        const resetLocalButton = this.makeButton(
            GAME_W / 2,
            GAME_H / 2 + 181,
            'RESET LOCAL',
            () => this.showResetConfirmOverlay(),
            UI_THEME.palette.danger,
            {
                width: 114,
                height: 32,
                fontSize: 12,
            },
        );

        const refreshButton = this.makeButton(
            GAME_W / 2 + 112,
            GAME_H / 2 + 224,
            'REFRESH',
            () => this.refreshLeaderboard(),
            UI_THEME.palette.accent,
            {
                width: 106,
                height: 32,
                fontSize: 13,
            },
        );

        const closeButton = this.makeButton(
            GAME_W / 2,
            GAME_H / 2 + 224,
            'CLOSE',
            () => this.closeLeaderboardOverlay(),
            UI_THEME.palette.surfaceRaised,
            {
                width: 114,
                height: 32,
                fontSize: 13,
            },
        );

        const resetHelp = this.add
            .text(
                GAME_W / 2,
                GAME_H / 2 + 205,
                'Reset clears only this device profile and local high score.',
                {
                    ...uiTextStyles.body(),
                    fontSize: '11px',
                    align: 'center',
                },
            )
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textMuted));

        this.leaderboardStatusText = status;
        this.leaderboardEntriesText = entries;
        this.leaderboardProfileText = profileText;

        this.leaderboardOverlay = this.add.container(0, 0, [
            blocker,
            panel,
            heading,
            profileText,
            status,
            entries,
            editNameButton.container,
            resetLocalButton.container,
            resetHelp,
            refreshButton.container,
            closeButton.container,
        ]);
        this.leaderboardOverlay.setDepth(240);
        this.leaderboardOverlay.setAlpha(0);

        this.tweens.add({
            targets: this.leaderboardOverlay,
            alpha: 1,
            duration: 180,
            ease: 'Sine.easeOut',
        });

        this.refreshLeaderboard();
    }

    private closeLeaderboardOverlay(): void {
        if (!this.leaderboardOverlay) {
            return;
        }

        this.settingsOverlay?.destroy(true);
        this.settingsOverlay = null;

        const overlay = this.leaderboardOverlay;
        this.leaderboardOverlay = null;
        this.leaderboardStatusText = null;
        this.leaderboardEntriesText = null;
        this.leaderboardProfileText = null;

        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 160,
            ease: 'Sine.easeInOut',
            onComplete: () => overlay.destroy(true),
        });
    }

    private async refreshLeaderboard(): Promise<void> {
        if (!this.leaderboardStatusText || !this.leaderboardEntriesText) {
            return;
        }

        this.leaderboardStatusText.setText('Loading leaderboard...');
        this.leaderboardStatusText.setColor(themeColorHex(UI_THEME.palette.textMuted));
        this.leaderboardEntriesText.setText('');

        const response = await fetchLeaderboard(20, this.activeRunContext.leaderboardSeedKey
            ? { runMode: this.activeRunContext.mode, seedKey: this.activeRunContext.leaderboardSeedKey }
            : { runMode: this.activeRunContext.mode });
        if (!this.leaderboardStatusText || !this.leaderboardEntriesText) {
            return;
        }

        if (!response.ok) {
            this.leaderboardStatusText.setText('Could not load leaderboard. Tap REFRESH to retry.');
            this.leaderboardStatusText.setColor(themeColorHex(UI_THEME.palette.danger));
            this.leaderboardEntriesText.setText('');
            return;
        }

        if (response.entries.length === 0) {
            this.leaderboardStatusText.setText('No scores yet. Be the first to post one.');
            this.leaderboardStatusText.setColor(themeColorHex(UI_THEME.palette.textMuted));
            this.leaderboardEntriesText.setText('');
            return;
        }

        this.leaderboardStatusText.setText(this.activeRunContext.leaderboardLabel);
        this.leaderboardStatusText.setColor(themeColorHex(UI_THEME.palette.success));
        this.leaderboardEntriesText.setText(this.formatLeaderboardEntries(response.entries));
    }

    private formatLeaderboardEntries(entries: LeaderboardEntry[]): string {
        const localGuid = this.playerProfile?.guid;
        return entries
            .map((entry, index) => {
                const rank = String(index + 1).padStart(2, '0');
                const score = String(entry.score).padStart(5, ' ');
                const marker = entry.playerGUID === localGuid ? '  < YOU' : '';
                return `#${rank}  ${score}  ${entry.displayName}${marker}`;
            })
            .join('\n');
    }

    private showEditNameOverlay(): void {
        this.settingsOverlay?.destroy(true);

        const blocker = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W,
            GAME_H,
            UI_THEME.palette.backdropDeep,
            0.84,
        );

        const panel = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W - 88,
            256,
            UI_THEME.palette.surfaceBase,
            0.96,
        );

        const title = this.add
            .text(GAME_W / 2, GAME_H / 2 - 90, 'EDIT NAME', {
                ...uiTextStyles.title(),
                fontSize: '25px',
            })
            .setOrigin(0.5)
            .setScale(0.8);

        const hint = this.add
            .text(GAME_W / 2, GAME_H / 2 - 52, 'Required, max 20 characters', {
                ...uiTextStyles.body(),
                fontSize: '12px',
                align: 'center',
            })
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textMuted));

        const errorText = this.add
            .text(GAME_W / 2, GAME_H / 2 + 6, '', {
                ...uiTextStyles.body(),
                fontSize: '12px',
                align: 'center',
            })
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.danger));

        const inputBox = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2 - 20,
            GAME_W - 148,
            42,
            UI_THEME.palette.surfaceMuted,
            0.65,
        );
        inputBox.setStrokeStyle(1, UI_THEME.palette.borderSoft, 0.5);

        const inputText = this.add
            .text(GAME_W / 2, GAME_H / 2 - 20, this.playerProfile.displayName, {
                ...uiTextStyles.body(),
                fontSize: '18px',
            })
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textStrong));

        const { inputField, focus, cleanup } = this.createOverlayTextInput({
            centerX: GAME_W / 2,
            centerY: GAME_H / 2 - 20,
            width: GAME_W - 148,
            height: 42,
            initialValue: this.playerProfile.displayName,
            onInput: (value) => {
                inputText.setText(value);
                errorText.setText('');
            },
            onEnter: () => saveButton.onClick(),
        });

        const saveButton = this.makeButton(
            GAME_W / 2 - 70,
            GAME_H / 2 + 70,
            'SAVE',
            () => {
                const nextName = inputField.value.trim();
                const error = validateDisplayName(nextName);
                if (error) {
                    errorText.setText(error);
                    return;
                }

                this.playerProfile = updatePlayerDisplayName(this.playerProfile, nextName);
                this.leaderboardProfileText?.setText(`Profile: ${this.playerProfile.displayName} • ${this.activeRunContext.modeLabel}`);
                this.showFeedback('Name updated', UI_THEME.palette.success, 1200);
                this.destroySettingsOverlay();
            },
            UI_THEME.palette.accent,
            {
                width: 100,
                height: 34,
                fontSize: 12,
            },
        );

        const cancelButton = this.makeButton(
            GAME_W / 2 + 70,
            GAME_H / 2 + 70,
            'CANCEL',
            () => this.destroySettingsOverlay(),
            UI_THEME.palette.surfaceRaised,
            {
                width: 100,
                height: 34,
                fontSize: 12,
            },
        );

        this.settingsOverlay = this.add.container(0, 0, [
            blocker,
            panel,
            title,
            hint,
            inputBox,
            inputText,
            errorText,
            saveButton.container,
            cancelButton.container,
        ]);
        this.settingsOverlay.setDepth(280);
        this.settingsOverlay.setAlpha(0);

        this.settingsOverlay.once('destroy', cleanup);

        this.tweens.add({
            targets: this.settingsOverlay,
            alpha: 1,
            duration: 160,
            ease: 'Sine.easeOut',
        });

        window.requestAnimationFrame(focus);
    }

    private showResetConfirmOverlay(): void {
        this.settingsOverlay?.destroy(true);

        const blocker = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W,
            GAME_H,
            UI_THEME.palette.backdropDeep,
            0.84,
        );

        const panel = this.add.rectangle(
            GAME_W / 2,
            GAME_H / 2,
            GAME_W - 88,
            280,
            UI_THEME.palette.surfaceBase,
            0.97,
        );

        const title = this.add
            .text(GAME_W / 2, GAME_H / 2 - 96, 'RESET LOCAL DATA', {
                ...uiTextStyles.title(),
                fontSize: '22px',
            })
            .setOrigin(0.5)
            .setScale(0.78);

        const warning = this.add
            .text(
                GAME_W / 2,
                GAME_H / 2 - 28,
                'This removes your local profile and local high score\non this device only.\n\nOnline leaderboard records are not deleted.',
                {
                    ...uiTextStyles.body(),
                    fontSize: '12px',
                    align: 'center',
                    lineSpacing: 4,
                },
            )
            .setOrigin(0.5)
            .setColor(themeColorHex(UI_THEME.palette.textBody));

        const cancelButton = this.makeButton(
            GAME_W / 2 - 70,
            GAME_H / 2 + 92,
            'CANCEL',
            () => this.destroySettingsOverlay(),
            UI_THEME.palette.surfaceRaised,
            {
                width: 100,
                height: 34,
                fontSize: 12,
            },
        );

        const resetButton = this.makeButton(
            GAME_W / 2 + 70,
            GAME_H / 2 + 92,
            'RESET',
            () => this.performLocalReset(),
            UI_THEME.palette.danger,
            {
                width: 100,
                height: 34,
                fontSize: 12,
            },
        );

        this.settingsOverlay = this.add.container(0, 0, [
            blocker,
            panel,
            title,
            warning,
            cancelButton.container,
            resetButton.container,
        ]);
        this.settingsOverlay.setDepth(280);
        this.settingsOverlay.setAlpha(0);

        this.tweens.add({
            targets: this.settingsOverlay,
            alpha: 1,
            duration: 160,
            ease: 'Sine.easeOut',
        });
    }

    private destroySettingsOverlay(): void {
        if (!this.settingsOverlay) {
            return;
        }

        const overlay = this.settingsOverlay;
        this.settingsOverlay = null;

        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 120,
            ease: 'Sine.easeInOut',
            onComplete: () => overlay.destroy(true),
        });
    }

    private performLocalReset(): void {
        this.timerEvent?.remove(false);
        this.roundHasStarted = false;
        this.pathGraphics.clear();
        this.clearBoardObjects();

        if (this.roundState) {
            this.roundState.status = 'ended';
            this.boardState.selectedPath = [];
        }

        clearPlayerProfile();
        this.highScoreStore.clear();
        this.highScore = 0;
        this.highScoreText.setText('High: 0');

        this.destroySettingsOverlay();
        this.closeLeaderboardOverlay();
        this.showProfileGate();
        this.showFeedback('Local data reset. Enter a name to continue.', UI_THEME.palette.accentAlt, 2200);
    }

    // ─── Board rendering ───────────────────────────────────────────────────────

    private clearBoardObjects(): void {
        this.tileObjects.forEach((c) => c.destroy());
        this.tileObjects = [];
    }

    private rebuildBoard(): void {
        this.clearBoardObjects();
        this.buildBoard();
    }

    private animateGrowthPlacements(newTiles: TileData[]): void {
        if (newTiles.length === 0) return;

        const newTileIndexes = new Set(newTiles.map((tile) => tile.index));

        this.tileObjects.forEach((container) => {
            const c = container as unknown as { tileData: TileData };
            if (!newTileIndexes.has(c.tileData.index)) return;

            container.setAlpha(0);
            this.tweens.add({
                targets: container,
                alpha: 1,
                duration: GROWTH_FADE_IN_MS,
                ease: 'Sine.easeOut',
            });
        });
    }

    private playExpansionEffects(expandedEdgeCount: number): void {
        const motion = UI_THEME.tuning.expansionMotion;
        const intensity = Math.min(1.8, 1 + expandedEdgeCount * 0.18);

        this.expansionInputLockedUntil = this.time.now + motion.inputLockMs;

        this.cameras.main.shake(
            Math.round(motion.cameraShakeMs * intensity),
            motion.cameraShakeIntensity * intensity,
        );

        const boardCenterX = this.boardLayout.originX + this.boardLayout.boardWidth / 2;
        const boardCenterY = this.boardLayout.originY + this.boardLayout.boardHeight / 2;

        const flash = this.add.rectangle(
            boardCenterX,
            boardCenterY,
            this.boardLayout.boardWidth + 18,
            this.boardLayout.boardHeight + 18,
            UI_THEME.palette.accent,
            0,
        );

        this.tweens.add({
            targets: flash,
            alpha: motion.flashAlpha,
            duration: motion.flashInMs,
            yoyo: true,
            hold: Math.round(motion.flashOutMs * 0.4),
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy(),
        });

        this.tileObjects.forEach((container) => {
            this.tweens.add({
                targets: container,
                scaleX: motion.tilePunchScale,
                scaleY: motion.tilePunchScale,
                duration: motion.tilePunchMs,
                yoyo: true,
                ease: 'Back.Out',
            });
        });

        const particleCount = Math.max(4, Math.round(motion.burstParticles * intensity));
        const particleDistance = motion.burstDistance * intensity;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const size = Phaser.Math.Between(motion.particleSizeMin, motion.particleSizeMax);
            const color = i % 2 === 0 ? UI_THEME.palette.accent : UI_THEME.palette.accentAlt;
            const particle = this.add.circle(boardCenterX, boardCenterY, size, color, 1);

            this.tweens.add({
                targets: particle,
                x: boardCenterX + Math.cos(angle) * particleDistance,
                y: boardCenterY + Math.sin(angle) * particleDistance,
                alpha: 0,
                scaleX: 0.4,
                scaleY: 0.4,
                duration: motion.burstMs,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy(),
            });
        }
    }

    private showTimerBonus(seconds: number): void {
        if (seconds <= 0) {
            return;
        }

        const bonusText = this.add
            .text(GAME_W / 2 + 42, 58, `+${seconds}s`, {
                ...uiTextStyles.metric(),
                color: themeColorHex(UI_THEME.palette.accentAlt),
            })
            .setOrigin(0, 0.5)
            .setAlpha(0);

        this.tweens.add({
            targets: bonusText,
            alpha: 1,
            y: 44,
            duration: 180,
            ease: 'Sine.easeOut',
            yoyo: true,
            hold: 420,
            onComplete: () => bonusText.destroy(),
        });
    }

    private applyExpansionScore(
        result: AcceptedSubmissionResult,
        expandedEdgeCount: number,
    ): AcceptedSubmissionResult {
        const scoreBreakdown = scoreSubmission(result.baseScore, expandedEdgeCount);
        const extraPoints = scoreBreakdown.totalScore - result.score;

        if (extraPoints > 0) {
            this.roundState.score += extraPoints;
            const latest = this.roundState.wordHistory[0];
            if (latest?.status === 'accepted') {
                latest.score = scoreBreakdown.totalScore;
            }
        }

        return {
            ...result,
            score: scoreBreakdown.totalScore,
            baseScore: scoreBreakdown.baseScore,
            expansionBonus: scoreBreakdown.expansionBonus,
            expandedEdgeCount,
        };
    }

    private buildBoard(): void {
        const bounds = getBoardBounds(this.boardState.tiles);
        this.boardMinRow = bounds.minRow;
        this.boardMinCol = bounds.minCol;
        this.boardLayout = calculateBoardLayout(bounds, BOARD_VIEWPORT, {
            tileSize: BASE_TILE_SIZE,
            gap: BASE_TILE_GAP,
            minScale: 0.4,
            fitPadding: 0.95,
        });

        const sortedTiles = [...this.boardState.tiles].sort(
            (a, b) => a.row - b.row || a.col - b.col,
        );

        sortedTiles.forEach((tile) => {
            const container = this.makeTileObject(tile);
            this.tileObjects.push(container);
        });
    }

    private makeTileObject(tile: TileData): Phaser.GameObjects.Container {
        const { x, y } = this.tileCenter(tile);
        const tileSize = this.boardLayout.tileSize;

        const bg = this.add.rectangle(0, 0, tileSize, tileSize, UI_THEME.palette.tileIdle, 1);

        const label = this.add
            .text(0, 0, tile.letter, uiTextStyles.tileLetter())
            .setOrigin(0.5)
            .setColor(themeColorHex(this.getTileLetterColor(tile.index)));

        const container = this.add.container(x, y, [bg, label]);
        container.setSize(tileSize, tileSize);
        container.setInteractive();

        container.on('pointerover', () => this.onTileHover(tile, bg));
        container.on('pointerout', () => this.refreshTileBg(tile, bg));
        container.on('pointerdown', () => this.onTilePointerDown(tile, bg));

        // Store references for later highlight updates
        (container as unknown as { tileData: TileData; bg: Phaser.GameObjects.Rectangle }).tileData = tile;
        (container as unknown as { tileData: TileData; bg: Phaser.GameObjects.Rectangle }).bg = bg;

        return container;
    }

    private getTileLetterColor(tileIndex: number): number {
        const existingColor = this.tileLetterColors.get(tileIndex);
        if (existingColor !== undefined) {
            return existingColor;
        }

        const color =
            TILE_LETTER_COLORS[Math.floor(Math.random() * TILE_LETTER_COLORS.length)] ??
            UI_THEME.palette.textStrong;
        this.tileLetterColors.set(tileIndex, color);
        return color;
    }

    // ─── Input handling ────────────────────────────────────────────────────────

    private onTileHover(
        tile: TileData,
        bg: Phaser.GameObjects.Rectangle,
    ): void {
        if (this.time.now < this.expansionInputLockedUntil) return;
        if (this.roundState.status !== 'running') return;
        const path = this.boardState.selectedPath;
        const alreadySelected = path.some((t) => t.index === tile.index);
        if (!alreadySelected && canAppendTile(path, tile)) {
            bg.setFillStyle(UI_THEME.palette.tileHover);
        }
    }

    private onTilePointerDown(
        tile: TileData,
        _bg: Phaser.GameObjects.Rectangle,
    ): void {
        if (this.time.now < this.expansionInputLockedUntil) return;
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
        bg.setFillStyle(selected ? UI_THEME.palette.tileSelected : UI_THEME.palette.tileIdle);
    }

    private tileCenter(tile: TileData): { x: number; y: number } {
        return {
            x:
                this.boardLayout.originX +
                (tile.col - this.boardMinCol) * (this.boardLayout.tileSize + this.boardLayout.gap) +
                this.boardLayout.tileSize / 2,
            y:
                this.boardLayout.originY +
                (tile.row - this.boardMinRow) * (this.boardLayout.tileSize + this.boardLayout.gap) +
                this.boardLayout.tileSize / 2,
        };
    }

    private redrawPath(): void {
        this.pathGraphics.clear();
        const path = this.boardState.selectedPath;
        if (path.length < 2) return;

        this.pathGraphics.lineStyle(
            Math.max(2, 4 * this.boardLayout.scale),
            UI_THEME.palette.tileSelected,
            UI_THEME.emphasis.pathAlpha,
        );
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
        if (this.time.now < this.expansionInputLockedUntil) {
            return;
        }

        if (!this.roundHasStarted || this.roundState.status !== 'running') {
            return;
        }

        const submittedPath = [...this.boardState.selectedPath];
        const result = submitWord(this.roundState, this.boardState.selectedPath);

        if (result.accepted) {
            const expansion = this.activeRunSeed
                ? applyEdgeExpansions(this.boardState.tiles, submittedPath, { seed: this.activeRunSeed })
                : applyEdgeExpansions(this.boardState.tiles, submittedPath);
            const scoredResult = this.applyExpansionScore(result, expansion.expandedEdges.length);
            const timeBonus = applyExpansionTimeBonus(this.roundState, expansion.expandedEdges.length);
            this.showTimerBonus(timeBonus);
            this.rebuildBoard();
            this.animateGrowthPlacements(expansion.placements.map((placement) => placement.tile));

            if (expansion.placements.length > 0) {
                this.playExpansionEffects(expansion.expandedEdges.length);
            }

            if (expansion.placements.length > 0) {
                this.showFeedback(
                    `✓ ${scoredResult.word} (+${scoredResult.score}: ${scoredResult.baseScore}+${scoredResult.expansionBonus})`,
                    UI_THEME.palette.success,
                );
            } else {
                this.showFeedback(`✓ ${scoredResult.word} (+${scoredResult.score})`, UI_THEME.palette.success);
            }
        } else {
            const messages: Record<string, string> = {
                round_not_running: 'Round has ended',
                too_short: 'Word too short (min 3)',
                duplicate: `"${result.word}" already submitted`,
                invalid_path: 'Invalid path',
                not_in_dictionary: `"${result.word}" is not in dictionary`,
            };
            this.showFeedback(messages[result.reason] ?? 'Rejected', UI_THEME.palette.danger);
        }

        // Clear selection regardless of outcome
        this.boardState.selectedPath = [];
        this.updateHUD();
        this.refreshTileHighlights();
        this.redrawPath();
    }

    // ─── HUD ───────────────────────────────────────────────────────────────────

    private buildHUD(): void {
        const panelWidth = GAME_W - HUD_LAYOUT.panelInsetX * 2;
        const controlsPanelY = HUD_LAYOUT.controlsPanelY;
        const controlsPanelHeight = HUD_LAYOUT.controlsPanelHeight;
        const wordsPanelHeight = HUD_LAYOUT.wordsPanelHeight;
        const wordsPanelY = GAME_H - wordsPanelHeight / 2 - UI_THEME.spacing.sm;

        this.add.rectangle(
            GAME_W / 2,
            HUD_LAYOUT.statusPanelY,
            GAME_W - 34,
            HUD_LAYOUT.statusPanelHeight,
            UI_THEME.palette.surfaceBase,
            UI_THEME.emphasis.panelAlpha,
        );

        this.add.rectangle(
            GAME_W / 2,
            controlsPanelY,
            panelWidth,
            controlsPanelHeight,
            UI_THEME.palette.surfaceMuted,
            UI_THEME.emphasis.panelAlpha,
        );

        this.add.rectangle(
            GAME_W / 2,
            wordsPanelY,
            panelWidth,
            wordsPanelHeight,
            UI_THEME.palette.surfaceMuted,
            UI_THEME.emphasis.panelAlpha,
        );

        // Title
        this.add.text(GAME_W / 2, 30, 'TANGELO', uiTextStyles.title()).setOrigin(0.5);

        // Timer
        this.timerText = this.add
            .text(GAME_W / 2, 70, String(ROUND_DURATION_SECONDS), uiTextStyles.timer())
            .setOrigin(0.5);
        this.timerText.setInteractive({ useHandCursor: true });
        this.timerText.on('pointerdown', () => this.reduceTimerForDebug(10));

        this.scoreText = this.add.text(28, 70, 'Score: 0', uiTextStyles.metric()).setOrigin(0, 0.5);

        this.highScoreText = this.add
            .text(GAME_W - 28, 70, `High: ${this.highScore}`, uiTextStyles.metric())
            .setOrigin(1, 0.5);

        this.modeText = this.add
            .text(GAME_W / 2, 98, this.activeRunContext.modeLabel, {
                ...uiTextStyles.label(),
                fontSize: '12px',
            })
            .setOrigin(0.5, 0.5)
            .setColor(themeColorHex(UI_THEME.palette.textMuted));

        // Current word display
        this.currentWordText = this.add
            .text(GAME_W / 2, HUD_BOTTOM_ANCHOR_Y + 24, '', uiTextStyles.currentWord())
            .setOrigin(0.5);

        // Feedback message
        this.feedbackText = this.add
            .text(GAME_W / 2, HUD_BOTTOM_ANCHOR_Y + 58, '', uiTextStyles.feedback())
            .setOrigin(0.5);

        // Submit button
        this.submitButton = this.makeButton(GAME_W / 2, controlsPanelY, 'SUBMIT', () => this.onSubmit(), UI_THEME.palette.accent, {
            width: HUD_LAYOUT.submitButton.width,
            height: HUD_LAYOUT.submitButton.height,
        });

        this.restartButton = this.makeButton(
            HUD_LAYOUT.restartButton.x,
            HUD_LAYOUT.restartButton.y,
            'RESTART',
            () => {
                this.showStartGate();
            },
            UI_THEME.palette.accentAlt,
            {
                width: HUD_LAYOUT.restartButton.width,
                height: HUD_LAYOUT.restartButton.height,
                fontSize: HUD_LAYOUT.restartButton.fontSize,
            },
        );

        this.leaderboardButton = this.makeButton(
            HUD_LAYOUT.leaderboardButton.x,
            HUD_LAYOUT.leaderboardButton.y,
            'LEADERBOARD',
            () => this.showLeaderboardOverlay(),
            UI_THEME.palette.surfaceRaised,
            {
                width: HUD_LAYOUT.leaderboardButton.width,
                height: HUD_LAYOUT.leaderboardButton.height,
                fontSize: HUD_LAYOUT.leaderboardButton.fontSize,
            },
        );

        this.setButtonEnabled(this.leaderboardButton, false);

        // Word list label
        this.add.text(
            UI_THEME.spacing.lg + 4,
            wordsPanelY - wordsPanelHeight / 2 + UI_THEME.spacing.md,
            'Words:',
            uiTextStyles.label(),
        );

        // Word list scrollable area
        this.wordListText = this.add.text(UI_THEME.spacing.lg + 4, wordsPanelY - wordsPanelHeight / 2 + 34, '', {
            ...uiTextStyles.body(),
            wordWrap: { width: panelWidth - UI_THEME.spacing.lg },
            lineSpacing: 3,
        });
    }

    private makeButton(
        x: number,
        y: number,
        label: string,
        onClick: () => void,
        bgColor: number = UI_THEME.palette.accent,
        options?: {
            width?: number;
            height?: number;
            fontSize?: number;
        },
    ): UIButton {
        const width = options?.width ?? 160;
        const height = options?.height ?? 44;
        const fontSize = options?.fontSize ?? UI_THEME.typeScale.button;

        const bg = this.add.rectangle(0, 0, width, height, bgColor, 1);
        const text = this.add.text(0, 0, label, {
            ...uiTextStyles.button(),
            fontSize: `${fontSize}px`,
        }).setOrigin(0.5);

        const btn = this.add.container(x, y, [bg, text]);
        btn.setSize(width, height);
        btn.setInteractive();
        const button: UIButton = {
            container: btn,
            bg,
            label: text,
            baseColor: bgColor,
            onClick,
            enabled: true,
        };

        btn.on('pointerdown', () => {
            if (!button.enabled) return;
            bg.setFillStyle(
                Phaser.Display.Color.ValueToColor(bgColor).darken(UI_THEME.emphasis.pressDarken).color,
            );
        });

        btn.on('pointerup', () => {
            if (!button.enabled) return;
            bg.setFillStyle(bgColor);
            onClick();
        });

        btn.on('pointerover', () =>
            button.enabled &&
            bg.setFillStyle(
                Phaser.Display.Color.ValueToColor(bgColor).lighten(UI_THEME.emphasis.hoverLighten).color,
            ));
        btn.on('pointerout', () => {
            bg.setFillStyle(bgColor);
        });

        return button;
    }

    private setButtonEnabled(button: UIButton, enabled: boolean): void {
        button.enabled = enabled;
        button.container.disableInteractive();
        if (enabled) {
            button.container.setInteractive();
            button.container.setAlpha(1);
            button.bg.setFillStyle(button.baseColor);
            button.label.setAlpha(1);
            return;
        }

        button.container.setAlpha(UI_THEME.emphasis.disabledAlpha);
        button.bg.setFillStyle(UI_THEME.palette.surfaceRaised);
        button.label.setAlpha(0.85);
    }

    private updateHUD(): void {
        // Timer colour
        const t = this.roundState.timeRemaining;
        const timerColor = t <= 10
            ? themeColorHex(UI_THEME.palette.timerLow)
            : themeColorHex(UI_THEME.palette.textStrong);
        this.timerText.setText(String(t).padStart(2, '0'));
        this.timerText.setColor(timerColor);

        // Current word
        const word = this.boardState.selectedPath.map((t) => t.letter).join('');
        this.currentWordText.setText(word);

        const canSubmit = this.roundState.status === 'running' && this.boardState.selectedPath.length >= 3;
        this.setButtonEnabled(this.submitButton, canSubmit);

        this.scoreText.setText(`Score: ${this.roundState.score}`);
        this.highScoreText.setText(`High: ${this.highScore}`);
        this.modeText.setText(this.activeRunContext.modeLabel);

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

    private showFeedback(
        msg: string,
        color: number,
        duration: number = UI_THEME.tuning.feedbackDurationMs,
    ): void {
        this.feedbackText.setText(msg);
        this.feedbackText.setColor(themeColorHex(color));

        if (duration > 0) {
            this.time.delayedCall(duration, () => {
                if (this.feedbackText.text === msg) this.feedbackText.setText('');
            });
        }
    }
}
