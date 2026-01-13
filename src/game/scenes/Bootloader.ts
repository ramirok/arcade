import { Scene } from "phaser";

export class Bootloader extends Scene {
  constructor() {
    super("bootloader");
  }

  preload() {
    this.add
      .graphics()
      .fillStyle(0xca6702, 1)
      .fillRect(
        this.cameras.main.width / 4 - 2,
        this.cameras.main.height / 2 - 18,
        this.cameras.main.width / 2 + 4,
        20
      );
    const progressBar = this.add.graphics();

    this.load.on(
      "progress",
      (value: number) => {
        progressBar
          .clear()
          .fillStyle(0xf09937, 1)
          .fillRect(
            this.cameras.main.width / 4,
            this.cameras.main.height / 2 - 16,
            (this.cameras.main.width / 2) * value,
            16
          );
      },
      this
    );

    this.load.on(
      "complete",
      () => {
        console.log("Loading complete!");
        this.scene.start("main-game");
      },
      this
    );
  }
}
