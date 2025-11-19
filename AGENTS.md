# AGENTS.md

## Overview
- Frontend game logic lives primarily under `static/js`, composed of multiple TypeScript/ES modules for UI components, event routing, level loops, entities (cards, bullets, mice), and localization literals.
- Thus this game is TypeScript based, do NOT edit js files if not required.
- The codebase leans on class-based abstractions, weak-reference caches, and object pools (bullets, suns, sprite animations) to keep runtime allocations low, while singletons/composites such as `EventHandler`, `Level`, and `GameBattlefield` orchestrate resources, rendering, and interaction.

## File tour
### `static/js/Core.ts`
- Defines custom Web Components following Material Design 3 principles: `MaterialButton`, `MaterialIconButton`, `MaterialDialog`, `MaterialCard`, `MaterialNavigationBar`, `MaterialSwitch`, `MaterialRangeInput`, `MaterialLoader`, and `MaterialDescription` (snackbar/toast).
- All components use modern CSS with cubic-bezier easing functions, proper elevation shadows, ripple effects, and responsive state layers.
- Exports the global `GEH = new EventHandler()` and sets up the `GameReadyPage` flow that validates card selections before a level starts.
- Components leverage Shadow DOM for encapsulation and use `:host` selectors for proper styling isolation.
### `static/js/EventHandler.ts`
- The central runtime coordinator handling input, asset prefetching, IndexedDB image caching, audio playback (WebAudio + throttling), local archive/config storage, the card bag, and store logic.
- Maintains global state (scale, speed, current page, deck size) and exposes services such as `requestPlayAudio`, `requestImageCache`, and `requestCardDetailDisplay` for other modules.
### `static/js/Level.ts`
- Base class for levels: manages waves, spawning, win/loss rules, auto sun production, fog, and object pools (bullets/suns).
- Owns `SpriteAnimationManager` instance to delegate all animation management (pooling, rendering, scheduling).
- Cooperates with `GameBattlefield` to refresh background/foreground layers, map grids, enemies, and bullets, while exposing APIs like `requestSummonBullet` and `createSpriteAnimation` for defenses/enemies.
- Animation lifecycle: `createSpriteAnimation()` → delegated to `SpriteAnimationManager.playAnimation()` → scheduled updates via `updateAnimations()`.
### `static/js/GameBattlefield.ts`
- Owns the Canvas layers and HUD controls (card tray, shovel, sun bar, wave bar, pause/exit) plus the placement/cursor UX.
- Implements countdown animations, boss HP bars, victory/defeat overlays, and entity helpers such as `Sun` and `MapGrid`.
### `static/js/Foods.ts`
- Houses every defense-card class and the `FoodDetails` factory metadata. Each class governs rendering, behavior, and interactions (attacks, sun production, buffs, etc.).
- Uses static `generate` methods and per-instance logic (water placement, overlays, coverage) to populate the `level.Foods` grid.
### `static/js/Bullets.ts`
- `Bullet` base class encapsulates movement, collision, and visuals, plus an object pool via `acquireBullet`/`releaseBullet`.
- Extends into many projectile variants (buns, fire, missiles, wine, etc.) with special trajectories or boosts.
### `static/js/Mice.ts`
- Defines all enemy types (standard, armored, skaters, bosses like “洞君”) with their stats, states, and abilities (movement, attacks, summons).
- Provides `landSummon`/`waterSummon` helpers and a `getMouseDetails` factory for wave configuration and UI use.
### `static/js/SpriteAnimation.ts`
- **SpriteAnimation class**: Lightweight sprite animation instance supporting horizontal/vertical sprite sheets and SVG sequences.
  - **Critical fix**: `reset()` now clears both `#tick` and `_img` cache to ensure fresh animation state on pool reuse, preventing "animation won't play after several iterations" bug.
  - `render()` method handles progressive frame advancement with proper image caching (reuses last successful image load when current frame fails).
- **SpriteAnimationManager class** (new): Centralized management of animation lifecycle.
  - Owns private animation pool (max 100 instances), animation stack (indexed by zIndex), and pooling logic.
  - Public API for `Level.ts`:
    - `playAnimation(x, y, src, frames, options)`: Create and schedule animation for rendering.
    - `updateAnimations(ctx, gridColumns, gridRows)`: Render all active animations, advance frames, recycle finished ones.
    - `clear()`: Release all animations back to pool (used on level exit/end).
  - Benefits: Cleaner separation of concerns, easier debugging/maintenance, reusable across level instances.
