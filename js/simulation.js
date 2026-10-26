/**
 * BioGenesis - Particle Life Physics Engine
 * High-performance spatial grid partitioning, asymmetric force kernels,
 * pre-rendered glowing sprites, robust singularity resolution, and emergent multicellular behavior.
 */

class ParticleSimulation {
    constructor(canvas = null) {
        this.canvas = canvas;
        this.ctx = (canvas && canvas.getContext) ? canvas.getContext('2d', { alpha: false }) : null;
        this.width = canvas ? canvas.width : 1200;
        this.height = canvas ? canvas.height : 800;

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
        this.isPaused = false;
        this.currentPreset = 'mitosis';

        // Spatial grid setup (cell size >= rMax for fast O(N) neighbor lookup)
        this.cellSize = Math.max(40, Math.ceil(this.rMax));
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
        if (typeof document !== 'undefined') {
            this.renderSprites();
        }

        // Telemetry metrics
        this.averageVelocity = 0;
        this.entropy = 0;
        this.fps = 60;
        this.lastFrameTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        this.frameCount = 0;
        this.fpsTimer = this.lastFrameTime;

        // External forces (user mouse interaction)
        this.interactionForce = {
            active: false,
            x: 0,
            y: 0,
            type: 'attract', // 'attract', 'repel', 'spawn'
            radius: 180,
            strength: 1.8
        };

        // Brush mode controller
        this.brush = {
            mode: 'attract', // 'attract', 'repel', 'spawn'
            species: 0,
            radius: 180,
            spawnRate: 6
        };

        // Initialize default population & preset
        this.resetParticles(this.targetCount);
        this.loadPreset('mitosis');
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        if (this.canvas) {
            this.canvas.width = w;
            this.canvas.height = h;
        }

        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
        if (typeof document !== 'undefined') {
            this.renderSprites();
        }
    }

    setRMax(val) {
        this.rMax = val;
        this.cellSize = Math.max(40, Math.ceil(this.rMax));
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
        this.updateGrid();
    }

    initMatrix() {
        this.matrix = [];
        for (let i = 0; i < this.numSpecies; i++) {
            this.matrix[i] = [];
            for (let j = 0; j < this.numSpecies; j++) {
                this.matrix[i][j] = parseFloat((Math.random() * 2 - 1).toFixed(2));
            }
        }
    }

