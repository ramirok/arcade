import { GameObjects, Math as PhaserMath } from "phaser";
import type { Enemy } from "./Enemy";
import type { MainGame } from "../scenes/MainGame";

export class HealthBar extends GameObjects.Container {
  declare scene: MainGame
  #background;
  #healthFill;
  #healthWidth;
  #offsetY;
  #enemy
  #pointerOver = false

  constructor(enemy: Enemy, width = 50, height = 6, offsetY = -40) {
    super(enemy.scene, enemy.x, enemy.y);
    this.#enemy = enemy

    this.#background = new GameObjects.Rectangle(enemy.scene, 0, 0, width, height, 0x000000)
    this.#healthFill = new GameObjects.Rectangle(enemy.scene, 0, 0, width - 2, height - 2, 0x00ff00)

    this.#healthWidth = width;
    this.#offsetY = offsetY;

    this.add([this.#background, this.#healthFill]);
    this.setVisible(false)
    enemy.scene.add.existing(this);

    this.scene.data.events.on('changedata-showHealthBars', (_, val) => {
      if (!this.#pointerOver) {
        this.setVisible(val)
      }
    })
    enemy.on('pointerover', () => {
      this.#pointerOver = true
      this.setVisible(true)
    });
    enemy.on('pointerout', () => {
      this.#pointerOver = false
      if (!this.scene.data.get('showHealthBars')) {
        this.setVisible(false)
      }
    });
    enemy.data.events.on('changedata-health', () => {
      this.updateHealth(enemy.data.get('health'), enemy.data.get('maxHealth'))
    })
  }

  updateHealth(current: number, max: number): void {
    const percent = PhaserMath.Clamp(current / max, 0, 1);
    this.#healthFill.width = (this.#healthWidth - 2) * percent;
    this.#healthFill.fillColor = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;
  }

  preUpdate() {
    this.x = this.#enemy.x;
    this.y = this.#enemy.y + this.#offsetY;
  }

}
