import { A, useLocation, useSearchParams } from "@solidjs/router"
import { Show } from "solid-js";

export const NavBar = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams<{ debug: string, edit: string }>();

  const getClasses = (active: boolean) => `${active ? 'bg-black text-white' : 'hover:bg-neutral-400 transition-all'} px-2 py-1`


  return <div class="absolute pointer-events-auto top-4 left-4">
    <div class="flex gap-1 bg-neutral-200 p-1 border">
      <A href="/" end class={getClasses(location.pathname === '/')}>HOME</A>
      <A href="/play" end class={getClasses(location.pathname === '/play')}>GAME</A>
      <A href="/playground" end class={getClasses(location.pathname === '/playground')}>PLAYGROUND</A >
    </div>

    <Show when={location.pathname === '/play' || location.pathname === '/playground'}>
      <div class="flex items-center gap-1 bg-neutral-200 px-2 py-1 mt-2 w-min border">
        <label for='debug'>debug</label>
        <input
          id='debug'
          type="checkbox"
          checked={searchParams.debug === 'true'}
          onChange={(event) => {
            setSearchParams({
              debug: event.target.checked.toString()
            })

          }} />
      </div>
    </Show>
  </div>
}
