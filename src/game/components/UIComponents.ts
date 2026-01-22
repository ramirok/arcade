import { GameObjects, Geom, Scene } from "phaser";

type ButtonProps = {
  text: string,
  onClick: () => void
}

export class Button extends GameObjects.Container {
  constructor(scene: Scene, x: number, y: number, props: ButtonProps) {
    super(scene, x, y);

    const textColor = '#ffffff'
    const textButton = this.scene.add.text(0, 0, props.text, {
      backgroundColor: '#333',
      padding: { x: 20, y: 10 },
      color: textColor
    })

    this.x = this.x - textButton.width / 2
    this.y = this.y - textButton.height / 2

    this.scene.add.existing(this)
    const containerArea = new Geom.Rectangle(0, 0, textButton.width, textButton.height)
    this.setInteractive(containerArea, Geom.Rectangle.Contains)

    this.add([textButton])

    this
      .on('pointerover', () => textButton.setStyle({ fill: '#ff0' }))
      .on('pointerout', () => textButton.setStyle({ fill: textColor }))
      .on('pointerdown', props.onClick)
  }
}
