import type { MainGame } from "../scenes/MainGame";
import { StateMachine } from "../stateMachine";
import type { Castle } from "./Castle";
import type { Player, PlayerData } from "./Player";
import type { Bullet } from "./Bullet";
import { HealthBar } from "./HealthBar";
import { AbsorptionBar } from "./AbsorptionBar";
import { FloatingText } from "./UIComponents";
import { isWithinRange, type DataOverride } from "../utils";
import { Physics, Math as PhaserMath, Utils } from "phaser";


export interface EnemyConfig {
  maxHealth: number;
  damage: number;
  attackRange: number;
  chaseRange: number;
  movementSpeed: number;
  attackPrepareTime: number;
  attackBackswingTime: number;
  recalculateAttackMoveTime: number;
  xpValue: number;
  maxMana: number;
}

type EnemyData = {
  health: number
  maxHealth: number
  damage: number
}

type AttackTarget = Player | Castle | null
export class Enemy extends Physics.Arcade.Sprite {
  declare body: Physics.Arcade.Body;
  declare scene: MainGame;
  declare data: DataOverride<Enemy, EnemyData>
  id = crypto.randomUUID()
  stateMachine
  #attackTarget: AttackTarget = null
  #attackPrepareTimeInitial = 500
  #attackPrepareTimer = 500
  #recalculateAttackMoveTimeInitial = 200
  #recalculateAttackMoveTimer = 0
  #attackRange = 200
  #attackBackswingTimeInitial = 500
  #attackBackswingTimer = 500
  #movementSpeed = 100
  #chaseRange = 400
  #xpValue = 1
  // #maxMana = 0
  // #mana = 0
  #healthBar
  #absorptionBar
  #corpseStartTime = 0
  #absorptionTimeInitial = 3000
  #absorptionTimer = 3000
  #absorptionRange = 80
  #corpseLifetime = 120000
  #absorbingFirstTime = true

