/**
 * BioGenesis - Main Application Controller
 * Event orchestration, UI state synchronization, gesture unlocking,
 * brush tool management, keyboard shortcuts, and animation loop.
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('sim-canvas');
    const audioVisCanvas = document.getElementById('audio-visualizer');
    const audioVisCtx = audioVisCanvas.getContext('2d');
    const gestureBanner = document.getElementById('gesture-banner');

    // Canvas sizing with devicePixelRatio support for crisp rendering
    function handleResize() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        sim.resize(canvas.width, canvas.height);
    }

    // Instantiate engine systems
    const audio = new AudioEngine();
    const sim = new ParticleSimulation(canvas);

    handleResize();
    window.addEventListener('resize', handleResize);

    // Audio spectrum canvas size
    audioVisCanvas.width = 180;
    audioVisCanvas.height = 28;

    // Gesture unlock helper for Autoplay Policy
    let hasInteracted = false;
    function unlockAudioGesture() {
        if (!hasInteracted) {
            hasInteracted = true;
            audio.unlock();
            if (gestureBanner) {
                gestureBanner.style.display = 'none';
            }
        }
    }

    window.addEventListener('pointerdown', unlockAudioGesture, { once: false });
    window.addEventListener('keydown', unlockAudioGesture, { once: false });

    // HUD Telemetry elements
    const statStatus = document.getElementById('stat-status');
    const statFps = document.getElementById('stat-fps');
    const statCount = document.getElementById('stat-count');
    const statVelocity = document.getElementById('stat-velocity');
    const statEntropy = document.getElementById('stat-entropy');

    // Controls
    const btnPlay = document.getElementById('btn-play');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    const btnReset = document.getElementById('btn-reset');
    const btnClear = document.getElementById('btn-clear');
    const btnMutate = document.getElementById('btn-mutate');
    const btnRandom = document.getElementById('btn-random');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const fileImport = document.getElementById('file-import');
    const btnScreenshot = document.getElementById('btn-screenshot');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    // Tool brush & species picker elements
    const toolButtons = document.querySelectorAll('.tool-btn');
    const speciesSelector = document.getElementById('species-selector');
    const speciesPills = document.querySelectorAll('.sp-pill');

    // Sliders
    const inputFriction = document.getElementById('input-friction');
    const valFriction = document.getElementById('val-friction');
    const inputRmin = document.getElementById('input-rmin');
    const valRmin = document.getElementById('val-rmin');
    const inputRmax = document.getElementById('input-rmax');
    const valRmax = document.getElementById('val-rmax');
    const inputForce = document.getElementById('input-force');
    const valForce = document.getElementById('val-force');
    const inputCount = document.getElementById('input-count');
    const valCount = document.getElementById('val-count');

    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');
    const matrixTbody = document.getElementById('matrix-tbody');

    // Synchronize play/pause state
    function updatePlayPauseUI() {
        if (sim.isPaused) {
            btnPlay.classList.add('paused');
            playIcon.textContent = '▶';
            playText.textContent = 'PLAY';
            if (statStatus) {
                statStatus.textContent = 'PAUSED';
                statStatus.style.color = '#ff2a6d';
            }
        } else {
            btnPlay.classList.remove('paused');
            playIcon.textContent = '⏸';
            playText.textContent = 'PAUSE';
            if (statStatus) {
                statStatus.textContent = 'RUNNING';
                statStatus.style.color = '#00ff77';
            }
        }
    }

    btnPlay.addEventListener('click', () => {
        unlockAudioGesture();
        sim.togglePause();
        updatePlayPauseUI();
    });

    // Sound toggle handler
    btnSound.addEventListener('click', () => {
        unlockAudioGesture();
        const isMuted = audio.toggleMute();
        if (isMuted) {
            btnSound.classList.remove('active');
            soundIcon.textContent = '🔇';
            soundText.textContent = 'AUDIO OFF';
        } else {
            btnSound.classList.add('active');
            soundIcon.textContent = '🔊';
            soundText.textContent = 'AUDIO ON';
        }
    });

    // Reset handler
    function performReset() {
        sim.resetParticles(sim.targetCount || 2400);
        valCount.textContent = sim.particles.length;
        statCount.textContent = sim.particles.length;
        audio.triggerSingularityPulse();
    }

    btnReset.addEventListener('click', () => {
        unlockAudioGesture();
        performReset();
    });

    // Clear handler
    function performClear() {
        sim.clearParticles();
        valCount.textContent = 0;
        statCount.textContent = 0;
        inputCount.value = 0;
        audio.triggerSingularityPulse();
    }

    btnClear.addEventListener('click', () => {
        unlockAudioGesture();
        performClear();
    });

    // Mutate and Randomize handlers
    btnMutate.addEventListener('click', () => {
        sim.mutateMatrix(0.35);
        renderMatrixUI();
        audio.triggerSingularityPulse();
    });

    btnRandom.addEventListener('click', () => {
        sim.randomizeMatrix();
        renderMatrixUI();
        audio.triggerSingularityPulse();
    });

    // Export handler
    btnExport.addEventListener('click', () => {
        const json = sim.exportMatrix();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BioGenesis-${sim.currentPreset || 'matrix'}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Import handler
    btnImport.addEventListener('click', () => {
        fileImport.value = '';
        fileImport.click();
    });

    fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const success = sim.importMatrix(evt.target.result);
            if (success) {
                renderMatrixUI();
                inputFriction.value = sim.friction;
                valFriction.textContent = sim.friction.toFixed(2);
                inputRmin.value = sim.rMin;
                valRmin.textContent = `${sim.rMin}px`;
                inputRmax.value = sim.rMax;
                valRmax.textContent = `${sim.rMax}px`;
                inputForce.value = sim.forceFactor;
                valForce.textContent = sim.forceFactor.toFixed(2);
                audio.triggerSingularityPulse();
            } else {
                alert('Invalid BioGenesis matrix JSON structure.');
            }
        };
        reader.readAsText(file);
    });

    // Screenshot handler
    btnScreenshot.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `BioGenesis-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Fullscreen toggle handler
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.warn(err));
        } else {
            document.exitFullscreen().catch(err => console.warn(err));
        }
    });

    // Brush Tool Handlers
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toolButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tool = btn.getAttribute('data-tool');
            sim.brush.mode = tool;

            if (tool === 'spawn') {
                speciesSelector.style.display = 'block';
            } else {
                speciesSelector.style.display = 'none';
            }
        });
    });

    // Species picker pills
    speciesPills.forEach(pill => {
        pill.addEventListener('click', () => {
            speciesPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            sim.brush.species = parseInt(pill.getAttribute('data-species'), 10);
        });
    });

    // Slider bindings
    inputFriction.addEventListener('input', (e) => {
        sim.friction = parseFloat(e.target.value);
        valFriction.textContent = sim.friction.toFixed(2);
    });

    inputRmin.addEventListener('input', (e) => {
        sim.rMin = parseInt(e.target.value, 10);
        valRmin.textContent = `${sim.rMin}px`;
    });

    inputRmax.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        sim.setRMax(val);
        valRmax.textContent = `${val}px`;
    });

    inputForce.addEventListener('input', (e) => {
        sim.forceFactor = parseFloat(e.target.value);
        valForce.textContent = sim.forceFactor.toFixed(2);
    });

    inputCount.addEventListener('input', (e) => {
        const count = parseInt(e.target.value, 10);
        sim.targetCount = count;
        sim.resetParticles(count);
        valCount.textContent = count;
        statCount.textContent = count;
    });

    // Preset handlers
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const presetName = btn.getAttribute('data-preset');
            sim.loadPreset(presetName);
            renderMatrixUI();
            audio.triggerSingularityPulse();
        });
    });

    // Render interactive force matrix table
    function renderMatrixUI() {
        matrixTbody.innerHTML = '';
        const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

        for (let i = 0; i < sim.numSpecies; i++) {
            const tr = document.createElement('tr');

            const th = document.createElement('th');
            th.textContent = labels[i];
            th.style.color = sim.species[i].color;
            tr.appendChild(th);

            for (let j = 0; j < sim.numSpecies; j++) {
                const td = document.createElement('td');
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';

                const val = sim.matrix[i][j];
                cell.textContent = (val > 0 ? '+' : '') + val.toFixed(1);

                // Color code: Cyan for attraction, Rose for repulsion
                if (val > 0) {
                    cell.style.backgroundColor = `rgba(0, 240, 255, ${Math.min(0.9, Math.abs(val) * 0.45)})`;
                    cell.style.color = '#ffffff';
                } else if (val < 0) {
                    cell.style.backgroundColor = `rgba(255, 42, 109, ${Math.min(0.9, Math.abs(val) * 0.45)})`;
                    cell.style.color = '#ffffff';
                } else {
                    cell.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    cell.style.color = '#798ba3';
                }

                // Left-click to increment value (+0.2)
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    let current = sim.matrix[i][j] + 0.2;
                    if (current > 1.0) current = -1.0;
                    sim.matrix[i][j] = parseFloat(current.toFixed(1));
                    renderMatrixUI();
                    audio.triggerInteractionChime(i, 2);
                });

                // Right-click to decrement value (-0.2)
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    let current = sim.matrix[i][j] - 0.2;
                    if (current < -1.0) current = 1.0;
                    sim.matrix[i][j] = parseFloat(current.toFixed(1));
                    renderMatrixUI();
                    audio.triggerInteractionChime(j, 2);
                });

                td.appendChild(cell);
                tr.appendChild(td);
            }
            matrixTbody.appendChild(tr);
        }
    }

    renderMatrixUI();

    // Map screen coordinates to internal canvas pixel coordinates
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    let isPointerDown = false;
    let spawnTimer = null;

    function applyBrushInteraction(e) {
        const coords = getCanvasCoords(e);
        sim.interactionForce.x = coords.x;
        sim.interactionForce.y = coords.y;

        if (sim.brush.mode === 'spawn') {
            sim.interactionForce.type = 'spawn';
            sim.spawnParticles(coords.x, coords.y, sim.brush.species, sim.brush.spawnRate, 35);
            valCount.textContent = sim.particles.length;
            statCount.textContent = sim.particles.length;
            audio.triggerInteractionChime(sim.brush.species, 1.2);
        } else {
            // Respect right-click or shift key to repel, otherwise follow brush mode
            if (e.button === 2 || e.shiftKey) {
                sim.interactionForce.type = 'repel';
            } else {
                sim.interactionForce.type = sim.brush.mode;
            }
        }
    }

    canvas.addEventListener('pointerdown', (e) => {
        unlockAudioGesture();
        isPointerDown = true;
        sim.interactionForce.active = true;
        applyBrushInteraction(e);

        if (sim.brush.mode === 'spawn') {
            if (spawnTimer) clearInterval(spawnTimer);
            spawnTimer = setInterval(() => {
                if (isPointerDown && sim.brush.mode === 'spawn') {
                    sim.spawnParticles(sim.interactionForce.x, sim.interactionForce.y, sim.brush.species, sim.brush.spawnRate, 35);
                    valCount.textContent = sim.particles.length;
                    statCount.textContent = sim.particles.length;
                }
            }, 80);
        } else {
            audio.triggerSingularityPulse();
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        if (isPointerDown) {
            const coords = getCanvasCoords(e);
            sim.interactionForce.x = coords.x;
            sim.interactionForce.y = coords.y;
            if (sim.brush.mode === 'spawn') {
                sim.spawnParticles(coords.x, coords.y, sim.brush.species, 2, 25);
                valCount.textContent = sim.particles.length;
                statCount.textContent = sim.particles.length;
            }
        }
    });

    window.addEventListener('pointerup', () => {
        isPointerDown = false;
        sim.interactionForce.active = false;
        if (spawnTimer) {
            clearInterval(spawnTimer);
            spawnTimer = null;
        }
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }

        // Spacebar: Pause / Resume simulation
        if (e.code === 'Space') {
            e.preventDefault();
            unlockAudioGesture();
            sim.togglePause();
            updatePlayPauseUI();
        }

        // 'R' Key: Reset particle positions
        if (e.code === 'KeyR') {
            e.preventDefault();
            unlockAudioGesture();
            performReset();
        }

        // 'C' Key: Clear canvas
        if (e.code === 'KeyC') {
            e.preventDefault();
            unlockAudioGesture();
            performClear();
        }

        // 'M' Key: Mutate force matrix
        if (e.code === 'KeyM') {
            e.preventDefault();
            sim.mutateMatrix(0.35);
            renderMatrixUI();
            audio.triggerSingularityPulse();
        }
    });

    // Render mini audio frequency spectrum
    function drawAudioSpectrum() {
        const freqData = audio.getFrequencyData();
        audioVisCtx.clearRect(0, 0, audioVisCanvas.width, audioVisCanvas.height);

        const barCount = 16;
        const barWidth = audioVisCanvas.width / barCount - 1;

        for (let i = 0; i < barCount; i++) {
            const barHeight = (freqData[i] / 255) * audioVisCanvas.height;
            const x = i * (barWidth + 1);
            const y = audioVisCanvas.height - barHeight;

            audioVisCtx.fillStyle = '#00f0ff';
            audioVisCtx.fillRect(x, y, barWidth, barHeight);
        }
    }

    // Telemetry throttling
    let lastUiUpdate = 0;

    // Main animation loop
    function loop(timestamp) {
        sim.step(audio);
        sim.render();
        drawAudioSpectrum();

        if (timestamp - lastUiUpdate > 120) {
            statFps.textContent = sim.fps;
            statVelocity.textContent = sim.averageVelocity.toFixed(2);
            statEntropy.textContent = sim.entropy.toFixed(2);
            lastUiUpdate = timestamp;
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
});
