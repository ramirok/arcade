<script lang="ts">
  import "./layout.css";
  import { onMount, setContext } from "svelte";
  import { StartGame } from "../game/main";
  import { Game } from "phaser";

  let { children } = $props();

  let gameRef = $state<{ instance: Game | null }>({ instance: null });

  const gameCointainerId = "game-container";

  setContext("game_ctx", gameRef);

  onMount(() => {
    const game = StartGame(gameCointainerId);
    game.events.on("main-scene-ready", () => {
      gameRef.instance = game;
    });
  });
</script>

<div
  id="app"
  class="relative w-screen h-screen flex items-center justify-center"
>
  <div id={gameCointainerId}></div>
  {#if gameRef.instance}
    <div class="absolute inset-0 pointer-events-none">
      {@render children()}
    </div>
  {/if}
</div>