    renderSprites() {
        if (typeof document === 'undefined') return;
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
        this.targetCount = count;
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

    clearParticles() {
        this.particles = [];
        this.targetCount = 0;
        this.averageVelocity = 0;
        this.entropy = 0;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    spawnParticles(x, y, species = 0, count = 1, radius = 30) {
        const clampedSpecies = Math.max(0, Math.min(this.numSpecies - 1, species));
        for (let k = 0; k < count; k++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            let px = x + Math.cos(angle) * dist;
            let py = y + Math.sin(angle) * dist;

            if (this.wrapBounds) {
                px = ((px % this.width) + this.width) % this.width;
                py = ((py % this.height) + this.height) % this.height;
            } else {
                px = Math.max(10, Math.min(this.width - 10, px));
                py = Math.max(10, Math.min(this.height - 10, py));
            }

            this.particles.push({
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                species: clampedSpecies
            });
        }
        this.targetCount = this.particles.length;
    }

    mutateMatrix(rate = 0.25) {
        for (let i = 0; i < this.numSpecies; i++) {
            for (let j = 0; j < this.numSpecies; j++) {
                if (Math.random() < rate) {
                    const delta = (Math.random() * 2 - 1) * 0.45;
                    this.matrix[i][j] = parseFloat(Math.max(-1.0, Math.min(1.0, this.matrix[i][j] + delta)).toFixed(2));
                }
            }
        }
        this.currentPreset = 'custom';
    }

    randomizeMatrix() {
        for (let i = 0; i < this.numSpecies; i++) {
            for (let j = 0; j < this.numSpecies; j++) {
                this.matrix[i][j] = parseFloat((Math.random() * 2 - 1).toFixed(2));
            }
        }
        this.currentPreset = 'custom';
    }

    exportMatrix() {
        return JSON.stringify({
            version: '1.1.0',
            preset: this.currentPreset || 'custom',
            matrix: this.matrix,
            rMin: this.rMin,
            rMax: this.rMax,
            friction: this.friction,
            forceFactor: this.forceFactor
        }, null, 2);
    }

    importMatrix(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (parsed && Array.isArray(parsed.matrix) && parsed.matrix.length === this.numSpecies) {
                for (let i = 0; i < this.numSpecies; i++) {
                    if (Array.isArray(parsed.matrix[i]) && parsed.matrix[i].length === this.numSpecies) {
                        for (let j = 0; j < this.numSpecies; j++) {
                            const val = Number(parsed.matrix[i][j]);
                            this.matrix[i][j] = isNaN(val) ? 0 : parseFloat(Math.max(-1, Math.min(1, val)).toFixed(2));
                        }
                    }
                }
                if (typeof parsed.rMin === 'number') this.rMin = parsed.rMin;
                if (typeof parsed.rMax === 'number') this.setRMax(parsed.rMax);
                if (typeof parsed.friction === 'number') this.friction = parsed.friction;
                if (typeof parsed.forceFactor === 'number') this.forceFactor = parsed.forceFactor;
                this.currentPreset = parsed.preset || 'custom';
                return true;
            }
            return false;
        } catch (e) {
            return false;
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
            this.currentPreset = name;
            for (let i = 0; i < this.numSpecies; i++) {
                for (let j = 0; j < this.numSpecies; j++) {
                    this.matrix[i][j] = presets[name][i][j];
                }
            }
            return true;
        }
        return false;
    }

    updateGrid() {
        const totalCells = this.cols * this.rows;
        if (!this.grid || this.grid.length !== totalCells) {
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
            let col = Math.floor(p.x / this.cellSize);
            let row = Math.floor(p.y / this.cellSize);

            if (col < 0) col = 0;
            if (col >= this.cols) col = this.cols - 1;
            if (row < 0) row = 0;
            if (row >= this.rows) row = this.rows - 1;

            const cellIndex = row * this.cols + col;
            this.grid[cellIndex].push(i);
        }
    }

    step(audioEngine = null) {
        if (this.isPaused) {
            if (audioEngine && typeof audioEngine.updateKineticFeedback === 'function') {
                audioEngine.updateKineticFeedback(0, 0);
            }
            return;
        }

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
            let col = Math.floor(p1.x / this.cellSize);
            let row = Math.floor(p1.y / this.cellSize);

            if (col < 0) col = 0;
            if (col >= this.cols) col = this.cols - 1;
            if (row < 0) row = 0;
            if (row >= this.rows) row = this.rows - 1;

            let fx = 0;
            let fy = 0;

            for (let ox = -1; ox <= 1; ox++) {
                let neighborCol = col + ox;
                if (this.wrapBounds) {
                    neighborCol = ((neighborCol % this.cols) + this.cols) % this.cols;
                } else if (neighborCol < 0 || neighborCol >= this.cols) {
                    continue;
                }

                for (let oy = -1; oy <= 1; oy++) {
                    let neighborRow = row + oy;
                    if (this.wrapBounds) {
                        neighborRow = ((neighborRow % this.rows) + this.rows) % this.rows;
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
                        } else if (dSq <= 0.0001) {
                            // Singularity repulsion jitter: break overlap stagnation
                            const randAngle = Math.random() * Math.PI * 2;
                            fx += Math.cos(randAngle) * 0.75;
                            fy += Math.sin(randAngle) * 0.75;
                        }
                    }
                }
            }

            // Mouse interaction (Singularity / Shockwave / Vortex)
            if (this.interactionForce.active && this.interactionForce.type !== 'spawn') {
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

        this.averageVelocity = len > 0 ? totalVelocity / len : 0;

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
        const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        if (now - this.fpsTimer >= 500) {
            this.fps = Math.round((this.frameCount * 1000) / Math.max(1, (now - this.fpsTimer)));
            this.frameCount = 0;
            this.fpsTimer = now;
        }
    }

    render() {
        if (!this.ctx) return;
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
            if (sprite) {
                ctx.drawImage(sprite, p.x - spriteOffset, p.y - spriteOffset);
            }
        }

        // Render interactive reticle
        if (this.interactionForce.active) {
            ctx.save();
            if (this.interactionForce.type === 'spawn') {
                const spColor = this.species[this.brush.species]?.color || '#00f0ff';
                ctx.strokeStyle = spColor;
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.interactionForce.x, this.interactionForce.y, this.interactionForce.radius * 0.35, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeStyle = this.interactionForce.type === 'attract' ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 42, 109, 0.55)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.interactionForce.x, this.interactionForce.y, this.interactionForce.radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = this.interactionForce.type === 'attract' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 42, 109, 0.10)';
                ctx.fill();
            }
            ctx.restore();
        }

        // Render pause notification banner if simulation is paused
        if (this.isPaused) {
            ctx.save();
            ctx.fillStyle = 'rgba(5, 7, 13, 0.75)';
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.font = 'bold 18px "JetBrains Mono", monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⏸ SIMULATION PAUSED', this.width / 2, this.height / 2 - 12);

            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillStyle = '#798ba3';
            ctx.fillText('PRESS [SPACEBAR] OR CLICK PLAY IN ACTION BAR TO RESUME', this.width / 2, this.height / 2 + 18);
            ctx.restore();
        }

        ctx.globalCompositeOperation = 'source-over';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleSimulation };
}

if (typeof window !== 'undefined') {
    window.ParticleSimulation = ParticleSimulation;
}