  constructor(scene: MainGame, x: number, y: number, texture: string, config: EnemyConfig) {
    super(scene, x, y, texture);

    this.setDataEnabled()
    this.data.set('health', config.maxHealth)
    this.data.set('maxHealth', config.maxHealth)
    this.data.set('damage', config.damage)

    this.#attackRange = config.attackRange;
    this.#chaseRange = config.chaseRange;
    this.#movementSpeed = config.movementSpeed;
    this.#attackPrepareTimeInitial = config.attackPrepareTime;
    this.#attackBackswingTimeInitial = config.attackBackswingTime;
    this.#recalculateAttackMoveTimeInitial = config.recalculateAttackMoveTime;
    this.#xpValue = config.xpValue;
    // this.#maxMana = config.maxMana;
    // this.#mana = config.maxMana;

    this.#healthBar = new HealthBar(this);
    this.#absorptionBar = new AbsorptionBar(this, this.#absorptionTimeInitial)
    this.setInteractive()
    this.scene.physics.add.existing(this)

    this.stateMachine = new StateMachine({
      // debug: true,
      name: 'EnemyMachine',
      initial: 'idle',
      states: {
        idle: {
          onEnter: () => {
            this.#attackTarget = null
          },
          onUpdate: () => {
            const attackTargets = [this.scene.player, this.scene.castle];
            let closestTarget: NonNullable<AttackTarget> = this.scene.castle;
            let shortestDistance = Infinity;
            for (const possibleTarget of attackTargets) {
              const dist = PhaserMath.Distance.Between(this.x, this.y, possibleTarget.x, possibleTarget.y);
              if (dist < shortestDistance) {
                shortestDistance = dist;
                closestTarget = possibleTarget;
              }
            }
            this.#attackTarget = closestTarget;
            if (shortestDistance <= this.#attackRange) {
              this.stateMachine.set('attack-prepare');
            } else if (shortestDistance <= this.#chaseRange) {
              this.stateMachine.set('attack-move', closestTarget);
            } else {
              this.scene.physics.moveToObject(this, this.scene.castle, this.#movementSpeed);
            }
          }
        },
        // move: {
        //   // TODO: to be implemented
        // },
        'attack-move': {
          reenter: true,
          onEnter: (target: Player | Castle) => {
            this.#attackTarget = target
          },
          onUpdate: (dt) => {
            if (!this.#attackTarget?.active) {
              return
            }
            if (this.#recalculateAttackMoveTimer > 0) {
              this.#recalculateAttackMoveTimer -= dt
            } else {
              this.#recalculateAttackMoveTimer = this.#recalculateAttackMoveTimeInitial
              const distanceToTarget = PhaserMath.Distance.Between(this.x, this.y, this.#attackTarget.x, this.#attackTarget.y)
              if (distanceToTarget < this.#attackRange) {
                this.stateMachine.set('attack-prepare')
              } else if (distanceToTarget < this.#chaseRange) {
                this.scene.physics.moveToObject(this, this.#attackTarget, this.#movementSpeed);
              } else {
                this.stateMachine.set('idle')
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
          },
          onUpdate: (dt) => {
            if (this.#attackPrepareTimer > 0) {
              this.#attackPrepareTimer -= dt
            } else {
              if (this.#attackTarget?.active) {
                const bullet = this.scene.bullets.get(this.x, this.y) as Bullet
                bullet.ownerEntity = this
                bullet.enable();
                this.scene.physics.moveToObject(bullet, this.#attackTarget, bullet.speed);
                this.stateMachine.set('attack-backswing')
              } else {
                this.stateMachine.set('idle')
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
              if (this.#attackTarget?.active) {
                const withinRange = isWithinRange(this.x, this.y, this.#attackTarget.x, this.#attackTarget.y, this.#attackRange)
                if (withinRange) {
                  this.stateMachine.set('attack-prepare')
                } else {
                  this.stateMachine.set('attack-move', this.#attackTarget)
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
        corpse: {
          onEnter: () => {
            this.scene.player.gainXP(this.#xpValue);
            this.#corpseStartTime = this.scene.time.now;
            this.setTint(0xCCCCCC)
            this.#absorptionBar.enable();
          },
          onUpdate: (dt) => {
            const timeSinceDeath = this.scene.time.now - this.#corpseStartTime;
            if (timeSinceDeath > this.#corpseLifetime) {
              this.stateMachine.set('dead')
            } else {
              const distToPlayer = PhaserMath.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y)
              if (distToPlayer < this.#absorptionRange) {
                if (this.#absorptionTimer > 0) {
                  this.#absorptionTimer -= dt
                  this.#absorptionBar.updateProgress(this.#absorptionTimer, this.#absorptionTimeInitial)
                  if (!this.#absorptionBar.data.get('absorbing')) {
                    this.#absorptionBar.data.set('absorbing', true)
                  }
                } else {
                  const attributesObj = this.scene.player.data.query(/attribute/)
                  const attributesKeys = Object.keys(attributesObj)
                  const randomAttribute = Utils.Array.GetRandom(attributesKeys)
                  const boostAmount = 1;
                  this.scene.player.data.inc(randomAttribute as keyof PlayerData, boostAmount);
                  const attributeName = randomAttribute.replace('attribute', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
                  new FloatingText(this.scene, this.scene.player.x, this.scene.player.y, `+1 ${attributeName}`);
                  this.stateMachine.set('dead')
                }
              } else {
                if (this.#absorbingFirstTime) {
                  this.#absorptionTimer = this.#absorptionTimeInitial
                  this.#absorbingFirstTime = false
                }
                if (this.#absorptionTimer <= this.#absorptionTimeInitial) {
                  this.#absorptionTimer += dt
                  this.#absorptionBar.updateProgress(this.#absorptionTimer, this.#absorptionTimeInitial)
                }
                if (this.#absorptionBar.data.get('absorbing')) {
                  this.#absorptionBar.data.set('absorbing', false)
                }
              }
            }
          },
          onExit: () => {
            this.clearTint();
            this.#absorptionBar.disable();
          }
        },
        dead: {
          onEnter: () => {
            this.body.setEnable(false);
            this.scene.tweens.add({
              targets: this,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                this.disable();
              }
            });
          }
        }
      }
    })

    this.stateMachine.start()
  }

  preUpdate(time: number, dt: number) {
    super.preUpdate(time, dt)
    this.stateMachine.update(dt)
  }


  disable() {
    this.setActive(false);
    this.setVisible(false)
    this.#healthBar.disable();
    this.#absorptionBar.disable();
  }

  enable() {
    this.setActive(true);
    this.setVisible(true)
    this.setAlpha(1)
    this.body.setEnable(true)
    this.data.set('health', this.data.get('maxHealth'))
    // this.#mana = this.#maxMana
    this.stateMachine.reset()
    this.#healthBar.enable();
    this.#absorptionTimer = 0;
    this.#absorbingFirstTime = true
  }

  takeDamage(amount: number) {
    const criticalChange = this.scene.player.data.get('attributeCriticalChance')
    const isCritical = Math.random() < criticalChange
    const damageAmount = isCritical ? amount * 2 : amount
    this.data.inc('health', -damageAmount)
    this.setTint(0xff0000);
    if (this.data.get('health') <= 0) {
      this.stateMachine.set('corpse');
    } else if (this.#attackTarget === this.scene.castle) {
      this.scene.tweens.add({
        targets: this,
        duration: 150,
        onComplete: () => this.clearTint()
      });
      this.stateMachine.set('attack-move', this.scene.player);
    }
  }
}


export class Slime extends Enemy {
  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'slime', {
      maxHealth: 1,
      damage: 3,
      attackRange: 200,
      chaseRange: 400,
      movementSpeed: 100,
      attackPrepareTime: 500,
      attackBackswingTime: 500,
      recalculateAttackMoveTime: 200,
      xpValue: 1,
      maxMana: 5
    })

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('slime'),
      frameRate: 8,
      repeat: -1,
      randomFrame: true,
    });
    this.play('idle');
  }
}
