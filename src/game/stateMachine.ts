
export class StateMachine<
  TStates extends {
    [key: string]: {
      onEnter?: (payload?: any) => void;
      onUpdate?: ((dt: number) => void) | (() => void);
      onExit?: () => void;
      reenter?: boolean
    };
  },
  InitialState extends keyof TStates
> {
  #current: keyof TStates | undefined;
  #initialState;
  #states;
  #machineName;
  #debug
  constructor(config: { name: string, initial: InitialState, states: TStates, debug?: boolean }) {
    this.#debug = config.debug
    this.#initialState = config.initial
    // this.#current = config.initial as keyof TStates;
    this.#states = config.states;
    // this.#states[config.initial].onEnter?.()
    this.#machineName = config.name
  }
  set<NewState extends keyof TStates>(
    newState: NewState,
    ...payload: Parameters<NonNullable<TStates[NewState]['onEnter']>>[0] extends void
      ? []
      : [payload: Parameters<NonNullable<TStates[NewState]['onEnter']>>[0]]
  ) {
    if (!this.#current) {
      throw new Error(`[${this.#machineName}] not started yet`)
    }
    if (newState === this.#current && !this.#states[newState].reenter) {
      throw new Error(`[${this.#machineName}] Already on state "${newState as string}"`)
    }
    this.#states[this.#current].onExit?.()
    if (this.#debug) {
      console.log(`[${this.#machineName}]: Setting state ${newState as string}`)
    }
    this.#current = newState;
    this.#states[this.#current].onEnter?.(payload[0])
  }
  update(dt?: number) {
    if (!this.#current) {
      throw new Error(`[${this.#machineName}] not started yet`)
    }
    const onUpdate = this.#states[this.#current].onUpdate;
    if (!onUpdate) return;
    if (dt !== undefined) {
      onUpdate(dt);
    } else {
      (onUpdate as () => void)();
    }
  }
  getCurrent() {
    if (!this.#current) {
      throw new Error(`[${this.#machineName}] not started yet`)
    }
    return this.#current
  }
  is(state: keyof TStates): boolean {
    return this.#current === state;
  }
  start(
    ...payload: Parameters<NonNullable<TStates[InitialState]['onEnter']>>[0] extends void
      ? []
      : [payload: Parameters<NonNullable<TStates[InitialState]['onEnter']>>[0]]
  ) {
    this.#current = this.#initialState
    if (this.#debug) {
      console.log(`[${this.#machineName}]: Starting machine at ${this.#initialState as string}`);
    }
    this.#states[this.#initialState].onEnter?.(payload[0]);
  }
  reset(
    ...payload: Parameters<NonNullable<TStates[InitialState]['onEnter']>>[0] extends void
      ? []
      : [payload: Parameters<NonNullable<TStates[InitialState]['onEnter']>>[0]]
  ) {
    if (!this.#current) {
      throw new Error(`[${this.#machineName}] not started yet`)
    }
    this.#states[this.#current].onExit?.();
    this.#current = this.#initialState as keyof TStates;
    this.#states[this.#current].onEnter?.(payload[0]);
  }
}
