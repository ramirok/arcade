import { GameObjects, Math as PhaserMath } from "phaser";
import type { Enemy } from "./Enemy";
import { MainGame } from "../scenes/MainGame";

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
    this.setVisible(this.scene.data.get('showHealthBars'))
    enemy.scene.add.existing(this);


    const handleShowHealthBars = (_: any, val: boolean) => {
      if (!this.#pointerOver && this.active) {
        this.setVisible(val)
      }
    }
    const handlePointerOver = () => {
      this.#pointerOver = true
      this.setVisible(true)
    }
    const handlePointerOut = () => {
      this.#pointerOver = false
      if (!this.scene.data.get('showHealthBars')) {
        this.setVisible(false)
      }
    }
    const handleHealthUpdate = () => {
      this.updateHealth(this.#enemy.data.get('health'), this.#enemy.data.get('maxHealth'))
    }

    this.scene.data.events.on('changedata-showHealthBars', handleShowHealthBars)
    enemy.data.events.on('changedata-health', handleHealthUpdate)
    enemy.data.events.on('changedata-maxHealth', handleHealthUpdate)
    enemy.on('pointerout', handlePointerOut);
    enemy.on('pointerover', handlePointerOver);

    enemy.once('destroy', () => {
      this.scene.events.off('changedata-showHealthBars', handleShowHealthBars)
      enemy.data.events.off('changedata-health', handleHealthUpdate)
      enemy.data.events.off('changedata-maxHealth', handleHealthUpdate)
      enemy.off('pointerout', handlePointerOut);
      enemy.off('pointerover', handlePointerOver);
    })
  }

  updateHealth(current: number, max: number) {
    const percent = PhaserMath.Clamp(current / max, 0, 1);
    this.#healthFill.width = (this.#healthWidth - 2) * percent;
    this.#healthFill.fillColor = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;
  }

  preUpdate() {
    this.x = this.#enemy.x;
    this.y = this.#enemy.y + this.#offsetY;
  }

  disable() {
    this.setActive(false);
    this.setVisible(false)
  }

  enable() {
    this.x = this.#enemy.x;
    this.y = this.#enemy.y + this.#offsetY;
    this.setActive(true);
    this.setVisible(this.scene.data.get('showHealthBars') || this.#pointerOver)
    this.updateHealth(this.#enemy.data.get('health'), this.#enemy.data.get('maxHealth'))
  }
}
