# AGENTS.md

## Build, Lint, and Test Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run svelte-check for TypeScript validation
npm run check:watch  # Run svelte-check in watch mode
```

**Important**: Run `npm run check` before committing changes. There is no test framework configured.

## Code Style Guidelines

### Imports

- Use `import type` for type-only imports
- Use relative imports (`../utils`, `./components/Player`)
- Do not use import aliases (`$lib` is handled by SvelteKit but prefer relative paths)

### Formatting

- 2-space indentation
- Always use semicolons
- Single quotes for strings
- Opening brace on same line

### TypeScript

- Enable strict mode (`strict: true` in tsconfig)
- Use `declare` for extending Phaser classes with type information
- Use union types for nullable states
- Avoid `any` type

### Naming Conventions

- **Classes**: PascalCase (`Player`, `StateMachine`, `MainGame`)
- **Functions and variables**: camelCase (`getPixelPosition`, `movementSpeed`)
- **Constants**: SCREAMING_SNAKE_CASE (`WORLD_WIDTH`, `GRID_CELL_SIZE`)
- **Private fields**: Prefix with `#` (`#attackRange`, `#movementSpeed`)
- **State names**: kebab-case (`'attack-prepare'`, `'attack-move'`, `'idle'`)

### Error Handling

- Use `throw new Error()` with contextual messages
- Prefix error messages with component/state machine name
- Use `console.log()` for init and debug messages

### Comments

- Do not add comments unless complex logic requires explanation
- Remove commented-out code instead of leaving it
- Use `// TODO:` for planned features that need implementation

## Project Structure

```
src/game/
├── components/         # Phaser game entities (Player, Enemy, Bullet, etc.)
├── scenes/             # Phaser scenes (MainGame, GameOver, etc.)
├── main.ts             # Phaser game initialization
├── stateMachine.ts     # State machine implementation
├── utils.ts            # Shared utilities
└── PhaserGame.svelte   # Svelte component wrapper
src/routes/             # SvelteKit routes
lib/assets/             # Static assets
```

## Phaser Patterns

### Entity Classes

- Extend appropriate Phaser class (Sprite, Image, Group)
- Declare scene and body types using `declare`
- Initialize physics in constructor with `physics.add.existing()`
- Use state machines for entity behavior logic

### State Machines

- Use the `StateMachine` class from `src/game/stateMachine.ts`
- Define states with `onEnter`, `onUpdate`, and `onExit` hooks
- Use `reenter: true` to allow re-entering the same state
- Use kebab-case for state names

### Private Internal State

- Use `#` prefix for private fields
- Keep state machine logic in separate class, not mixed with rendering

### Lifecycle Methods

- Use `init()` for setup, `preload()` for assets, `create()` for initialization
- Implement `preUpdate(time, dt)` for per-frame logic

## Important Notes

- Always run `npm run check` to validate TypeScript before committing
- Keep entity classes focused on single responsibility
- Use named exports for game entities and utilities
- No test framework exists; validate manually with `npm run dev`
- The project uses Tailwind CSS 4 with `@tailwindcss/vite`