### `static/js/language/Chinese.ts`
- Centralizes UI strings, prompts, error codes, and other localization literals for reuse across modules.

## Relationships
- `Core` → `EventHandler` → `Level`/`GameBattlefield` form the main pipeline from UI entry to the game loop.
- Entity modules (`Foods`, `Mice`, `Bullets`) share the `level` singleton for scene state, interacting through APIs like `requestSummonBullet`, `level.Mice`, and `level.Foods`.
- Helpers such as `SpriteAnimation`, `Sun`, and `MapGrid` are managed by `Level`/`GameBattlefield` inside the main frame loop.
- Localization strings reside in `language/Chinese.ts`, keeping UI copy centralized for future i18n support.

## Setup commands
- Install deps: `npm install`
- Type-check the project: `npx tsc --noEmit`

## Code style
- TypeScript strict mode is enforced; keep typings precise and avoid using `any` unless absolutely necessary.
- Match the prevailing formatting: double quotes for strings, semicolons at statement ends, trailing commas in multiline literals.
- Extend gameplay logic via the established class-based patterns (e.g., bullets, foods, mice) and prefer reusing the existing pooling utilities instead of creating ad-hoc instances.
- UI components use `cubic-bezier(0.4, 0, 0.2, 1)` for all animations and transitions to ensure smooth, consistent motion across the interface.

## Recent Changes
- **Resource Path Unification (EventHandler.ts, Core.ts, GameBattlefield.ts, i18n/index.ts)**:
  - Implemented `EventHandler.getStaticPath()` static method for automatic path resolution
  - Automatically detects deployment environment (GitHub Pages vs local server)
  - GitHub Pages: returns `${location.origin}/CVMJS/static/${relativePath}`
  - Local server: returns `${location.origin}/static/${relativePath}`
  - Replaced all 18 hardcoded `../CVMJS/static/` paths across 4 TypeScript files
  - Ensures compatibility with both https://xxx.github.io/CVMJS/ and http://127.0.0.1:5000/
  - Affected modules: EventHandler (12 paths), Core (4 paths), GameBattlefield (1 path), i18n (1 path)
- **WebP Animation System (EventHandler.ts, SpriteAnimation.ts)**:
  - Implemented WebP animation frame decoding and caching using ImageDecoder API to extract frames as ImageBitmap arrays
  - Added pre-sliced sprite sheet caching optimization using offscreen Canvas for improved rendering performance
  - Extended SpriteAnimation class to support four rendering modes: WebP, pre-sliced, SVG, and traditional sprite sheets
  - Introduced unified API `GEH.requestAnimationResource()` that auto-detects format and returns optimized frame data
  - Implemented LRU cache management (50 WebP limit, 100 sprite sheet limit) with automatic memory cleanup
  - Fully backward compatible, defaults to traditional rendering mode, enable via `isWebP: true` option
  - Detailed architecture design available in `docs/webp-animation-architecture.md`
  - Extended `requestDrawImage()` method with WebP-first fallback: automatically attempts to load `.webp` version, falling back to `.png` on failure, enabling all entities (Stove, MarioMouse, etc.) and background animations (mapMove) to support WebP without code modifications
- **Bullet Pool Safety (Bullets.ts)**: Added `Stone.reset` implementation so pooled Stone projectiles restore runtime fields (lane, target column, velocity) before reuse, preventing `instance.reset` undefined errors within `acquireBullet`.
- **Animation Optimization (Core.ts)**: Refactored all component animations to use `cubic-bezier(0.4, 0, 0.2, 1)` timing function for smoother, more natural motion. Improved ripple effects with fade-out animation, optimized transition properties to only animate necessary CSS properties, and standardized animation durations across components for consistency.
- **SpriteAnimation Architecture Refactor (SpriteAnimation.ts, Level.ts)**:
  - Extracted animation management into independent `SpriteAnimationManager` class.
  - Fixed critical bug: `SpriteAnimation.reset()` now clears `#tick` and `_img` cache, preventing animation playback failures after pool reuse.
  - Moved all pooling/scheduling logic from `Level.ts` to `SpriteAnimationManager`, exposing only three public methods: `playAnimation()`, `updateAnimations()`, `clear()`.
  - Improves modularity, debuggability, and cross-level animation reusability.

## Finish
- Run `npx tsc` to compile.
- Propose to modify `AGENTS.md` if any logic modified or you have something to add.