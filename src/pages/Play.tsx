import { useGame } from "../layouts/RootLayout";
import type { MainGame } from "../game/scenes/MainGame";
import { CharStats } from "../components/CharStats";
import { createSignal, Show } from "solid-js";

export const PlayPage = () => {

  const gameInstance = useGame()
  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const [charPanelOpen, setCharPanelOpen] = createSignal(mainGameScene.data.get('charStatsOpen'))

  mainGameScene.data.events.on('changedata-charStatsOpen', (_, data) => {
    setCharPanelOpen(data)
  })

  return (
    <Show when={charPanelOpen()}>
      <CharStats />
    </Show>
  )
}
