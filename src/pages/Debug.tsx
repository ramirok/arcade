import { DebugControlPanel, type PlayerDataKey } from "../components/DebugControlPanel";
import type { MainGame } from "../game/scenes/MainGame";
import { useGame } from "../Layout";

export const Debug = () => {
  const gameInstance = useGame();
  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame;
  const player = mainGameScene.player;

  const updateData = (key: PlayerDataKey, value: number) => {
    player.data.set(key, value);
  };

  return (
    <div class="h-96 overflow-scroll bg-gray-100 p-8 pointer-events-auto absolute">
      <div class="max-w-7xl mx-auto">
        <DebugControlPanel
          playerData={() => ({
            statStrength: player.data.get('statStrength'),
            statAgility: player.data.get('statAgility'),
            statVitality: player.data.get('statVitality'),
            statEnergy: player.data.get('statEnergy'),
            attributeDamage: player.data.get('attributeDamage'),
            attributeCriticalChance: player.data.get('attributeCriticalChance'),
            attributeAttackSpeed: player.data.get('attributeAttackSpeed'),
            attributeEvasion: player.data.get('attributeEvasion'),
            attributeMaxMana: player.data.get('attributeMaxMana'),
            attributeManaRegen: player.data.get('attributeManaRegen'),
            attributeMagicDamage: player.data.get('attributeMagicDamage'),
            attributeMaxHealth: player.data.get('attributeMaxHealth'),
            attributeHealthRegen: player.data.get('attributeHealthRegen'),
            attributeDefense: player.data.get('attributeDefense'),
            health: player.data.get('health'),
            mana: player.data.get('mana'),
            lvl: player.data.get('lvl'),
            xp: player.data.get('xp'),
            xpToNextLVL: player.data.get('xpToNextLVL'),
            skillPoints: player.data.get('skillPoints'),
          })}
          updateData={updateData}
        />
      </div>
    </div>
  );
}

