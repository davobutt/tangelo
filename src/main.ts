import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

new Phaser.Game({
    type: Phaser.AUTO,
    width: 480,
    height: 640,
    backgroundColor: '#1a1a2e',
    scene: [GameScene],
    parent: document.body,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
});
