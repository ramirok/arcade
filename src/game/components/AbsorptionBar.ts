import { GameObjects, Math as PhaserMath } from "phaser";
import type { Enemy } from "./Enemy";
import { MainGame } from "../scenes/MainGame";
import type { DataOverride } from "../utils";

type AbsorptionBarData = {
  absorbing: boolean
}

export class AbsorptionBar extends GameObjects.Container {
  declare scene: MainGame
  declare data: DataOverride<AbsorptionBar, AbsorptionBarData>
  #background;
  #fill;
  #width;
  #offsetY;
  #enemy;
  #pointerOver = false
  #timer = 0;
  #duration

  constructor(enemy: Enemy, absorptionDuration: number, width = 50, height = 6, offsetY = -30) {
    super(enemy.scene, enemy.x, enemy.y);
    this.#enemy = enemy;
    this.#background = new GameObjects.Rectangle(enemy.scene, 0, 0, width, height, 0x000000);
    this.#fill = new GameObjects.Rectangle(enemy.scene, -width / 2 + 1, 0, 0, height - 2, 0x9b59b6);
    this.#width = width;
    this.#offsetY = offsetY;
    this.#duration = absorptionDuration

    this.setDataEnabled()
    this.data.set('absorbing', false)


    this.add([this.#background, this.#fill]);
    this.scene.add.existing(this);

    const setVisibility = () => {
      if (!this.#enemy.stateMachine.is('corpse')) {
        this.setVisible(false)
      } else if (
        this.#pointerOver ||
        (this.scene.data.get('showBars') && this.active) ||
        this.data.get('absorbing')
      ) {
        this.setVisible(true)
      } else {
        this.setVisible(false)
      }
    }
    const handleShowHealthBars = () => {
      setVisibility()
    }
    const handlePointerOver = () => {
      this.#pointerOver = true
      setVisibility()
    }
    const handlePointerOut = () => {
      this.#pointerOver = false
      setVisibility()
    }

    this.data.events.on('changedata-absorbing', setVisibility)
    this.scene.data.events.on('changedata-showBars', handleShowHealthBars)
    enemy.on('pointerout', handlePointerOut);
    enemy.on('pointerover', handlePointerOver);

    enemy.once('destroy', () => {
      this.data.events.off('changedata-absorbing', setVisibility)
      this.scene.data.events.off('changedata-showBars', handleShowHealthBars)
      enemy.off('pointerout', handlePointerOut);
      enemy.off('pointerover', handlePointerOver);
    })
    this.disable()
  }

  updateProgress(timer: number, duration: number) {
    this.#timer = timer;
    const percent = PhaserMath.Clamp((duration - timer) / duration, 0, 1);
    this.#fill.width = (this.#width - 2) * percent;
  }

  disable() {
    this.setActive(false);
    this.setVisible(false)
  }

  enable() {
    this.x = this.#enemy.x;
    this.y = this.#enemy.y + this.#offsetY;
    this.setActive(true);
    this.setVisible(this.scene.data.get('showBars'))
    this.updateProgress(this.#duration, this.#duration);
  }
}
