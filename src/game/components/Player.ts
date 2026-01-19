import type { MainGame } from "../scenes/MainGame.svelte";
import type { Bullet } from "./Bullet";
import { StateMachine } from "../stateMachine";
import { Enemy } from "./Enemy";
import Phaser from "phaser";
import { getPixelPosition, isWithinRange } from "../utils";

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare scene: MainGame
  declare body: Phaser.Physics.Arcade.Body;
  attackTarget: null | Enemy = null
  stateMachine
  path: number[][] = []
  #movementSpeed = 200
  #attackRange = 300
  #attackPrepareTimeInitial = 500
  #attackPrepareTimer = 500
  #attackBackswingTimeInitial = 500
  #attackBackswingTimer = 500
  #recalculateAttackMoveTimeInitial = 200
  #recalculateAttackMoveTimer = 0
  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'player');
    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);
    this.body.setCollideWorldBounds(true);
    this.scene.cameras.main.startFollow(this);
    this.scene.cameras.main.setDeadzone(500, 300)

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player'),
      duration: 500,
      repeat: -1
    });

    this.stateMachine = new StateMachine({
      // debug: true,
      name: 'PlayerMachine',
      initial: 'idle',
      states: {
        idle: {
          onEnter: () => {
            this.play('idle');
            this.attackTarget = null
          },
          onUpdate: () => {
            const enemies = this.scene.enemies.getChildren() as Enemy[];
            if (enemies.length === 0) return;
            let closestEnemy: Enemy | null = null;
            let shortestDistance = Infinity;
            for (const enemy of enemies) {
              if (!enemy.active) return;
              const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
              if (dist < shortestDistance) {
                shortestDistance = dist;
                closestEnemy = enemy;
              }
            }
            if (closestEnemy && shortestDistance <= this.#attackRange) {
              this.attackTarget = closestEnemy;
              this.stateMachine.set('attack-prepare');
            }
          }
        },
        move: {
          reenter: true,
          onEnter: (path: typeof this.path) => {
            this.path = path
          },
          onUpdate: () => {
            const nextPoint = getPixelPosition(this.path[0][0], this.path[0][1])
            this.scene.physics.moveTo(this, nextPoint.x, nextPoint.y, this.#movementSpeed)
            const distance = Phaser.Math.Distance.Between(nextPoint.x, nextPoint.y, this.x, this.y);
            if (distance < 4) {
              this.path.shift()
              if (!this.path.length) {
                this.body.reset(nextPoint.x, nextPoint.y);
                this.stateMachine.set('idle')
              }
            }
          },
          onExit: () => {
            this.path = []
            this.body.setVelocity(0)
          }
        },
        'attack-move': {
          reenter: true,
          onEnter: (target: Enemy) => {
            this.attackTarget = target
          },
          onUpdate: (dt) => {
            if (!this.attackTarget?.active) {
              return
            }
            if (this.#recalculateAttackMoveTimer > 0) {
              this.#recalculateAttackMoveTimer -= dt
            } else {
              this.#recalculateAttackMoveTimer = this.#recalculateAttackMoveTimeInitial
              const withinRange = isWithinRange(this.x, this.y, this.attackTarget.x, this.attackTarget.y, this.#attackRange)
              if (withinRange) {
                this.stateMachine.set('attack-prepare')
              } else {
                this.scene.physics.moveToObject(this, this.attackTarget, this.#movementSpeed);
              }
            }
          },
          onExit: () => {
            this.body.setVelocity(0)
          }
        },
        'attack-prepare': {
          onEnter: () => {
            this.#attackPrepareTimer = this.#attackPrepareTimeInitial
            if (!this.attackTarget?.active) {
              this.stateMachine.set('idle')
            }
          },
          onUpdate: (dt) => {
            if (this.#attackPrepareTimer > 0) {
              this.#attackPrepareTimer -= dt
            } else {
              if (this.attackTarget?.active) {
                const bullet = this.scene.bullets.get(this.x, this.y) as Bullet
                bullet.enable();
                this.scene.physics.moveToObject(bullet, this.attackTarget, bullet.speed);
                this.stateMachine.set('attack-backswing')
              }
            }
          }
        },
        'attack-backswing': {
          onEnter: () => {
            this.#attackBackswingTimer = this.#attackBackswingTimeInitial
          },
          onUpdate: (dt) => {
            if (this.#attackBackswingTimer > 0) {
              this.#attackBackswingTimer -= dt
            } else {
              if (this.attackTarget?.active) {
                const withinRange = isWithinRange(this.x, this.y, this.attackTarget.x, this.attackTarget.y, this.#attackRange)
                if (withinRange) {
                  this.stateMachine.set('attack-prepare')
                } else {
                  this.stateMachine.set('attack-move', this.attackTarget)
                }
              } else {
                this.stateMachine.set('idle')
              }
            }
          }
        },
        cast: {
          // TODO: to be implemented
        },
        dead: {
          // TODO: to be implemented
        }
      }
    })
    this.stateMachine.start()
  }

  preUpdate(time: number, dt: number) {
    super.preUpdate(time, dt)
    this.stateMachine.update(dt)
  }
}
