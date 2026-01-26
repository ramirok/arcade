import { For, type Component } from 'solid-js';
import { useGame } from '../layouts/RootLayout';
import type { MainGame } from '../game/scenes/MainGame';
import { createStore } from 'solid-js/store';
import { debounce, type Scheduled } from '@solid-primitives/scheduled';
import { PLAYER_DATA, type PlayerData, type Units } from '../game/components/Player';

type EditableFieldProps = {
  dataKey: keyof PlayerData
  label: string;
  value: number;
  onChange: Scheduled<[dataKey: keyof PlayerData, val: number]>;
  unit: Units
};

const EditableField: Component<EditableFieldProps> = (props) => {
  const minVal = 0
  const maxVal = 999
  const formatValue = (val: number): string => {
    return props.unit === 'percentage' ? `${(val * 100).toFixed(1)}` : val.toFixed(2);
  };

  const onInputChange = (e: InputEvent) => {
    const input = e.currentTarget as HTMLInputElement;
    let parsedVal = parseFloat(input.value);

    if (props.unit === 'percentage') {
      parsedVal = parsedVal / 100;
    }

    parsedVal = Math.max(minVal, Math.min(maxVal, parsedVal));

    props.onChange(props.dataKey, parsedVal);
  };

  return (
    <div class="flex flex-col">
      <label class="text-neutral-700" id={props.label}>{props.label}</label>
      <div class='flex items-center gap-1'>
        <input
          id={props.label}
          type="number"
          min={minVal}
          max={maxVal}
          step={props.unit === 'percentage' ? "0.1" : "1"}
          value={formatValue(props.value)}
          onInput={onInputChange}
          class="px-1 py-0.5 border border-gray-200 w-full"
        />
        {props.unit === 'percentage' && '%'}
      </div>
    </div>
  );
};

type PropertyGroupProps = {
  title: string;
  children: any;
};

const PropertyGroup: Component<PropertyGroupProps> = (props) => {
  return (
    <div class="bg-white border border-neutral-400 p-4 pt-2">
      <h3 class="font-semibold text-neutral-800 pb-1 border-b border-neutral-400">{props.title}</h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-4">
        {props.children}
      </div>
    </div>
  );
};



export const DebugControlPanel: Component<{ closePanel: () => void }> = (props) => {

  const gameInstance = useGame()
  const mainGameScene = gameInstance().scene.getScene('main-game') as MainGame
  const player = mainGameScene.player

  const [playerData, setPlayerData] = createStore(player.data.getAll())

  let panelRef: HTMLDivElement | undefined

  let isDragging = false
  let dragOffset = { x: 0, y: 0 }

  const startDrag = (e: MouseEvent) => {
    if (!panelRef) return
    isDragging = true
    dragOffset.x = e.clientX - panelRef.offsetLeft
    dragOffset.y = e.clientY - panelRef.offsetTop
  }

  const onDrag = (e: MouseEvent) => {
    if (isDragging && panelRef) {
      const x = e.clientX - dragOffset.x
      const y = e.clientY - dragOffset.y
      const maxX = window.innerWidth - panelRef.offsetWidth
      const maxY = window.innerHeight - panelRef.offsetHeight
      panelRef.style.left = `${Math.min(Math.max(0, x), maxX)}px`
      panelRef.style.top = `${Math.min(Math.max(0, y), maxY)}px`
    }
  }

  const endDrag = () => {
    isDragging = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)
  }

  const onMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') return
    startDrag(e)
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', endDrag)
  }

  player.data.events.on('changedata', (_, dataKey, data) => {
    setPlayerData(dataKey, data)
  })

  const debouncedHandleChange = debounce((dataKey: keyof typeof playerData, val: number) => {
    player.data.set(dataKey, val)
  }, 300)

  const statKeys = Object.keys(PLAYER_DATA.baseStats) as (keyof typeof PLAYER_DATA.baseStats)[]
  const attributeKeys = Object.keys(PLAYER_DATA.attributes) as (keyof typeof PLAYER_DATA.attributes)[]
  const currentStateKeys = Object.keys(PLAYER_DATA.currentState) as (keyof typeof PLAYER_DATA.currentState)[]
  return (
    <div
      ref={panelRef}
      onmousedown={onMouseDown}
      class="w-96 h-3/4 overflow-y-auto bg-neutral-100 border pointer-events-auto absolute top-6 left-6"
    >
      <div class='sticky top-0 bg-neutral-100 p-4 flex items-center justify-between cursor-move'>
        <div class='flex items-center'>
          DEBUG CONTROL PANEL
        </div>
        <button
          class='bg-neutral-700 text-white px-2 py-1'
          onClick={props.closePanel}
        >CLOSE
        </button>
      </div>
      <div class='space-y-4 p-4 pt-0'>
        <PropertyGroup title="Base Stats">
          <For each={statKeys}>
            {(key) => {
              return <EditableField
                dataKey={key}
                label={PLAYER_DATA.baseStats[key].label}
                value={playerData[key]}
                onChange={debouncedHandleChange}
                unit={PLAYER_DATA.baseStats[key].unit}
              />
            }}
          </For>
        </PropertyGroup>

        <PropertyGroup title="Attributes">
          <For each={attributeKeys}>
            {(key) => {
              return <EditableField
                dataKey={key}
                label={PLAYER_DATA.attributes[key].label}
                value={playerData[key]}
                onChange={debouncedHandleChange}
                unit={PLAYER_DATA.attributes[key].unit}
              />
            }}
          </For>
        </PropertyGroup>

        <PropertyGroup title="Current State">
          <For each={currentStateKeys}>
            {(key) => {
              return <EditableField
                dataKey={key}
                label={PLAYER_DATA.currentState[key].label}
                value={playerData[key]}
                onChange={debouncedHandleChange}
                unit={PLAYER_DATA.currentState[key].unit}
              />
            }}
          </For>
        </PropertyGroup>
      </div>
    </div>
  );
};
