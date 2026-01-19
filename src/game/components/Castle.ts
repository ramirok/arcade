
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
