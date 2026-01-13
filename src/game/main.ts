
import { AUTO, Game } from "phaser";
import { Bootloader } from "./scenes/Bootloader";
import { MainGame } from "./scenes/MainGame.svelte";
import { PauseScreen } from "./scenes/PauseScreen";
import { UIScene } from "./scenes/UI";
import { GameOver } from "./scenes/GameOver";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1000,
  height: 800,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  autoRound: false,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: true,
    },
  },
  scene: [Bootloader, MainGame, PauseScreen, UIScene, GameOver],
};

export const StartGame = (parent: string) => {
  new Game({ ...config, parent });
};
