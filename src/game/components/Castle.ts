
export class Castle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'castle',);

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true)
  }
}
