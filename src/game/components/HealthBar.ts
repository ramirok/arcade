import { GameObjects, Math as PhaserMath } from "phaser";
import type { Enemy } from "./Enemy";
import { MainGame } from "../scenes/MainGame";

export class HealthBar extends GameObjects.Container {
  declare scene: MainGame
  #background;
  #fill;
  #width;
  #offsetY;
  #enemy
  #pointerOver = false
  #currentTween: Phaser.Tweens.Tween | null = null

  constructor(enemy: Enemy, width = 50, height = 6) {
    super(enemy.scene, enemy.x, enemy.y);
    this.#enemy = enemy
    this.#background = new GameObjects.Rectangle(enemy.scene, 0, 0, width, height, 0x000000)
    this.#fill = new GameObjects.Rectangle(enemy.scene, 0, 0, width - 2, height - 2, 0x00ff00)
    this.#width = width;
    this.#offsetY = -enemy.height / 2 - height;

    this.add([this.#background, this.#fill]);
    this.setVisible(this.scene.data.get('showBars'))
    this.scene.add.existing(this);


    const setVisibility = () => {
      if (this.#enemy.stateMachine.is('corpse') || !this.active) {
        if (this.visible) {
          this.#cancelAnimation();
        }
        return
      } else if (this.#pointerOver || this.scene.data.get('showBars')) {
        if (!this.visible) {
          this.#animateIn();
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
    const handleHealthUpdate = () => {
      const currentHealth = this.#enemy.data.get('health')
      this.updateHealth(currentHealth, this.#enemy.data.get('maxHealth'))
      if (currentHealth < 1 && this.visible) {
        this.scene.time.delayedCall(1000, () => {
          setVisibility()
        })
      }
    }

    this.scene.data.events.on('changedata-showBars', handleShowHealthBars)
    enemy.data.events.on('changedata-health', handleHealthUpdate)
    enemy.data.events.on('changedata-maxHealth', handleHealthUpdate)
    enemy.on('pointerout', handlePointerOut);
    enemy.on('pointerover', handlePointerOver);

    enemy.once('destroy', () => {
      this.scene.data.events.off('changedata-showBars', handleShowHealthBars)
      enemy.data.events.off('changedata-health', handleHealthUpdate)
      enemy.data.events.off('changedata-maxHealth', handleHealthUpdate)
      enemy.off('pointerout', handlePointerOut);
      enemy.off('pointerover', handlePointerOver);
    })
  }

  updateHealth(current: number, max: number) {
    const percent = PhaserMath.Clamp(current / max, 0, 1);
    this.#fill.width = PhaserMath.Clamp((this.#width - 2) * percent, 1, this.#width - 2);
    this.#fill.fillColor = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;
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

  preUpdate() {
    this.x = this.#enemy.x;
    this.y = this.#enemy.y + this.#offsetY;
  }

  disable() {
    this.#cancelAnimation();
    this.setActive(false);
  }

  enable() {
    this.x = this.#enemy.x;
    this.y = this.#enemy.y + this.#offsetY;
    this.setActive(true);
    this.updateHealth(this.#enemy.data.get('health'), this.#enemy.data.get('maxHealth'));
    const shouldShow = this.scene.data.get('showBars') || this.#pointerOver;
    if (shouldShow) {
      this.#animateIn();
    } else {
      this.setVisible(false);
    }
  }
}
