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
  #duration
  #currentTween: Phaser.Tweens.Tween | null = null

  constructor(enemy: Enemy, absorptionDuration: number, width = 80, height = 10) {
    super(enemy.scene, enemy.x, enemy.y);
    this.#enemy = enemy;
    this.#background = new GameObjects.Rectangle(enemy.scene, 0, 0, width, height, 0x000000);
    this.#fill = new GameObjects.Rectangle(enemy.scene, -width / 2 + 1, 0, 0, height - 2, 0x9b59b6);
    this.#width = width;
    this.#offsetY = -enemy.height / 2 - height;
    this.#duration = absorptionDuration

    this.setDataEnabled()
    this.data.set('absorbing', false)


    this.add([this.#background, this.#fill]);
    this.scene.add.existing(this);

    const setVisibility = () => {
      if (!this.#enemy.stateMachine.is('corpse') || !this.active) {
        return
      } else if (
        this.#pointerOver ||
        this.scene.data.get('showBars') ||
        this.data.get('absorbing')
      ) {
        if (!this.visible) {
          this.#animateIn()
        }
      } else {
        this.#cancelAnimation();
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
    const percent = PhaserMath.Clamp((duration - timer) / duration, 0, 1);
    this.#fill.width = PhaserMath.Clamp((this.#width - 2) * percent, 2, this.#width - 2);
  }

  #animateIn() {
    this.#cancelAnimation();
    this.setAlpha(0);
    this.setVisible(true);
    this.#currentTween = this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 80,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.#currentTween = null;
      }
    });
  }

  #cancelAnimation() {
    if (this.#currentTween) {
      this.#currentTween.stop();
      this.#currentTween = null;
    }
    this.setVisible(false);
    this.setAlpha(1);
  }

  disable() {
    this.#cancelAnimation();
    this.setActive(false);
  }

  enable() {
    this.x = this.#enemy.x;
    this.y = this.#enemy.y + this.#offsetY;
    this.setActive(true);
    this.updateProgress(this.#duration, this.#duration);
    const shouldShow = this.scene.data.get('showBars') || this.#pointerOver;
    if (shouldShow) {
      const initalOffset = this.#background.height + 2
      this.y -= initalOffset
      this.scene.tweens.add({
        targets: this,
        y: this.y + initalOffset,
        duration: 80,
        delay: 1000
      })
      this.#animateIn();
    } else {
      this.setVisible(false);
    }
  }
}
