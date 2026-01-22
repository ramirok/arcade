import { Scene } from "phaser";
import { Button } from "../components/UIComponents";

export class GameOver extends Scene {
  constructor() {
    super('game-over')
  }

  create() {
    this.add.graphics()
      .fillStyle(0x000000, 0.7)
      .fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.input.keyboard!.on('keydown-ESC', () => {
      this.#restartGame()
    })

    const middleX = this.cameras.main.width / 2
    const middleY = this.cameras.main.height / 2
    this.add.text(middleX, middleY - 100, 'GAME OVER', {
      fontSize: '36px'
    }).setOrigin(.5)

    new Button(this, middleX, middleY, {
      text: 'RESTART',
      onClick: () => {
        this.#restartGame()
      }
    })
  }

  #restartGame() {
    this.scene.start('main-game');
  }
}
