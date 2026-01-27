import { Show, type ParentComponent } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { BottomBar } from "../components/BottomBar";

export const GameLayout: ParentComponent = (props) => {

  const [searchParams] = useSearchParams<{ debug: string, edit: string }>();


  return <div>
    {props.children}
    <Show when={searchParams.edit !== 'false'}>
      <BottomBar />
    </Show>
  </div>
}
