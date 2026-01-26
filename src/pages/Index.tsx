import { createStore } from "solid-js/store";
import { useGame } from "../Layout";
import type { MainGame } from "../game/scenes/MainGame";
import { CharStats } from "../components/CharStats";
import { Show } from "solid-js";

export const IndexPage = () => {

  const gameInstance = useGame()

  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const player = mainGameScene.player

  const [store, setStore] = createStore({
    health: player.data.get('health'),
    attributeMaxHealth: player.data.get('attributeMaxHealth'),
    xp: player.data.get('xp'),
    xpToNextLVL: player.data.get('xpToNextLVL'),
    mana: player.data.get('mana'),
    attributeMaxMana: player.data.get('attributeMaxMana'),
    chartStatsOpen: false
  })



  player.data.events.on('changedata', (_, dataKey, data) => {
    if (dataKey in store) {
      setStore(dataKey as keyof typeof store, data)
    }
  })
  mainGameScene.data.events.on('changedata-charStatsOpen', (_, data) => {
    setStore('chartStatsOpen', data)
  })

  return (
    <>
      <div
        class="absolute top-0"
      >
        INDEX PAGE
      </div >
    </>
  )
}
