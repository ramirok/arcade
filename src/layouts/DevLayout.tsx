import { useSearchParams } from "@solidjs/router";
import { Show, type ParentComponent } from "solid-js"
import { DebugControlPanel } from "../components/DebugControlPanel";

export const DevLayout: ParentComponent = (props) => {

  const [searchParams, setSearchParams] = useSearchParams<{ debug: string, edit: string }>();

  return <>
    {props.children}
    <Show when={searchParams.debug === 'true'}>
      <DebugControlPanel closePanel={() => setSearchParams({ debug: false })} />
    </Show>
  </>
}
