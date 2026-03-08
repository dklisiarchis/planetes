# Planetes

An interactive 3D planetary simulation built with SvelteKit, Three.js, and a Rust WASM gravitational integrator. Explore real star systems with accurate orbital mechanics, tweak physics parameters in real-time, and run "What If?" experiments.

![SvelteKit](https://img.shields.io/badge/SvelteKit-5-orange) ![Three.js](https://img.shields.io/badge/Three.js-r183-blue) ![Rust](https://img.shields.io/badge/Rust-WASM-red)

## Systems

**Solar System** — Our home system with 9 planets, Saturn's rings, Earth's cloud layer, an asteroid belt, and textured surfaces from real NASA imagery.

**TRAPPIST-1** — 7 Earth-sized worlds orbiting an ultra-cool red dwarf 40 light-years away. Three planets in the habitable zone. A near-resonant orbital chain that's uniquely fragile to perturbation.

**Kepler-90** — 8 planets crammed within 1 AU — a compressed mini solar system 2,790 light-years away. Features a "super-puff" gas giant with the density of cotton candy and a Jupiter-class world at Earth's orbital distance.

## Features

- **Real physics** — 4th-order Runge-Kutta integrator running in a Rust WASM Web Worker. Keplerian orbital elements from JPL ephemeris data.
- **Interactive controls** — Adjust time scale, gravity, softening. Per-body selection with live stats (distance, speed, position).
- **"What If?" experiments** — Remove Jupiter, turn it into a star, double Earth's mass, break TRAPPIST-1's resonance chain, and more.
- **Camera follow** — Lock the camera to any body and orbit around it while the simulation runs.
- **Visual fidelity** — Planet textures, post-processing bloom, adaptive scaling (planets stay visible at any zoom), orbital trails, starfield backdrop.

## Quick Start

### Docker (recommended)

```bash
docker build -t planetes .
docker run -p 5173:5173 planetes
```

Open [http://localhost:5173](http://localhost:5173)

### Manual Setup

**Prerequisites:** Node.js 20+, Rust toolchain, [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

```bash
# Install dependencies
npm install

# Build the Rust WASM N-body solver
npm run wasm:build

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte              # System selector (home)
│   └── sim/[slug]/               # Simulation page + loading screen
├── lib/
│   ├── scenes/NBody.svelte       # Main simulation scene
│   ├── components/
│   │   ├── SceneRoot.svelte      # Camera, lighting, orbit controls
│   │   └── nbody/                # Planet bodies, trails, bloom, labels, etc.
│   └── sim/
│       ├── portal.svelte.ts      # Canvas portal for route persistence
│       └── nbody/
│           ├── presets.ts         # System configs (orbital elements, visuals)
│           ├── state.svelte.ts    # Reactive simulation state
│           ├── bridge.svelte.ts   # Web Worker bridge + ring buffer
│           └── worker.ts          # WASM worker thread
nbody-wasm/                        # Rust RK4 N-body integrator
static/textures/planets/           # Planet textures (Solar System Scope, CC BY 4.0)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 5, Svelte 5 (runes) |
| 3D Engine | Three.js via Threlte 8 |
| Physics | Rust WASM (RK4 integrator, Web Worker) |
| Styling | Tailwind CSS 4 |
| UI Controls | svelte-tweakpane-ui |
| Post-processing | pmndrs postprocessing (bloom) |

## Adding a New System

1. Define orbital elements and star properties in `src/lib/sim/nbody/presets.ts`
2. Create a `SystemConfig` with physics defaults, render config, star glow, and "What If?" scenarios
3. Add it to the `SYSTEMS` registry — it automatically appears in the selector and dashboard

## Credits

Planet textures from [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).
TRAPPIST-1 orbital data from Agol et al. 2021 (Planetary Science Journal).
Solar system orbital elements from JPL Horizons (J2000 epoch).
