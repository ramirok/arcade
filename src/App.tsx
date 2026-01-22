import { useGame } from "./Layout";
import type { MainGame } from "./game/scenes/MainGame";

function App() {

  const gameInstance = useGame()

  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const player = mainGameScene.player
  return (
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
              style={{
                width: `${(player.context.xp * 100) / player.context.xpToNextLVL}%`
              }}
            ></div>
          </div>
          <div
            class="size-10 bg-blue-400 shrink-0 rounded-lg flex items-center justify-center"
          >
            {player.context.lvl}
          </div>
        </div>
        <div class="h-full w-full rounded-lg flex gap-2">
          <div
            class="w-14 h-full bg-red-200 border-4 border-red-500 rounded-lg flex items-end"
          >
            <div
              class="bg-red-500 w-full transition-all"
              style={{
                height: `${(player.context.health * 100) / player.context.maxHealth}%`
              }}
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
    </div >
  )
}

export default App
