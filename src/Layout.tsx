import { createSignal, onMount, Show, useContext, type Accessor, type ParentComponent } from 'solid-js'
import { createContext } from "solid-js";
import { StartGame } from './game/main';
import type { Game } from 'phaser';


export const GameContext = createContext<Accessor<Game | null>>();
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context as Accessor<Game>;
}

const Layout: ParentComponent = (props) => {

  const gameCointainerId = "game-container";
  const [gameRef, setGameRef] = createSignal<Game | null>(null);

  onMount(() => {
    const game = StartGame(gameCointainerId);
    game.events.on("main-scene-ready", () => {
      setGameRef(game)
    });
  })

  return (
    <GameContext.Provider value={gameRef}>
      <div
        id="app"
        class="relative w-screen h-screen flex items-center justify-center"
      >
        <div id={gameCointainerId}></div>
        <Show when={gameRef()}>
          <div class="absolute inset-0 pointer-events-none">
            {props.children}
          </div>
        </Show>
      </div>
    </GameContext.Provider>
  )
}

export default Layout
