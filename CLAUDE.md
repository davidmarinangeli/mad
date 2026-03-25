# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Phaser 3 game built with TypeScript and Vite - an interactive anniversary gift where the player navigates through 11 levels representing shared memories, answering questions to unlock each one.

## Development Commands

- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - Type-check with TypeScript and build for production
- `npm run preview` - Preview production build
- `node scripts/generate_map.js` - Regenerate all map JSON files in `public/assets/`

## Architecture

### Single-File Game Structure
All game logic is in [src/main.ts](src/main.ts):
- Three Phaser scenes: `TitleScene` → `GameScene` → `EndScene`
- `LEVELS` array at top defines all 11 levels with configuration
- Each level loads a different tilemap JSON and progresses sequentially
- Game runs at 4x camera zoom for retro pixel-art aesthetic

### Level Configuration
The `LEVELS` array (levels 0-10) defines each level's complete setup:
- `mapKey`: Which map JSON to load (note: map_6 is skipped, Level 6 uses map_7)
- `title`: Display name shown in top-left banner
- `startX, startY`: Player spawn position in pixels
- `signX, signY`: Memory sign (interactable) position in pixels
- `question, options, correctIndex`: Quiz data (currently placeholder values)
- `questionId`: (Optional) For custom multi-stage question logic
- `isCustomMap`: (Optional) Flags levels with non-standard Tiled maps

Levels progress sequentially via index. GameScene receives `levelIndex` via init data and increments it on correct answer.

**Special Cases:**
- **Level 0 (The Apartment Street)**: Custom multi-stage layout with `questionId: 'q-apartment'`, uses city tileset
- **Level 1 (1st of May)**: Custom multi-stage logic bypasses standard sign interaction
- **Level 6**: Uses `map_7.json` (map_6.json exists but isn't assigned to any level)

### Hybrid Rendering System
The game uses both Phaser canvas and HTML overlay:
- Phaser canvas (`#game-container`) renders the game world at 4x zoom
- HTML overlay (`#ui-layer`) handles the dialog system with styled buttons
- Dialog state is managed via `isDialogActive` flag in GameScene
- Interaction between systems: `window.handleDialogAnswer()` callback from HTML to Phaser
- **HIGH-DPI Rendering:** LINEAR texture filtering applied to custom images for smooth upscaling

### Map Generation System
[scripts/generate_map.js](scripts/generate_map.js) procedurally generates all Tiled-compatible map JSONs:
- Creates both ground and collision layers for each level
- Level 0 uses city tileset (nighttime street scene), all others use grass tileset
- Exports to `public/assets/map_N.json` (N = 0-10, note: map_6 exists but unused)
- Each level has unique layout: open fields, mazes, S-curves, slalom courses, etc.
- **Tileset References:** Maps reference `grass_01.png`, `city.png`, and `fences.png`

### Key Gameplay Mechanics
- Player movement: WASD keys, collision with walls layer
- Interaction: E key when near blue square (memory sign)
- Dialog flow: Show question → select answer → on correct answer, fade to next level
- Progression: Linear through all 11 levels, ends at EndScene
- Special interactions in Levels 0 and 1 with custom multi-stage logic

### Asset Structure

**Tilesets:**
- `public/assets/grass_01.png` - Primary grass tileset (160×128px, 10×8 tiles at 16×16, 80 tiles total)
- `public/assets/grass_02.png` - Alternative decorative grass tileset (available but not currently used)
- ⚠️ **Missing:** `city.png` (160×128px, needs asphalt, buildings, sidewalk tiles) and `fences.png` (64×64px, needs collision wall tiles)

**Character Spritesheets (128×128 frames in 512×512 grids):**
- `public/assets/main_character.png` - Player spritesheet (4×4 grid for walk animations)
- `public/assets/nonna.png` - Grandmother NPC (Level 6)
- `public/assets/sister.png` - Sister NPC (Level 1)
- `public/assets/boyfriend.png` - Boyfriend NPC (Level 1)

**Level-Specific Decorative Objects (~40 themed sprites):**

*Level 0 (The Apartment Street):*
- `tesla.png`, `spark_car.png`, `apartment_door.png`, `night_pole.png`
- `road_asphalt.png`, `sidewalk_pavement.png`
- `building_1.png`, `building_2.png`, `building_3.png`

*Level 1 (1st of May):*
- `olive_tree.png`, `basel_painting.png`, `frames.png`, `picnic.png`

*Level 2 (Tuscany Glamping):*
- `tent.png`, `fireplace.png`, `tree_1.png`, `tree_2.png`

*Level 3 (Sicily):*
- `sicilian_market_1.png`, `sicilian_market_2.png`, `sicilian_market_3.png`
- `sicilian_house.png`

*Level 4 (Lanzarote):*
- `volcanic_rock_1.png`, `volcanic_rock_2.png`, `van.png`

*Level 5 (Van in the Sand):*
- `van_sand.png`, `sand.png`

*Level 6 (Tortellini with Nonna):*
- `table.png`, `tortellini_shape.png`, `rolling_pin.png`, `house_tile.png`

*Level 7 (Snow Trekking):*
- `snow_1.png`, `snow_2.png`, `snow_tracks.png`, `socks.png`

*Level 8 (Parmesan Factory):*
- `parmigiano_1.png`, `parmigiano_2.png`, `parmigiano_3.png`, `factory_shelf.png`

*Level 9 (At Your Apartment):*
- `sofa.png`, `macbook.png`, `cooking_pot.png`, `amber.png`

## Rendering Configuration

- **Camera Zoom:** 4x zoom applied to all scenes for pixel-art aesthetic
- **Texture Filtering:** LINEAR mode applied to custom detailed images (all level objects and character sprites) for smooth high-DPI rendering
- **Canvas Size:** Responsive, managed by Phaser's scale config in game initialization

## Vite Configuration

- Entry point: [index.html](index.html) → [src/main.ts](src/main.ts)
- TypeScript strict mode enabled
- Phaser 3 imported as ES module
- HMR configured to destroy/recreate game instance on hot reload
- Game stored in `window.__GAME__` for cleanup between reloads

## Known Issues & TODOs

- ⚠️ **Missing Tilesets:** `city.png` and `fences.png` need to be created with specifications:
  - `city.png`: 160×128px (10×8 tiles), containing asphalt, building, sidewalk tiles
  - `fences.png`: 64×64px (4×4 tiles), containing collision wall/fence tiles
- **Map Numbering Gap:** map_6.json exists in assets but isn't used; Level 6 loads map_7.json instead
- **Placeholder Questions:** All level questions currently have "Option A/B/C" placeholders
