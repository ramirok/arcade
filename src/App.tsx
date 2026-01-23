import { createStore } from "solid-js/store";
import { useGame } from "./Layout";
import type { MainGame } from "./game/scenes/MainGame";

function App() {

  const gameInstance = useGame()

  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const player = mainGameScene.player

  const [store, setStore] = createStore({
    health: player.data.get('health'),
    maxHealth: player.data.get('maxHealth'),
    xp: player.data.get('xp'),
    xpToNextLVL: player.data.get('xpToNextLVL'),
    mana: player.data.get('mana'),
    maxMana: player.data.get('maxMana')
  })


  const storeKeys = Object.keys(store)

  player.data.events.on('changedata', (_, dataKey, data) => {
    if (storeKeys.includes(dataKey)) {
      setStore(dataKey as keyof typeof store, data)
    }
  })

  return (
    <div
      class="pointer-events-auto absolute bottom-0 w-4/6 h-40 flex items-center pb-4 gap-2 left-1/2 -translate-x-1/2"
    >
      <div
        class="w-14 h-full bg-red-200 border-4 border-red-500 rounded-lg flex items-end"
      >
        <div
          class="bg-red-500 w-full transition-all"
          style={{
            height: `${(store.health * 100) / store.maxHealth}%`
          }}
        ></div>
      </div>
      <div
        class="h-4 w-full bg-blue-200 border-4 border-indigo-500 rounded-lg"
      >
        <div
          class="h-full bg-indigo-500 rounded transition-all"
          style={{
            width: `${(store.xp * 100) / store.xpToNextLVL}%`
          }}
        >
        </div>
      </div>
      <div
        class="w-14 h-full bg-blue-200 border-4 border-blue-500 rounded-lg flex items-end"
      >
        <div
          class="bg-blue-500 w-full h-[40%]"
          style={{
            height: `${(store.mana * 100) / store.maxMana}%`
          }}
        ></div>
      </div>
    </div >
  )
}

export default App
