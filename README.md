# 🧬 BioGenesis // Emergent Artificial Life & Primordial Particle Chemistry

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Canvas](https://img.shields.io/badge/Render-HTML5_Canvas_Offscreen_Sprites-magenta.svg)]()
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Web_Audio_API-00ff88.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Performance](https://img.shields.io/badge/Engine-Spatial_Hashing_Grid_60FPS-blue.svg)]()

> **BioGenesis** is an interactive, browser-based artificial life laboratory and particle life simulation. Asymmetric attraction and repulsion kernels between microscopic species trigger spontaneous self-organization: multicellular mitosis, slithering aquatic serpents, predator-prey hunting packs, and crystalline atomic lattices.

---

## ✨ Key Highlights

- **⚡ Procedural Web Audio Engine**: Zero external MP3 or WAV files. All ambient drone chord beds, reactive kinetic resonance, and pentatonic interaction chimes are synthesized directly with the **Web Audio API**.
- **🪐 Emergent Multi-Species Ecology**:
  - **Alpha (Cyan)**: Cohesive nucleus seeds.
  - **Beta (Amber)**: Fast-orbiting kinetic catalysts.
  - **Gamma (Emerald)**: Membrane formers and filament binders.
  - **Delta (Violet)**: Heavy gravitational attractors.
  - **Epsilon (Rose)**: Active predators and kinetic instigators.
  - **Zeta (Electric Teal)**: Flexible connective tendrils.
- **🔬 Interactive Genetic Matrix**:
  - Tweak or click any cell in the real-time matrix grid to change inter-species attraction/repulsion coefficients on the fly.
  - Mutate button introduces evolutionary micro-perturbations.
  - One-click presets: *Mitosis Cells*, *Swarm Serpents*, *Predator Pack*, *Crystal Lattice*, and *Supernova Vortex*.
- **🚀 Ultra-Fast Spatial Hashing Grid**:
  - Interaction reach is mapped into spatial grid buckets with $O(N)$ query complexity, maintaining a smooth 60 FPS with 3,000+ active glowing particles.
  - Pre-rendered offscreen sprite canvases eliminate costly runtime blur overhead.
- **🎮 Tactile Singularity & Shockwave**:
  - Left-click drag to focus particles into a gravitational singularity.
  - Right-click, `Shift` + Click, or `Spacebar` to unleash a repulsive shockwave.

---

## 🕹️ Controls Guide

| Action | Input / Shortcut |
| :--- | :--- |
| **Gravitational Singularity** | Left Click + Hold on Canvas |
| **Repulsion Shockwave** | Right Click or `Spacebar` |
| **Unlock Sound & Controls** | Click anywhere or press any key |
| **Audio Toggle** | Click `AUDIO ON / OFF` button in HUD |
| **Mutate Matrix** | Click `MUTATE` in top HUD |
| **Randomize Ecosystem** | Click `RANDOM` in top HUD |
| **Capture Snapshot** | Click `SNAP` (downloads high-res PNG) |
| **Toggle Fullscreen** | Click `FULL` |
| **Cycle Matrix Force** | Click any numerical cell in the matrix grid |

---

## 🔬 Mathematical & Audio Architecture

### 1. Asymmetric Particle Interaction Kernel
The force magnitude $F(r)$ between particle $i$ of species $A$ and particle $j$ of species $B$ separated by Euclidean distance $r$ is defined by:

$$F(r) = \begin{cases} 
\left(\frac{r}{r_{min}} - 1.0\right) \times 1.5 & \text{if } 0 < r < r_{min} \\
M_{A,B} \times \left(1.0 - \frac{|2r - (r_{max} + r_{min})|}{r_{max} - r_{min}}\right) & \text{if } r_{min} \le r < r_{max} \\
0 & \text{if } r \ge r_{max}
\end{cases}$$

Where:
- $r_{min}$ represents the universal Pauli-like repulsion core ($18\text{px}$).
- $r_{max}$ represents the maximum interaction horizon ($72\text{px}$).
- $M_{A,B} \in [-1.0, 1.0]$ is the asymmetric force coefficient from species $A$ toward species $B$.

### 2. Generative Audio Flow Graph
```
[Polyphonic Sine Drone (C2, G2)] ────┐
[Triangle Drone (C3, G3)] ───────────┼──> [Resonant Biquad Filter] ──> [Master Gain] ──> [Analyser Node] ──> [Destination]
[Pentatonic Chime Oscillators] ──────┘                  ▲
                                                        │
[Particle Kinetic Energy & Entropy] ────────────────────┘
```

The resonant biquad filter dynamically tracks the mean velocity and entropy of the particle collective. As the swarm accelerates, the filter cutoff automatically expands to generate a warm, living cybernetic soundscape.

---

## 🚀 Quick Start & Local Run

No bundlers, no npm install, and zero complex build tools required. Clone and launch with any local server:

```bash
git clone https://github.com/IlhamXkyo/BioGenesis.git
cd BioGenesis

# Run with Python:
python -m http.server 8080

# Or run with Node:
npx serve
```

Open your browser and navigate to `http://localhost:8080`.

---

## 🌐 Deploying to GitHub Pages

1. Navigate to your repository **Settings** > **Pages**.
2. Under **Build and deployment**, select **Source**: `Deploy from a branch`.
3. Select branch `main` and root directory `/`.
4. Click **Save**. Your simulation will be published at:
   `https://ilhamxkyo.github.io/BioGenesis/`

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

Crafted by [IlhamXkyo](https://github.com/IlhamXkyo).
