# BioGenesis

An emergent artificial life and particle chemistry sandbox built in JavaScript with HTML5 Canvas.

Particles interact through pairwise distance-based force curves, resulting in emergent cellular structures, self-replicating clusters, predatory chases, and organic membrane formations without hardcoded biological behavior.

## Features

- **Force Matrix Simulation**: Configurable attraction and repulsion coefficients across multiple particle species.
- **Spatial Partitioning Grid**: Optimized neighbor search algorithm for maintaining 60 FPS performance with over 3,000 active particles.
- **Preset Behaviors**: Includes initial configurations for cellular clusters, predatory swarms, crystalline lattices, and chaotic soups.
- **Interactive Particle Injection**: Click and drag to introduce new species, apply velocity perturbations, or clear sections of the canvas.
- **Customizable Physics**: Real-time sliders for friction coefficients, maximum interaction radius, viscosity, and brownian motion.

## Getting Started

No build step or runtime installation is required.

1. Clone the repository:
   ```bash
   git clone https://github.com/IlhamXkyo/BioGenesis.git
   cd BioGenesis
   ```

2. Open `index.html` directly in any modern web browser:
   ```bash
   # Optional: serve locally
   python -m http.server 8000
   ```

3. Open `http://localhost:8000` to interact with the simulation.

## Controls

- **Left Mouse Click + Drag**: Spawn selected particle species.
- **Right Mouse Click + Drag**: Apply repulsive force to scatter particles.
- **Spacebar**: Pause or resume simulation.
- **R Key**: Reset particle positions with current preset.
- **C Key**: Clear canvas.

## Tech Stack

- Vanilla JavaScript (ES6 Modules)
- HTML5 Canvas 2D Rendering API
- Web Audio API (procedural harmonic feedback)

## License

MIT License. See LICENSE file for details.
