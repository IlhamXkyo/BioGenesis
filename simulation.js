/**
 * BioGenesis - Particle Life Physics Engine
 * High-performance spatial grid partitioning, asymmetric force kernels,
 * pre-rendered glowing sprites, and emergent multicellular behavior.
 */

class ParticleSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.width = canvas.width;
        this.height = canvas.height;

        // Species configuration (6 distinct species)
        this.species = [
            { name: 'Alpha', color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.45)', rgb: [0, 240, 255] },     // Cyan
            { name: 'Beta', color: '#ffb300', glow: 'rgba(255, 179, 0, 0.45)', rgb: [255, 179, 0] },     // Amber
            { name: 'Gamma', color: '#00ff77', glow: 'rgba(0, 255, 119, 0.45)', rgb: [0, 255, 119] },   // Emerald
            { name: 'Delta', color: '#b026ff', glow: 'rgba(176, 38, 255, 0.45)', rgb: [176, 38, 255] },   // Violet
            { name: 'Epsilon', color: '#ff2a6d', glow: 'rgba(255, 42, 109, 0.45)', rgb: [255, 42, 109] }, // Rose
            { name: 'Zeta', color: '#05d9e8', glow: 'rgba(5, 217, 232, 0.45)', rgb: [5, 217, 232] }      // Electric Teal
        ];

        this.numSpecies = this.species.length;

        // Physics parameters
        this.friction = 0.86;
        this.rMin = 18;      // Short-range repulsion core
        this.rMax = 72;      // Maximum interaction range
        this.forceFactor = 0.42;
        this.wrapBounds = true;

        // Spatial grid setup (cell size >= rMax for fast O(N) neighbor lookup)
        this.cellSize = Math.max(95, Math.ceil(this.rMax));
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
        this.grid = [];

        // Particles
        this.particles = [];
        this.targetCount = 2400;

        // Asymmetric force interaction matrix (numSpecies x numSpecies)
        this.matrix = [];
        this.initMatrix();

        // Pre-rendered offscreen sprite canvases for zero-lag glow rendering
        this.sprites = [];
        this.renderSprites();

        // Telemetry metrics
        this.averageVelocity = 0;
        this.entropy = 0;
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsTimer = performance.now();

        // External forces (user mouse interaction)
        this.interactionForce = {
            active: false,
            x: 0,
            y: 0,
            type: 'attract', // 'attract' or 'repel'
            radius: 180,
            strength: 1.8
        };

        // Initialize default population & preset
        this.resetParticles(this.targetCount);
        this.loadPreset('mitosis');
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;

        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
        this.renderSprites();
    }

    setRMax(val) {
        this.rMax = val;
        this.cellSize = Math.max(95, Math.ceil(this.rMax));
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
    }

    initMatrix() {
        this.matrix = [];
        for (let i = 0; i < this.numSpecies; i++) {
            this.matrix[i] = [];
            for (let j = 0; j < this.numSpecies; j++) {
                this.matrix[i][j] = (Math.random() * 2 - 1).toFixed(2) * 1.0;
            }
        }
    }

    renderSprites() {
        this.sprites = [];
        const size = 28; // Sprite bounding box
        const center = size / 2;

        for (let i = 0; i < this.numSpecies; i++) {
            const offscreen = document.createElement('canvas');
            offscreen.width = size;
            offscreen.height = size;
            const octx = offscreen.getContext('2d');

            const [r, g, b] = this.species[i].rgb;

            // Radial gradient glow
            const grad = octx.createRadialGradient(center, center, 1.2, center, center, center);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
            grad.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, 0.75)`);
            grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.22)`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

            octx.fillStyle = grad;
            octx.beginPath();
            octx.arc(center, center, center, 0, Math.PI * 2);
            octx.fill();

            // Core bright point
            octx.fillStyle = '#ffffff';
            octx.beginPath();
            octx.arc(center, center, 1.8, 0, Math.PI * 2);
            octx.fill();

            this.sprites.push(offscreen);
        }
    }

    resetParticles(count = this.targetCount) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: 0,
                vy: 0,
                species: i % this.numSpecies
            });
        }
    }

    mutateMatrix(rate = 0.25) {
        for (let i = 0; i < this.numSpecies; i++) {
            for (let j = 0; j < this.numSpecies; j++) {
                if (Math.random() < rate) {
                    const delta = (Math.random() * 2 - 1) * 0.45;
                    this.matrix[i][j] = Math.max(-1.0, Math.min(1.0, this.matrix[i][j] + delta));
                }
            }
        }
    }

    randomizeMatrix() {
        for (let i = 0; i < this.numSpecies; i++) {
            for (let j = 0; j < this.numSpecies; j++) {
                this.matrix[i][j] = parseFloat((Math.random() * 2 - 1).toFixed(2));
            }
        }
    }

    loadPreset(name) {
        const presets = {
            mitosis: [
                [ 0.65, -0.45,  0.20,  0.10, -0.20,  0.00],
                [-0.30,  0.75, -0.50,  0.30,  0.00, -0.15],
                [ 0.15, -0.40,  0.70, -0.60,  0.25,  0.00],
                [ 0.00,  0.20, -0.35,  0.80, -0.55,  0.20],
                [-0.20,  0.00,  0.15, -0.40,  0.65, -0.30],
                [ 0.10, -0.20,  0.00,  0.15, -0.35,  0.75]
            ],
            serpents: [
                [ 0.85,  0.40, -0.70,  0.10, -0.25,  0.30],
                [-0.60,  0.90,  0.45, -0.50,  0.10, -0.20],
                [ 0.25, -0.70,  0.85,  0.50, -0.40,  0.10],
                [-0.30,  0.15, -0.65,  0.80,  0.40, -0.50],
                [ 0.40, -0.30,  0.10, -0.70,  0.85,  0.35],
                [-0.15,  0.35, -0.20,  0.30, -0.60,  0.90]
            ],
            predator: [
                [-0.10,  0.80, -0.20, -0.10,  0.40, -0.30],
                [-0.75, -0.05,  0.70, -0.30, -0.10,  0.50],
                [ 0.30, -0.80, -0.10,  0.65, -0.25, -0.10],
                [-0.20,  0.40, -0.75, -0.05,  0.80, -0.20],
                [-0.50, -0.10,  0.30, -0.80, -0.10,  0.75],
                [ 0.60, -0.40, -0.15,  0.25, -0.75, -0.05]
            ],
            crystalline: [
                [ 0.90, -0.25, -0.25, -0.25, -0.25, -0.25],
                [-0.25,  0.90, -0.25, -0.25, -0.25, -0.25],
                [-0.25, -0.25,  0.90, -0.25, -0.25, -0.25],
                [-0.25, -0.25, -0.25,  0.90, -0.25, -0.25],
                [-0.25, -0.25, -0.25, -0.25,  0.90, -0.25],
                [-0.25, -0.25, -0.25, -0.25, -0.25,  0.90]
            ],
            supernova: [
                [ 0.45, -0.90,  0.80, -0.70,  0.60, -0.50],
                [-0.50,  0.45, -0.90,  0.80, -0.70,  0.60],
                [ 0.60, -0.50,  0.45, -0.90,  0.80, -0.70],
                [-0.70,  0.60, -0.50,  0.45, -0.90,  0.80],
                [ 0.80, -0.70,  0.60, -0.50,  0.45, -0.90],
                [-0.90,  0.80, -0.70,  0.60, -0.50,  0.45]
            ]
        };

        if (presets[name]) {
            for (let i = 0; i < this.numSpecies; i++) {
                for (let j = 0; j < this.numSpecies; j++) {
                    this.matrix[i][j] = presets[name][i][j];
                }
            }
        }
    }

    updateGrid() {
        const totalCells = this.cols * this.rows;
        if (this.grid.length !== totalCells) {
            this.grid = new Array(totalCells);
            for (let i = 0; i < totalCells; i++) this.grid[i] = [];
        } else {
            for (let i = 0; i < totalCells; i++) {
                this.grid[i].length = 0;
            }
        }

        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            const p = this.particles[i];
            const col = Math.floor(p.x / this.cellSize);
            const row = Math.floor(p.y / this.cellSize);

            if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                const cellIndex = row * this.cols + col;
                this.grid[cellIndex].push(i);
            }
        }
    }

    step(audioEngine = null) {
        this.updateGrid();

        const len = this.particles.length;
        const rMax = this.rMax;
        const rMin = this.rMin;
        const rMaxSq = rMax * rMax;
        const forceFactor = this.forceFactor;
        let totalVelocity = 0;

        // Interaction calculation using 9 adjacent grid cells
        for (let i = 0; i < len; i++) {
            const p1 = this.particles[i];
            const p1Species = p1.species;
            const col = Math.floor(p1.x / this.cellSize);
            const row = Math.floor(p1.y / this.cellSize);

            let fx = 0;
            let fy = 0;

            for (let ox = -1; ox <= 1; ox++) {
                let neighborCol = col + ox;
                if (this.wrapBounds) {
                    neighborCol = (neighborCol + this.cols) % this.cols;
                } else if (neighborCol < 0 || neighborCol >= this.cols) {
                    continue;
                }

                for (let oy = -1; oy <= 1; oy++) {
                    let neighborRow = row + oy;
                    if (this.wrapBounds) {
                        neighborRow = (neighborRow + this.rows) % this.rows;
                    } else if (neighborRow < 0 || neighborRow >= this.rows) {
                        continue;
                    }

                    const cell = this.grid[neighborRow * this.cols + neighborCol];
                    if (!cell) continue;

                    const cellLen = cell.length;
                    for (let c = 0; c < cellLen; c++) {
                        const j = cell[c];
                        if (i === j) continue;

                        const p2 = this.particles[j];
                        let dx = p2.x - p1.x;
                        let dy = p2.y - p1.y;

                        if (this.wrapBounds) {
                            if (dx > this.width * 0.5) dx -= this.width;
                            if (dx < -this.width * 0.5) dx += this.width;
                            if (dy > this.height * 0.5) dy -= this.height;
                            if (dy < -this.height * 0.5) dy += this.height;
                        }

                        const dSq = dx * dx + dy * dy;
                        if (dSq > 0.0001 && dSq < rMaxSq) {
                            const d = Math.sqrt(dSq);
                            let f = 0;

                            // Core universal repulsion
                            if (d < rMin) {
                                f = (d / rMin - 1.0) * 1.5;
                            } else {
                                // Smooth bell curve for asymmetric inter-species force
                                const attraction = this.matrix[p1Species][p2.species];
                                const mid = (rMax + rMin) * 0.5;
                                const halfSpan = (rMax - rMin) * 0.5;
                                const normalized = 1.0 - Math.abs(d - mid) / halfSpan;
                                f = attraction * Math.max(0, normalized);
                            }

                            fx += (dx / d) * f;
                            fy += (dy / d) * f;
                        }
                    }
                }
            }

            // Mouse interaction (Singularity / Shockwave)
            if (this.interactionForce.active) {
                let mdx = this.interactionForce.x - p1.x;
                let mdy = this.interactionForce.y - p1.y;
                const mdistSq = mdx * mdx + mdy * mdy;
                const mRad = this.interactionForce.radius;

                if (mdistSq < mRad * mRad && mdistSq > 1.0) {
                    const mdist = Math.sqrt(mdistSq);
                    const power = (1.0 - mdist / mRad) * this.interactionForce.strength * 4.0;
                    const mult = this.interactionForce.type === 'attract' ? power : -power * 1.5;
                    fx += (mdx / mdist) * mult;
                    fy += (mdy / mdist) * mult;
                }
            }

            // Apply acceleration with friction
            p1.vx = (p1.vx + fx * forceFactor) * this.friction;
            p1.vy = (p1.vy + fy * forceFactor) * this.friction;

            p1.x += p1.vx;
            p1.y += p1.vy;

            // Boundary wrapping or bounce
            if (this.wrapBounds) {
                if (p1.x < 0) p1.x += this.width;
                if (p1.x >= this.width) p1.x -= this.width;
                if (p1.y < 0) p1.y += this.height;
                if (p1.y >= this.height) p1.y -= this.height;
            } else {
                if (p1.x < 10) { p1.x = 10; p1.vx *= -0.8; }
                if (p1.x >= this.width - 10) { p1.x = this.width - 10; p1.vx *= -0.8; }
                if (p1.y < 10) { p1.y = 10; p1.vy *= -0.8; }
                if (p1.y >= this.height - 10) { p1.y = this.height - 10; p1.vy *= -0.8; }
            }

            const speed = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy);
            totalVelocity += speed;
        }

        this.averageVelocity = totalVelocity / len;

        // Entropy calculation based on velocity dispersion
        this.entropy = Math.min(1.0, this.averageVelocity * 0.18);

        // Sound update
        if (audioEngine) {
            audioEngine.updateKineticFeedback(this.averageVelocity, this.entropy);
            if (Math.random() < 0.04 && this.particles.length > 0) {
                const sampleP = this.particles[Math.floor(Math.random() * this.particles.length)];
                audioEngine.triggerInteractionChime(sampleP.species, this.averageVelocity);
            }
        }

        // FPS tracker
        this.frameCount++;
        const now = performance.now();
        if (now - this.fpsTimer >= 500) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
            this.frameCount = 0;
            this.fpsTimer = now;
        }
    }

    render() {
        const ctx = this.ctx;

        // Dark background with subtle motion trail
        ctx.fillStyle = 'rgba(5, 7, 13, 0.32)';
        ctx.fillRect(0, 0, this.width, this.height);

        // High performance additive glow
        ctx.globalCompositeOperation = 'lighter';

        const len = this.particles.length;
        const spriteOffset = 14; // half of 28px sprite

        for (let i = 0; i < len; i++) {
            const p = this.particles[i];
            const sprite = this.sprites[p.species];
            ctx.drawImage(sprite, p.x - spriteOffset, p.y - spriteOffset);
        }

        // Render mouse singularity / shockwave reticle
        if (this.interactionForce.active) {
            ctx.strokeStyle = this.interactionForce.type === 'attract' ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 42, 109, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.interactionForce.x, this.interactionForce.y, this.interactionForce.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = this.interactionForce.type === 'attract' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 42, 109, 0.1)';
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
    }
}

window.ParticleSimulation = ParticleSimulation;
