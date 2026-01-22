
import { Bootloader } from "./scenes/Bootloader";
import { MainGame } from "./scenes/MainGame";
import { PauseScreen } from "./scenes/PauseScreen";
import { UIScene } from "./scenes/UI";
import { GameOver } from "./scenes/GameOver";
import { AUTO, Game, Scale } from "phaser";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  scale: {
    mode: Scale.EXPAND,
    autoCenter: Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
  },
  autoRound: true,
  disableContextMenu: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: true
    },
  },
  scene: [Bootloader, MainGame, PauseScreen, UIScene, GameOver],
};

export const StartGame = (parent: string) => {
  new Game({ ...config, parent });
};
