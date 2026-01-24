import { createSignal, For, Show, type Component } from "solid-js";
import { useGame } from "../Layout";
import type { MainGame } from "../game/scenes/MainGame";
import { createStore } from "solid-js/store";
import type { PlayerData } from "../game/components/Player";

type Stats = Pick<PlayerData, 'statAgility' | 'statEnergy' | 'statVitality' | 'statStrength'>
type Attributes = Pick<PlayerData,
  'attributeAttackSpeed' |
  'attributeCriticalChance' |
  'attributeDamage' |
  'attributeEvasion' |
  'attributeHealthRegen' |
  'attributeMagicDamage' |
  'attributeManaRegen' |
  'attributeMaxHealth' |
  'attributeMaxMana' |
  'attributeDefense'
>

type RowProps = {
  statName: keyof Stats,
  showPlusButton: boolean,
  value: number
  attributes: {
    attribute: keyof Attributes
    val: number
  }[]
}
const Row: Component<RowProps> = (props) => {
  const gameInstance = useGame()
  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const player = mainGameScene.player

  return <div >
    <div>
      {props.statName.substring(4)}: {props.value}
      <Show when={props.showPlusButton}>
        <button onClick={() => {
          player.data.inc('skillPoints', -1)
          player.data.inc(props.statName, 1)
          switch (props.statName) {
            case 'statStrength': {
              player.data.set('attributeDamage', player.data.get('attributeDamage') * 1.2)
              player.data.inc('attributeCriticalChance', + 0.001)
              break
            }
            case 'statAgility': {
              player.data.set('attributeAttackSpeed', player.data.get('attributeAttackSpeed') * 1.2)
              player.data.inc('attributeEvasion', + 0.001)
              break
            }
            case 'statEnergy': {
              player.data.inc('attributeManaRegen', 1)
              player.data.set('attributeMagicDamage', player.data.get('attributeMagicDamage') * 1.3)
              player.data.set('attributeMaxMana', player.data.get('attributeMaxMana') * 1.15)
              break
            }
            case 'statVitality': {
              player.data.inc('attributeHealthRegen', 1)
              player.data.set('attributeDefense', player.data.get('attributeDefense') * 1.2)
              player.data.set('attributeMaxHealth', player.data.get('attributeMaxHealth') * 1.15)
            }
          }
        }}>
          +
        </button>
      </Show>
    </div>
    {<For each={props.attributes}>
      {(attribute) =>
        <div>
          {attribute.attribute.substring(9)}: {attribute.val}
        </div>
      }

    </For>}
  </div>
}

export const CharStats: Component = () => {
  const gameInstance = useGame()
  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const player = mainGameScene.player

  const [stats, setStats] = createStore<Stats>({
    statStrength: player.data.get('statStrength'),
    statAgility: player.data.get('statAgility'),
    statVitality: player.data.get('statVitality'),
    statEnergy: player.data.get('statEnergy'),
  })
  const [attributes, setAttributes] = createStore<Attributes>({
    attributeAttackSpeed: player.data.get('attributeAttackSpeed'),
    attributeCriticalChance: player.data.get('attributeCriticalChance'),
    attributeDamage: player.data.get('attributeDamage'),
    attributeEvasion: player.data.get('attributeEvasion'),
    attributeHealthRegen: player.data.get('attributeHealthRegen'),
    attributeMagicDamage: player.data.get('attributeMagicDamage'),
    attributeManaRegen: player.data.get('attributeManaRegen'),
    attributeMaxHealth: player.data.get('attributeMaxHealth'),
    attributeMaxMana: player.data.get('attributeMaxMana'),
    attributeDefense: player.data.get('attributeDefense'),
  })
  const [skillPoints, setSkillPoints] = createSignal(player.data.get('skillPoints'))

  player.data.events.on('changedata', (_, dataKey, data) => {
    if (dataKey === 'skillPoints') {
      setSkillPoints(data)
    } else if (dataKey in stats) {
      setStats(dataKey as keyof Stats, data)
    } else if (dataKey in attributes) {
      setAttributes(dataKey as keyof Attributes, data)
    }
  })

  return <div class="pointer-events-auto absolute bg-neutral-400 left-10 md:left-auto md:w-96 h-[70%] right-10 top-10 rounded-lg flex flex-col gap-4">
    <Row
      statName='statStrength'
      value={stats.statStrength}
      showPlusButton={Boolean(skillPoints())}
      attributes={[
        {
          attribute: 'attributeDamage',
          val: attributes.attributeDamage,
        },
        {
          attribute: 'attributeCriticalChance',
          val: +(attributes.attributeCriticalChance * 100).toFixed(2),
        }
      ]} />
    <Row
      statName='statAgility'
      value={stats.statAgility}
      showPlusButton={Boolean(skillPoints())}
      attributes={[
        {
          attribute: 'attributeAttackSpeed',
          val: attributes.attributeAttackSpeed,
        },
        {
          attribute: 'attributeEvasion',
          val: +(attributes.attributeEvasion * 100).toFixed(2),
        }
      ]}
    />
    <Row
      statName='statEnergy'
      value={stats.statEnergy}
      showPlusButton={Boolean(skillPoints())}
      attributes={[
        { attribute: 'attributeManaRegen', val: attributes.attributeManaRegen },
        { attribute: 'attributeMagicDamage', val: attributes.attributeMagicDamage }
      ]}
    />
    <Row
      statName='statVitality'
      value={stats.statVitality}
      showPlusButton={Boolean(skillPoints())}
      attributes={[
        { attribute: 'attributeHealthRegen', val: attributes.attributeHealthRegen },
        { attribute: 'attributeDefense', val: attributes.attributeDefense }
      ]}
    />
  </div>
}
