# BioGenesis

An emergent artificial life and primordial particle chemistry sandbox built in JavaScript with HTML5 Canvas and procedural Web Audio API.

Particles interact through asymmetric pairwise distance-based force curves, resulting in emergent cellular structures, self-replicating clusters, predatory swarms, and organic membrane formations without hardcoded biological behavior.

## Features

- **Force Matrix Simulation**: Configurable attraction and repulsion coefficients across 6 particle species (Alpha, Beta, Gamma, Delta, Epsilon, Zeta).
- **Spatial Partitioning Grid**: Optimized neighbor search algorithm maintaining 60 FPS performance with over 3,000 active particles.
- **Singularity Resolution**: Anti-freeze physics jitter preventing coincident particles from locking together.
- **Interactive Brush Modes**:
  - **Attractor**: Pull particles towards the cursor.
  - **Repulsor**: Blast particles away with repulsive shockwaves (Right-Click or Shift+Click).
  - **Particle Injector**: Spawn specific particle species dynamically on the canvas.
- **Zero-Leak Web Audio Engine**: Procedural ambient drone, pentatonic interaction chimes, and kinetic filter feedback with strict lifecycle node cleanup.
- **Preset Behaviors**: Includes initial configurations for Mitosis Cells, Swarm Serpents, Predator Pack, Crystal Lattice, and Supernova Vortex.
- **Matrix Serialization**: Export and import custom genetic matrix configurations directly as JSON files.
- **Automated Test Suite**: Built-in unit test verification using Node.js test runner.

## Getting Started

No build step or external runtime dependencies are required.

1. Clone the repository:
   ```bash
   git clone https://github.com/IlhamXkyo/BioGenesis.git
   cd BioGenesis
   ```

2. Open `index.html` directly in any modern web browser or serve locally:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node.js
   npm start
   ```

3. Open `http://localhost:8000` to interact with the sandbox.

## Controls & Keyboard Shortcuts

| Input | Action |
| :--- | :--- |
| **Left Click + Drag** | Apply active brush mode (Attract, Repel, or Inject Species) |
| **Right Click + Drag** | Apply repulsive force shockwave |
| **Spacebar** | Pause or resume simulation |
| **R Key** | Reset particle positions with current preset |
| **C Key** | Clear all particles from the canvas |
| **M Key** | Mutate force matrix slightly |
| **Matrix Cell Click** | Left-click: +0.2 / Right-click: -0.2 force interaction |

## Automated Testing

Run the unit test suite:

```bash
npm test
```

## Tech Stack

- Vanilla JavaScript (ES6+ Modules)
- HTML5 Canvas 2D Rendering API (Offscreen sprite glow rendering)
- Web Audio API (BiquadFilter kinetic feedback, pentatonic chimes, harmonic drones)
- Node.js Built-in Test Runner (`node:test`)

## License

MIT License. See [LICENSE](LICENSE) file for details.
