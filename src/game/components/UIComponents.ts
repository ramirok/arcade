export class Button extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, text: string) {
    super(scene, x, y);

    const textColor = '#ffffff'
    const textButton = this.scene.add.text(0, 0, text, {
      backgroundColor: '#333',
      padding: { x: 20, y: 10 },
      color: textColor
    })

    this.x = this.x - textButton.width / 2
    this.y = this.y - textButton.height / 2

    this.scene.add.existing(this)
    const containerArea = new Phaser.Geom.Rectangle(0, 0, textButton.width, textButton.height)
    this.setInteractive(containerArea, Phaser.Geom.Rectangle.Contains)

    this.add([textButton])

    this
      .on('pointerover', () => textButton.setStyle({ fill: '#ff0' }))
      .on('pointerout', () => textButton.setStyle({ fill: textColor }))
  }
}
