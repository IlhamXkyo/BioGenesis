/**
 * BioGenesis - Main Application Controller
 * Event handling, UI state synchronization, audio gesture unlocking, and animation loop.
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('sim-canvas');
    const audioVisCanvas = document.getElementById('audio-visualizer');
    const audioVisCtx = audioVisCanvas.getContext('2d');
    const gestureBanner = document.getElementById('gesture-banner');

    // Canvas sizing
    function handleResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        sim.resize(w, h);
    }

    // Instantiate systems
    const audio = new AudioEngine();
    const sim = new ParticleSimulation(canvas);

    // Initial resize to window dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
    const statFps = document.getElementById('stat-fps');
    const statCount = document.getElementById('stat-count');
    const statVelocity = document.getElementById('stat-velocity');
    const statEntropy = document.getElementById('stat-entropy');

    // Controls
    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    const btnMutate = document.getElementById('btn-mutate');
    const btnRandom = document.getElementById('btn-random');
    const btnScreenshot = document.getElementById('btn-screenshot');
    const btnFullscreen = document.getElementById('btn-fullscreen');

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
        sim.rMax = parseInt(e.target.value, 10);
        valRmax.textContent = `${sim.rMax}px`;
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
                    cell.style.backgroundColor = `rgba(0, 240, 255, ${Math.abs(val) * 0.45})`;
                    cell.style.color = '#ffffff';
                } else if (val < 0) {
                    cell.style.backgroundColor = `rgba(255, 42, 109, ${Math.abs(val) * 0.45})`;
                    cell.style.color = '#ffffff';
                } else {
                    cell.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    cell.style.color = '#798ba3';
                }

                // Click to cycle force values
                cell.addEventListener('click', () => {
                    let current = sim.matrix[i][j];
                    current += 0.3;
                    if (current > 1.0) current = -1.0;
                    sim.matrix[i][j] = parseFloat(current.toFixed(1));
                    renderMatrixUI();
                    audio.triggerInteractionChime(i, 2);
                });

                td.appendChild(cell);
                tr.appendChild(td);
            }
            matrixTbody.appendChild(tr);
        }
    }

    renderMatrixUI();

    // Mouse & Touch interaction
    canvas.addEventListener('pointerdown', (e) => {
        unlockAudioGesture();
        sim.interactionForce.active = true;
        sim.interactionForce.x = e.clientX;
        sim.interactionForce.y = e.clientY;
        sim.interactionForce.type = (e.button === 2 || e.shiftKey) ? 'repel' : 'attract';
        audio.triggerSingularityPulse();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (sim.interactionForce.active) {
            sim.interactionForce.x = e.clientX;
            sim.interactionForce.y = e.clientY;
        }
    });

    window.addEventListener('pointerup', () => {
        sim.interactionForce.active = false;
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Spacebar to trigger shockwave
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            unlockAudioGesture();
            sim.interactionForce.active = true;
            sim.interactionForce.type = 'repel';
            audio.triggerSingularityPulse();
            setTimeout(() => {
                sim.interactionForce.active = false;
            }, 300);
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
