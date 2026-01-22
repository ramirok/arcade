# AGENTS.md - Arcade Roguelike Development Guide

## Project Overview

TypeScript-based arcade roguelike game using SolidJS for UI layer and Phaser 3 for game engine. Built with Vite, TailwindCSS v4, and strict TypeScript configuration.

## Build Commands

```bash
npm run dev          # Start Vite dev server at http://localhost:5173
npm run build        # Run TypeScript compiler (tsc -b) then Vite production build to dist/
npm run preview      # Preview the production build locally
```

## Code Style Guidelines

### Imports

- Use `import type` for type-only imports to preserve tree-shaking
- Group imports: external libs first, then relative paths
- Use named imports from Phaser: `import { Scene, Physics, Math as PhaserMath } from "phaser"`

```typescript
import type { MainGame } from "../scenes/MainGame";
import { StateMachine } from "../stateMachine";
import { getPixelPosition } from "../utils";
import { Math as PhaserMath, Physics } from "phaser";
```

### Naming Conventions

- **Classes/PascalCase**: `Player`, `MainGame`, `StateMachine`
- **Constants/UPPER_SNAKE_CASE**: `WORLD_WIDTH`, `GRID_CELL_SIZE`, `GRID_HEIGHT`
- **Private fields/#prefix**: `#movementSpeed`, `#attackRange`, `#currentState`
- **Functions/camelCase**: `getPixelPosition()`, `takeDamage()`, `enable()`
- **Type aliases/PascalCase**: `EventMap`, `GameConfig`

### TypeScript Strict Mode Rules

- `noUnusedLocals: true` - Remove unused variables immediately
- `noUnusedParameters: true` - Remove unused function parameters
- `noFallthroughCasesInSwitch: true` - Always use break or return
- `strict: true` - Enable all strict type-checking options
- Declare class properties with `declare` when extending Phaser classes

```typescript
export class Player extends Physics.Arcade.Sprite {
  declare scene: MainGame
  declare body: Physics.Arcade.Body;
```

### Formatting

- Use semicolons at statement ends
- Prefer arrow functions for callbacks
- Use ternary operators for simple conditionals
- Avoid verbose comments; code should be self-documenting
- Keep functions focused (under 50 lines ideal)

### State Management

**SolidJS Stores**: Use `createStore` for reactive entity data

```typescript
const [context, setContext] = createStore({
  maxHealth: 100,
  health: 100,
  lvl: 1,
  xp: 0,
});
this.context = context;
this.setContext = setContext;
```

**StateMachine Pattern**: Use provided `StateMachine` class for entity behavior

```typescript
this.stateMachine = new StateMachine({
  name: 'PlayerMachine',
  initial: 'idle',
  states: {
    idle: {
      onEnter: () => { /* ... */ },
      onUpdate: () => { /* ... */ }
    }
  }
});
this.stateMachine.start();
```

### Error Handling

- Throw descriptive errors with context: `throw new Error(\`[StateMachine] Already in state "\${state}"\`)`
- Use optional chaining and nullish coalescing for defensive access
- Validate state before operations in state machine transitions
- Handle null/undefined cases explicitly (avoid bare `||` fallbacks)

```typescript
if (newState === this.#current && !this.#states[newState].reenter) {
  throw new Error(`[${this.#machineName}] Already on state "${newState as string}"`)
}
```

### Game Architecture Patterns

**Phaser Scenes**: Bootloader → MainGame → PauseScreen/GameOver overlays

```typescript
export class MainGame extends Scene {
  player!: Player;
  bullets!: Physics.Arcade.Group;
  enemies!: Physics.Arcade.Group;
```

**Entity Components**: Extend Phaser physics sprites for game entities

```typescript
export class Player extends Physics.Arcade.Sprite {
  stateMachine: StateMachine;
  path: number[][] = [];
  #movementSpeed = 200;
```

**Physics Groups**: Use object pooling with Phaser groups

```typescript
this.bullets = this.physics.add.group({
  classType: Bullet,
  collideWorldBounds: true
});
```

### Styling

- Use TailwindCSS v4 utility classes exclusively
- Avoid custom CSS files; prefer Tailwind classes
- Use inline styles for dynamic values only

```tsx
<div class="pointer-events-auto absolute bottom-0 bg-black h-48 flex items-center p-4 gap-2">
  <div class="size-40 bg-neutral-400 shrink-0 rounded-lg"></div>
</div>
```

### File Organization

```
src/
├── game/
│   ├── main.ts           # Phaser game config, StartGame function
│   ├── stateMachine.ts   # Generic StateMachine class
│   ├── utils.ts          # Shared utility functions
│   └── components/       # Game entities (Player, Enemy, Bullet, etc.)
│   └── scenes/           # Phaser scenes (Bootloader, MainGame, etc.)
├── App.tsx               # UI overlay (HUD) using SolidJS
├── Layout.tsx            # Game container, GameContext provider
└── index.tsx             # App entry point
```

### Development Workflow

1. Run `npm run dev` for hot-reload development
2. Type checking runs automatically via `tsc -b` during build
3. No lint or test framework currently configured (consider adding ESLint + Vitest)
4. TailwindCSS v4 via `@tailwindcss/vite` plugin requires no additional config
5. Phaser physics: zero gravity, arcade physics enabled

### Common Patterns

**Grid-based pathfinding**:
```typescript
import PF from 'pathfinding'
const grid = new PF.Grid(GRID_WIDTH, GRID_HEIGHT);
const path = finder.findPath(startX, startY, endX, endY, grid.clone());
```

**Chunk-based background rendering**:
```typescript
const chunk = this.add.image(posX, posY, chunkKey).setOrigin(0);
chunk.setDepth(-1);
```

**Game object pooling**:
```typescript
const enemy = this.enemies.get(x, y) as Enemy | null;
if (enemy) enemy.enable();
```
