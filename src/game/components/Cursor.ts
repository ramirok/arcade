export class Cursor extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 20, 20, 0xBBBBBB);

    this.scene.add.existing(this);
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.setPosition(pointer.worldX, pointer.worldY);
    })
  }
}
