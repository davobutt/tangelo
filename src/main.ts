import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const waitForUiFonts = async (): Promise<void> => {
    if (!('fonts' in document)) return;

    const timeoutMs = 1500;
    const timeout = new Promise<void>((resolve) => {
        window.setTimeout(resolve, timeoutMs);
    });

    const loadFonts = Promise.all([
        document.fonts.load('700 16px Barlow'),
        document.fonts.load('700 16px Bungee'),
        document.fonts.load('700 16px "Space Mono"'),
    ]).then(() => undefined);

    await Promise.race([loadFonts, timeout]);
};

const bootstrap = async (): Promise<void> => {
    await waitForUiFonts();

    new Phaser.Game({
        type: Phaser.AUTO,
        width: 480,
        height: 640,
        backgroundColor: '#111827',
        scene: [GameScene],
        parent: 'game-root',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
            antialias: true,
            antialiasGL: true,
            roundPixels: true,
        },
    });
};

void bootstrap();
