<script lang="ts">
  import type { Game } from "phaser";
  import { getContext } from "svelte";
  import type { MainGame } from "../game/scenes/MainGame";
  import { playerData, playerEvents } from "../game/components/Player";

  const gameRef = getContext<{ instance: Game }>("game_ctx");
  const mainGame = gameRef.instance!.scene.getScene("main-game") as MainGame;

  const player = mainGame.player;

  let maxHealth = $state(player.maxHealth);
  let health = $state(player.maxHealth);
  let xp = $state(player.data.get(playerData.xp));
  let xpToNextLVL = $state(player.data.get(playerData.xpToNextLVL));
  let lvl = $state(player.data.get(playerData.lvl));
  let maxMana = $state(player.maxMana);
  let mana = $state(player.data.get(playerData.mana));

  player.on(playerEvents["changedata-health"], () => {
    health = player.data.get(playerData.health);
  });

  player.on(playerEvents["changedata-xp"], () => {
    xp = player.data.get(playerData.xp);
  });

  player.on(playerEvents["changedata-lvl"], () => {
    lvl = player.data.get(playerData.lvl);
  });

  player.on(playerEvents["changedata-xpToNextLVL"], () => {
    xpToNextLVL = player.data.get(playerData.xpToNextLVL);
  });

  player.on(playerEvents["changedata-mana"], () => {
    mana = player.data.get(playerData.mana);
  });
</script>

{#if gameRef.instance}
  <div
    class="pointer-events-auto absolute bottom-0 bg-black left-0 right-0 h-48 flex items-center p-4 gap-2"
  >
    <div class="size-40 bg-neutral-400 shrink-0 rounded-lg"></div>
    <div class="w-full flex flex-col gap-2 h-full">
      <div class="flex w-full gap-2">
        <div
          class="h-10 w-full bg-blue-200 border-4 border-blue-500 rounded-lg"
        >
          <div
            class="h-full bg-blue-500 rounded transition-all"
            style="width: {(xp * 100) / xpToNextLVL}%;"
          ></div>
        </div>
        <div
          class="size-10 bg-blue-400 shrink-0 rounded-lg flex items-center justify-center"
        >
          {lvl}
        </div>
      </div>
      <div class="h-full w-full rounded-lg flex gap-2">
        <div
          class="w-14 h-full bg-red-200 border-4 border-red-500 rounded-lg flex items-end"
        >
          <div
            class="bg-red-500 w-full transition-all"
            style="height: {(health * 100) / maxHealth}%;"
          ></div>
        </div>
        <div class="bg-neutral-400 h-full w-full rounded-lg"></div>
        <div
          class="w-14 h-full bg-blue-200 border-4 border-blue-500 rounded-lg flex items-end"
        >
          <div
            class="bg-blue-500 w-full h-[40%]"
            style="height: {(mana * 100) / maxMana}%;"
          ></div>
        </div>
      </div>
    </div>
    <div class="size-40 bg-neutral-400 shrink-0 rounded-lg"></div>
  </div>
{/if}
