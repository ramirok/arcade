<script module lang="ts">
  import type { Game, Scene } from "phaser";

  export type TPhaserRef = {
    game: Game | null;
    scene: Scene | null;
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { StartGame } from "./main";

  const gameCointainerId = "game-container";
  onMount(() => {
    StartGame(gameCointainerId);
  });
</script>

<div id={gameCointainerId}></div>
