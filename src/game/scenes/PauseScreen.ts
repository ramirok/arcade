import { Scene } from "phaser";
import { Button } from "../components/UIComponents";

export class PauseScreen extends Scene {
  constructor() {
    super('pause-screen')
  }

  create() {
    this.scene.bringToTop('pause-screen');
    this.add.graphics()
      .fillStyle(0x000000, 0.7)
      .fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.input.keyboard!.on('keydown-ESC', () => {
      this.#resumeGame()
    })

    new Button(this, this.cameras.main.width / 2, this.cameras.main.height / 2, {
      text: 'CONTINUE',
      onClick: () => {
        this.#resumeGame()
      }
    })
  }

  #resumeGame() {
    this.scene.stop();
    this.scene.resume('main-game');
  }
}
