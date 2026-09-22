/**
 * BioGenesis - Procedural Web Audio Engine
 * Generative ambient drone, kinetic feedback, and pentatonic interaction chimes.
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isInitialized = false;
        this.isMuted = true;
        this.masterGain = null;
        this.filterNode = null;
        this.analyser = null;
        this.droneOscs = [];
        this.dataArray = null;

        // Pentatonic scale frequencies in Hz (C Minor Pentatonic)
        this.scale = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 349.23, 392.00, 466.16];
        this.lastChimeTime = 0;
    }

    init() {
        if (this.isInitialized) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            console.warn("Web Audio API is not supported in this browser.");
            return;
        }

        this.ctx = new AudioContextClass();
        
        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

        // Lowpass filter responsive to simulation kinetic energy
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(3.5, this.ctx.currentTime);

        // Analyser for UI HUD visualizer
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        // Connect graph
        this.filterNode.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        this.setupDrones();
        this.isInitialized = true;
    }

    async unlock() {
        if (!this.isInitialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    toggleMute() {
        if (!this.isInitialized) {
            this.init();
        }
        this.unlock();

        this.isMuted = !this.isMuted;
        const now = this.ctx.currentTime;

        if (this.isMuted) {
            this.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
        } else {
            this.masterGain.gain.setTargetAtTime(0.25, now, 0.15);
        }
        return this.isMuted;
    }

    setupDrones() {
        const droneFrequencies = [65.41, 98.00, 130.81, 196.00]; // C2, G2, C3, G3
        droneFrequencies.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            // Slight detune for organic phasing
            osc.detune.setValueAtTime((i - 1.5) * 4.5, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.12 / (i + 1), this.ctx.currentTime);

            osc.connect(gain);
            gain.connect(this.filterNode);
            osc.start();

            this.droneOscs.push({ osc, gain });
        });
    }

    updateKineticFeedback(averageVelocity, entropy) {
        if (!this.isInitialized || this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        // Modulate filter cutoff between 250Hz and 2800Hz based on kinetic energy
        const targetCutoff = Math.min(2800, Math.max(250, 300 + averageVelocity * 450 + entropy * 300));
        this.filterNode.frequency.setTargetAtTime(targetCutoff, now, 0.1);

        // Modulate Q factor with entropy
        const targetQ = Math.min(8.0, Math.max(1.5, 2.0 + entropy * 3.0));
        this.filterNode.Q.setTargetAtTime(targetQ, now, 0.2);
    }

    triggerInteractionChime(speciesIndex, velocity = 1) {
        if (!this.isInitialized || this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        // Throttle chimes to maintain pleasant musical texture
        if (now - this.lastChimeTime < 0.09) return;
        this.lastChimeTime = now;

        const freq = this.scale[speciesIndex % this.scale.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (1 + (speciesIndex > 3 ? 1 : 0)), now);

        const volume = Math.min(0.2, 0.03 + velocity * 0.02);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.46);
    }

    triggerSingularityPulse() {
        if (!this.isInitialized || this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.filterNode);

        osc.start(now);
        osc.stop(now + 0.51);
    }

    getFrequencyData() {
        if (!this.isInitialized || !this.analyser) {
            return new Uint8Array(16);
        }
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}

window.AudioEngine = AudioEngine;
