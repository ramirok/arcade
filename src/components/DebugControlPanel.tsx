import { type Component } from 'solid-js';
import { useGame } from '../layouts/RootLayout';
import type { MainGame } from '../game/scenes/MainGame';
import { createStore } from 'solid-js/store';

type EditableFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isPercentage?: boolean;
};

const EditableField: Component<EditableFieldProps> = (props) => {
  const minVal = 0
  const maxVal = 999
  const formatValue = (val: number): string => {
    return props.isPercentage ? `${(val * 100).toFixed(1)}` : val.toFixed(2);
  };

  const onInputChange = (e: InputEvent) => {
    const input = e.currentTarget as HTMLInputElement;
    let parsedVal = parseFloat(input.value);

    if (props.isPercentage) {
      parsedVal = parsedVal / 100;
    }

    parsedVal = Math.max(minVal, Math.min(maxVal, parsedVal));

    props.onChange(parsedVal);
  };

  return (
    <div class="flex flex-col">
      <label class="text-neutral-700" id={props.label}>{props.label}</label>
      <div class='flex items-center gap-1'>
        <input
          id={props.label}
          type="number"
          min={minVal}
          max={maxVal}
          step={props.isPercentage ? "0.1" : "1"}
          value={formatValue(props.value)}
          onInput={onInputChange}
          class="px-1 py-0.5 border border-gray-200 w-full"
        />
        {props.isPercentage && '%'}
      </div>
    </div>
  );
};

type PropertyGroupProps = {
  title: string;
  children: any;
};

const PropertyGroup: Component<PropertyGroupProps> = (props) => {
  return (
    <div class="bg-white border border-neutral-400 p-4 pt-2">
      <h3 class="font-semibold text-neutral-800 pb-1 border-b border-neutral-400">{props.title}</h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-4">
        {props.children}
      </div>
    </div>
  );
};



export const DebugControlPanel: Component<{ closePanel: () => void }> = (props) => {

  const gameInstance = useGame()
  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const player = mainGameScene.player


  const [playerData, setPlayerData] = createStore(player.data.getAll())

  player.data.events.on('changedata', (_, dataKey, data) => {
    setPlayerData(dataKey, data)
  })

  return (
    <div class="w-96 h-3/4 overflow-y-auto bg-neutral-100 border pointer-events-auto absolute">
      <div class='sticky top-0 bg-neutral-100 p-4 flex items-center justify-between'>
        <div>
          DEBUG CONTROL PANEL
        </div>
        <button
          class='bg-neutral-700 text-white px-2 py-1'
          onClick={props.closePanel}
        >CLOSE
        </button>
      </div>
      <div class='space-y-4 p-4 pt-0'>
        <PropertyGroup title="Base Stats">
          <EditableField
            label="Strength"
            value={playerData.statStrength}
            onChange={(val) => player.data.set('statStrength', val)}
          />
          <EditableField
            label="Agility"
            value={playerData.statAgility}
            onChange={(val) => player.data.set('statAgility', val)}
          />
          <EditableField
            label="Vitality"
            value={playerData.statVitality}
            onChange={(val) => player.data.set('statVitality', val)}
          />
          <EditableField
            label="Energy"
            value={playerData.statEnergy}
            onChange={(val) => player.data.set('statEnergy', val)}
          />
        </PropertyGroup>

        <PropertyGroup title="Offensive Attributes">
          <EditableField
            label="Damage"
            value={playerData.attributeDamage}
            onChange={(val) => player.data.set('attributeDamage', val)}
          />
          <EditableField
            label="Attack Speed"
            value={playerData.attributeAttackSpeed}
            onChange={(val) => player.data.set('attributeAttackSpeed', val)}
          />
          <EditableField
            label="Crit Chance"
            value={playerData.attributeCriticalChance}
            onChange={(val) => player.data.set('attributeCriticalChance', val)}
            isPercentage
          />
          <EditableField
            label="Magic Damage"
            value={playerData.attributeMagicDamage}
            onChange={(val) => player.data.set('attributeMagicDamage', val)}
          />
        </PropertyGroup>

        <PropertyGroup title="Defensive Attributes">
          <EditableField
            label="Evasion"
            value={playerData.attributeEvasion}
            onChange={(val) => player.data.set('attributeEvasion', val)}
            isPercentage
          />
          <EditableField
            label="Defense"
            value={playerData.attributeDefense}
            onChange={(val) => player.data.set('attributeDefense', val)}
          />
          <EditableField
            label="Max Health"
            value={playerData.attributeMaxHealth}
            onChange={(val) => player.data.set('attributeMaxHealth', val)}
          />
          <EditableField
            label="Max Mana"
            value={playerData.attributeMaxMana}
            onChange={(val) => player.data.set('attributeMaxMana', val)}
          />
        </PropertyGroup>

        <PropertyGroup title="Regeneration">
          <EditableField
            label="Health Regen"
            value={playerData.attributeHealthRegen}
            onChange={(val) => player.data.set('attributeHealthRegen', val)}
          />
          <EditableField
            label="Mana Regen"
            value={playerData.attributeManaRegen}
            onChange={(val) => player.data.set('attributeManaRegen', val)}
          />
        </PropertyGroup>

        <PropertyGroup title="Current State">
          <EditableField
            label="Health"
            value={playerData.health}
            onChange={(val) => player.data.set('health', val)}
          />
          <EditableField
            label="Mana"
            value={playerData.mana}
            onChange={(val) => player.data.set('mana', val)}
          />
          <EditableField
            label="Level"
            value={playerData.lvl}
            onChange={(val) => player.data.set('lvl', val)}
          />
          <EditableField
            label="XP"
            value={playerData.xp}
            onChange={(val) => player.data.set('xp', val)}
          />
          <EditableField
            label="XP to Next Level"
            value={playerData.xpToNextLVL}
            onChange={(val) => player.data.set('xpToNextLVL', val)}
          />
          <EditableField
            label="Skill Points"
            value={playerData.skillPoints}
            onChange={(val) => player.data.set('skillPoints', val)}
          />
        </PropertyGroup>
      </div>
    </div>
  );
};
