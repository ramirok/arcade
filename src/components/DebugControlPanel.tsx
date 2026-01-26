import { type Component } from 'solid-js';
import type { PlayerData } from '../game/components/Player';

type EditableFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isPercentage?: boolean;
};

const EditableField: Component<EditableFieldProps> = (props) => {
  const formatValue = (val: number): string => {
    return props.isPercentage ? `${(val * 100).toFixed(1)}` : val.toFixed(2);
  };

  const onInputChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    let parsedVal = parseFloat(input.value);

    if (props.isPercentage) {
      parsedVal = parsedVal / 100;
    }

    parsedVal = Math.max(0, Math.min(999, parsedVal));

    props.onChange(parsedVal);
  };

  return (
    <div class="flex flex-col">
      <label class="text-sm font-medium text-gray-700">{props.label}</label>
      <input
        type="number"
        min="0"
        max="999"
        step={props.isPercentage ? "0.1" : "0.01"}
        value={formatValue(props.value)}
        onInput={onInputChange}
        class="mt-1 px-2 py-1 border border-gray-300 rounded text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

type PropertyGroupProps = {
  title: string;
  children: any;
};

const PropertyGroup: Component<PropertyGroupProps> = (props) => {
  return (
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="text-lg font-semibold text-gray-800 mb-3">{props.title}</h3>
      <div class="grid grid-cols-2 gap-4">
        {props.children}
      </div>
    </div>
  );
};

export type PlayerDataKey = keyof PlayerData;

type DebugControlPanelProps = {
  playerData: () => PlayerData;
  updateData: (key: PlayerDataKey, value: number) => void;
};

export const DebugControlPanel: Component<DebugControlPanelProps> = (props) => {
  const data = () => props.playerData();

  return (
    <div class="w-full max-w-7xl mx-auto p-6 space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">Player Debug Control Panel</h1>

      <PropertyGroup title="Base Stats">
        <EditableField
          label="Strength"
          value={data().statStrength}
          onChange={(val) => props.updateData('statStrength', val)}
        />
        <EditableField
          label="Agility"
          value={data().statAgility}
          onChange={(val) => props.updateData('statAgility', val)}
        />
        <EditableField
          label="Vitality"
          value={data().statVitality}
          onChange={(val) => props.updateData('statVitality', val)}
        />
        <EditableField
          label="Energy"
          value={data().statEnergy}
          onChange={(val) => props.updateData('statEnergy', val)}
        />
      </PropertyGroup>

      <PropertyGroup title="Offensive Attributes">
        <EditableField
          label="Damage"
          value={data().attributeDamage}
          onChange={(val) => props.updateData('attributeDamage', val)}
        />
        <EditableField
          label="Attack Speed"
          value={data().attributeAttackSpeed}
          onChange={(val) => props.updateData('attributeAttackSpeed', val)}
        />
        <EditableField
          label="Crit Chance"
          value={data().attributeCriticalChance}
          onChange={(val) => props.updateData('attributeCriticalChance', val)}
          isPercentage
        />
        <EditableField
          label="Magic Damage"
          value={data().attributeMagicDamage}
          onChange={(val) => props.updateData('attributeMagicDamage', val)}
        />
      </PropertyGroup>

      <PropertyGroup title="Defensive Attributes">
        <EditableField
          label="Evasion"
          value={data().attributeEvasion}
          onChange={(val) => props.updateData('attributeEvasion', val)}
          isPercentage
        />
        <EditableField
          label="Defense"
          value={data().attributeDefense}
          onChange={(val) => props.updateData('attributeDefense', val)}
        />
        <EditableField
          label="Max Health"
          value={data().attributeMaxHealth}
          onChange={(val) => props.updateData('attributeMaxHealth', val)}
        />
        <EditableField
          label="Max Mana"
          value={data().attributeMaxMana}
          onChange={(val) => props.updateData('attributeMaxMana', val)}
        />
      </PropertyGroup>

      <PropertyGroup title="Regeneration">
        <EditableField
          label="Health Regen"
          value={data().attributeHealthRegen}
          onChange={(val) => props.updateData('attributeHealthRegen', val)}
        />
        <EditableField
          label="Mana Regen"
          value={data().attributeManaRegen}
          onChange={(val) => props.updateData('attributeManaRegen', val)}
        />
      </PropertyGroup>

      <PropertyGroup title="Current State">
        <EditableField
          label="Health"
          value={data().health}
          onChange={(val) => props.updateData('health', val)}
        />
        <EditableField
          label="Mana"
          value={data().mana}
          onChange={(val) => props.updateData('mana', val)}
        />
        <EditableField
          label="Level"
          value={data().lvl}
          onChange={(val) => props.updateData('lvl', val)}
        />
        <EditableField
          label="XP"
          value={data().xp}
          onChange={(val) => props.updateData('xp', val)}
        />
        <EditableField
          label="XP to Next Level"
          value={data().xpToNextLVL}
          onChange={(val) => props.updateData('xpToNextLVL', val)}
        />
        <EditableField
          label="Skill Points"
          value={data().skillPoints}
          onChange={(val) => props.updateData('skillPoints', val)}
        />
      </PropertyGroup>
    </div>
  );
};