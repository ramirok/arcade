# Arcade Roguelike - Agent Guidelines

This document provides essential information for agentic coding assistants working on the Arcade Roguelike project.

## 🛠 Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Starts the Vite dev server with HMR. |
| **Build** | `npm run build` | Runs `tsc -b` followed by `vite build`. |
| **Preview** | `npm run preview` | Previews the production build locally. |
| **Linting** | N/A | No linter (ESLint/Prettier) is currently configured. |
| **Testing** | N/A | No testing framework is currently configured. |

*Note: When adding tests, prefer using [Vitest](https://vitest.dev/) as it integrates seamlessly with Vite.*

---

## 🏗 Architecture & Stack

- **Game Engine**: [Phaser 3](https://phaser.io/) (Arcade Physics).
- **UI Framework**: [SolidJS](https://www.solidjs.com/) for HUD, menus, and routing.
- **Build Tool**: Vite (using `rolldown-vite` override).
- **Styling**: TailwindCSS.
- **Pathfinding**: `pathfinding` (PF) library.

### Key Directories
- `/src/game`: Phaser logic (scenes, components, state machines).
- `/src/components`: SolidJS UI components.
- `/src/pages`: SolidJS page-level components.
- `/blender`: Source 3D models (Blender).
- `/public/assets`: Game assets (sprites, tilesets).

---

## 💻 Coding Style & Conventions

### 1. TypeScript & Types
- **Strict Typing**: Always use TypeScript. Avoid `any`.
- **Data Management**: Use `Phaser.Data.DataManager` for entity state. 
- **Type Safety**: Wrap Phaser Data Managers with the `DataOverride<Entity, Data>` type found in `src/game/utils.ts` to ensure type-safe `get`/`set`/`inc`/`toggle` operations.

### 2. Naming Conventions
- **Classes/Components**: `PascalCase` (e.g., `MainGame`, `Player`, `CharStats`).
- **Methods/Variables**: `camelCase` (e.g., `takeDamage`, `shortestDistance`).
- **Private Fields**: Prefer native private fields (`#field`) over the `private` keyword for true runtime privacy.
- **Files**: Match the name of the primary export (e.g., `Player.ts` exports `class Player`).

### 3. Phaser Entity Pattern
Entities should typically extend a Phaser GameObject class and encapsulate their own logic and state machine.

```typescript
export class MyEntity extends Physics.Arcade.Sprite {
  declare scene: MainGame;
  declare data: DataOverride<MyEntity, MyEntityData>;
  stateMachine: StateMachine<...>;

  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'texture-key');
    this.setDataEnabled();
    // Initialize state, physics, and state machine...
  }
}
```

### 4. State Management
- **Entity Logic**: Use the custom `StateMachine` class (`src/game/stateMachine.ts`) for complex behaviors (e.g., `idle` -> `move` -> `attack-prepare`).
- **UI State**: Use SolidJS signals and stores.
- **Bridge**: Use Phaser's event emitter (`this.game.events`) to communicate between Phaser scenes and SolidJS UI.

### 5. Formatting & Imports
- **Imports**: Use standard ESM imports. Prefer relative paths for internal project files.
- **Order**: Imports should be grouped: 3rd party libraries first, then internal utilities/components.
- **Style**: Use trailing commas, single quotes, and 2-space indentation (standard Vite/Solid template style).

---

## ⚠️ Error Handling
- Use descriptive error messages in `throw new Error()` calls, especially within generic utilities like `StateMachine`.
- For game logic, prefer "safe" failure or defaults over crashing the game loop (e.g., return early if a target is no longer active).

---

## 🎨 Asset Workflow
- 3D assets are authored in Blender (`/blender`).
- Exported spritesheets/images should be placed in `/public/assets`.
- Load assets in `Bootloader.ts` or the `preload()` method of the relevant scene.

---

## 📋 Best Practices
- **Performance**: Minimize allocations in the `update()` loop.
- **Clean Scenes**: Keep `MainGame.ts` focused on orchestration (collisions, groups, world setup). Move entity-specific logic into component classes.
- **Reactivity**: Leverage SolidJS's fine-grained reactivity for the UI to avoid unnecessary re-renders of the game canvas.
