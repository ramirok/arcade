<script lang="ts">
  import "./layout.css";
  import PhaserGame from "../game/PhaserGame.svelte";

  let { children } = $props();
</script>

<div
  id="app"
  class="relative w-screen h-screen flex items-center justify-center"
>
  <PhaserGame />
  <div class="absolute inset-0 pointer-events-none">
    {@render children()}
  </div>
</div>
