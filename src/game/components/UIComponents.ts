import { GameObjects, Geom, Scene } from "phaser";
import type { MainGame } from "../scenes/MainGame";

export class FloatingText extends GameObjects.Text {
  declare scene: MainGame
  constructor(entity: GameObjects.Sprite, x: number, y: number, text: string, options?: { color?: string, fontSize?: string }) {
    super(entity.scene, x, y, text, {
      color: options?.color || '#00ff00',
      fontSize: options?.fontSize || '20px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.x += -this.width / 2;
    this.y -= (entity.height + 40) / 2;
    this.scene.add.existing(this);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      alpha: 0,
      duration: 1000,
      onComplete: () => this.destroy()
    });
  }
}

type ButtonProps = {
  text: string,
  onClick: () => void
}

export class Button extends GameObjects.Container {
  constructor(scene: Scene, x: number, y: number, props: ButtonProps) {
    super(scene, x, y);

    const textColor = '#ffffff'
    const textButton = new GameObjects.Text(scene, 0, 0, props.text, {
      backgroundColor: '#333',
      padding: {
        x: 20,
        y: 10
      },
      color: textColor
    })

    this.x = this.x - textButton.width / 2
    this.y = this.y - textButton.height / 2

    const containerArea = new Geom.Rectangle(0, 0, textButton.width, textButton.height)
    this.setInteractive(containerArea, Geom.Rectangle.Contains)

    this.add(textButton)

    this
      .on('pointerover', () => textButton.setStyle({ fill: '#ff0' }))
      .on('pointerout', () => textButton.setStyle({ fill: textColor }))
      .on('pointerdown', props.onClick)
    this.scene.add.existing(this)
  }
}
