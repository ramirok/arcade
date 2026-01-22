
import { Physics } from "phaser";
import type { MainGame } from "../scenes/MainGame";

export class Castle extends Physics.Arcade.Sprite {
  declare scene: MainGame
  declare body: Physics.Arcade.Body;
  #health = 200

  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'castle');

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true)
  }

  takeDamage(amount: number) {
    this.#health -= amount;
    this.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this,
      duration: 150,
      onComplete: () => this.clearTint()
    });
    if (this.#health <= 0) {
      this.scene.scene.pause();
      this.scene.scene.launch('game-over');
    }
  }
}
