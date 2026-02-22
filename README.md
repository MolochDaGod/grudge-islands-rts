# Grudge Islands RTS

A real-time strategy game with tower defense, equipment systems, skill trees, hero classes, and naval combat — powered by Canvas 2D.

## Features

- **Tower Defense** — 5 tower types (Arrow, Cannon, Magic, Frost, Fire) with 5 upgrade levels each
- **Equipment System** — Weapons and armor from Tier 0-8 with stat bonuses
- **Skill Trees** — 4 classes (Warrior, Mage, Worg, Ranger) with 11 skills per class
- **Naval Combat** — 5 boat types (Anglerfish, Speed Boat, Sail Boat, Warship, Transport)
- **Hero System** — Create a hero, choose a class, and level up through combat
- **Home Island** — Resource harvesting, crafting, building, and recruiting
- **Character Attributes** — 8 attributes with 37 derived stats

## Tech Stack

- TypeScript (strict mode)
- Vite 6
- Canvas 2D rendering
- Tiny Swords + MiniWorld sprite packs

## Project Structure

```
src/              # Game source (Vite root)
  game/           # Core engine, entities, systems, rendering, scenes
  ui/             # HUD components (action bar, resource bar, tower UI)
  data/           # Game data (items, skills, unit types, sprites)
  types/          # TypeScript type definitions
  game.html       # Entry point
  main.ts         # Bootstrap
  vite.config.ts  # Build config
addons/           # MiniWorld sprite pack
sprites/          # Beam/bullet color sprites
effects/          # Particle effect spritesheets
Tiny Swords (Free Pack)/  # Tiny Swords sprite pack
output/           # Build output (git-ignored)
vercel.json       # Deployment config
```

## Development

```bash
cd src
npm install
npm run dev       # Starts dev server on http://localhost:3000
```

## Build

```bash
cd src
npm run build     # Type-checks with tsc, then bundles with Vite → ../output/
```

## Lint / Type Check

```bash
cd src
npm run lint      # tsc --noEmit
```

## Deploy to Vercel

The root `vercel.json` handles the full build pipeline:

1. **Install**: Skipped at root (deps live in `src/`)
2. **Build**: `cd src && npm ci && npm run build`
3. **Output**: `output/`
4. **Routing**: `/` and `/game` both serve `game.html`

To deploy:

1. Connect this repo to Vercel
2. No framework override needed — `vercel.json` configures everything
3. Push to `main` to deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MolochDaGod/grudge-islands-rts)

## Controls

- **WASD / Arrow Keys** — Pan camera
- **Mouse Wheel** — Zoom in/out
- **Left Click** — Select units / Place buildings
- **Right Click** — Move selected units / Move hero
- **T** — Open tower build menu
- **B** — Open building menu
- **1-5** — Select tower/building type
- **U** — Upgrade selected tower
- **ESC** — Cancel placement / Pause
- **P** — Pause/Resume
- **F1** — Quick start (dev shortcut)

## License

MIT
