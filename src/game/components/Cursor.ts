import { GameObjects, Input, Scene } from "phaser";

export class Cursor extends GameObjects.Rectangle {
  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, 20, 20, 0xBBBBBB);

    this.scene.add.existing(this);
    this.scene.input.on('pointermove', (pointer: Input.Pointer) => {
      this.setPosition(pointer.worldX, pointer.worldY);
    })
  }
}
