import type { MainGame } from "../scenes/MainGame.svelte";
import { StateMachine } from "../stateMachine";
import type { Enemy } from "./Enemy";
import Phaser from "phaser";



export class Player extends Phaser.GameObjects.Ellipse {
  declare body: Phaser.Physics.Arcade.Body;
  #WASD
  speed = 200
  #isInvulnerable = false
  health = 100
  exp = 0
  coolDown = 0
  movementMachine
  actionMachine
  target: null | Enemy = null
  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 50, 50, 0xEEEEEE);
    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);
    this.body.setCollideWorldBounds(true);

    this.#WASD = this.scene.input.keyboard!.addKeys("W,A,S,D") as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    }

    this.actionMachine = new StateMachine({
      name: 'ActionMachine',
      initial: 'idle',
      states: {
        idle: {
        },
        attacking: {
        },
        coolingDown: {
        }
      }
    })
    this.movementMachine = new StateMachine({
      name: 'MovementMachine',
      initial: 'idle',
      states: {
        idle: {
          onEnter: () => {
            this.body.setVelocity(0)
          },
        },
        moving: {
          onUpdate: () => {
            if (this.#WASD.W.isDown) {
              this.body.setVelocityY(-this.speed)
            } else if (this.#WASD.S.isDown) {
              this.body.setVelocityY(this.speed);
            } else {
              if (!this.#isInvulnerable) {
                this.body.setVelocityY(0);
              }
            }
            if (this.#WASD.A.isDown) {
              this.body.setVelocityX(-this.speed);
            } else if (this.#WASD.D.isDown) {
              this.body.setVelocityX(this.speed);
            } else {
              if (!this.#isInvulnerable) {
                this.body.setVelocityX(0);
              }
            }
            this.body.velocity.normalize().scale(this.speed);
          }
        },
        knockingBack: {
          reenter: true,
          onEnter: (payload: { angle: number, force: number }) => {
            this.body.setVelocity(
              Math.cos(payload.angle) * payload.force,
              Math.sin(payload.angle) * payload.force
            );
            this.scene.time.delayedCall(200, () => {
              this.movementMachine.set('idle')
            })
          }
        }
      }
    })
  }


  update(_: number, delta: number) {
    this.#handleMovement()
    this.movementMachine.update(delta)

    if (this.coolDown > 0) {
      this.coolDown -= delta
    }

  }

  hit(enemy: Enemy) {
    if (this.health < 1) {
      this.#die()
    }

    if (this.#isInvulnerable) return
    if (enemy.damageCooldownElapsed > 0) return

    this.#isInvulnerable = true
    this.health -= enemy.damage
    this.setAlpha(.5)
    this.body.checkCollision.none = true

    const angle = Phaser.Math.Angle.BetweenPoints(enemy, this);
    this.movementMachine.set('knockingBack', { angle, force: enemy.knockbackForce })

    enemy.damageCooldownElapsed = enemy.damageCooldownTime

    this.scene.time.delayedCall(500, () => {
      this.setAlpha(1)
      this.#isInvulnerable = false
      this.body.checkCollision.none = false
    })
  }

  shoot() {
    this.coolDown = 1000
  }

  #die() {
    this.body.setEnable(false)
    this.scene.scene.pause()
    this.scene.scene.launch('game-over');
  }

  #handleMovement() {
    const isMoving = this.#WASD.W.isDown || this.#WASD.S.isDown || this.#WASD.A.isDown || this.#WASD.D.isDown

    if (isMoving && this.movementMachine.getCurrent() === 'idle') {
      this.movementMachine.set('moving');
    } else if (!isMoving && this.movementMachine.getCurrent() === 'moving') {
      this.movementMachine.set('idle')
    }
    // if (this.#WASD.W.isDown) {
    //   this.body.setVelocityY(-this.speed)
    // } else if (this.#WASD.S.isDown) {
    //   this.body.setVelocityY(this.speed);
    // } else {
    //   if (!this.#isInvulnerable) {
    //     this.body.setVelocityY(0);
    //   }
    // }
    // if (this.#WASD.A.isDown) {
    //   this.body.setVelocityX(-this.speed);
    // } else if (this.#WASD.D.isDown) {
    //   this.body.setVelocityX(this.speed);
    // } else {
    //   if (!this.#isInvulnerable) {
    //     this.body.setVelocityX(0);
    //   }
    // }
    // this.body.velocity.normalize().scale(this.speed);
  }

}
