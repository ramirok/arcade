export class StateMachine<TStates extends {
  [key: string]: {
    onEnter?: (payload?: any) => void;
    onUpdate?: (dt?: number) => void
    onExit?: () => void;
    reenter?: boolean
  };
}> {
  #current;
  #states;
  #machineName;
  constructor(config: { name: string, initial: keyof TStates; states: TStates }) {
    this.#current = config.initial;
    this.#states = config.states;
    this.#states[config.initial].onEnter?.()
    this.#machineName = config.name
  }
  set<NewState extends keyof TStates>(
    newState: NewState,
    ...payload: Parameters<NonNullable<TStates[NewState]['onEnter']>>[0] extends void
      ? []
      : [payload: Parameters<NonNullable<TStates[NewState]['onEnter']>>[0]]
  ) {
    if (newState === this.#current && !this.#states[newState].reenter) {
      throw new Error(`Already on state "${newState as string}"`)
    }
    this.#states[this.#current].onExit?.()
    console.log(`[${this.#machineName}]: Setting state ${newState as string}`)
    this.#current = newState;
    this.#states[this.#current].onEnter?.(payload[0])
  }
  update(dt?: number) {
    if (!this.#current) {
      return;
    }
    this.#states[this.#current].onUpdate?.(dt)
  }
  getCurrent() {
    return this.#current
  }
}
