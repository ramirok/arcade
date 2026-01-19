
import type { MainGame } from "../scenes/MainGame.svelte";

export class Castle extends Phaser.Physics.Arcade.Sprite {
  declare scene: MainGame
  declare body: Phaser.Physics.Arcade.Body;
  #maxHealth = 20
  #health = 20

  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'castle');

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true)
  }

  takeDamage(amount: number) {
    this.#health -= amount;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
    if (this.#health <= 0) {
      this.scene.scene.pause();
      this.scene.scene.launch('game-over');
    }
  }
}
