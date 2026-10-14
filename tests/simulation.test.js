const test = require('node:test');
const assert = require('node:assert');
const { ParticleSimulation } = require('../simulation.js');

test('ParticleSimulation - Initialization & Defaults', () => {
    const sim = new ParticleSimulation();

    assert.strictEqual(sim.numSpecies, 6, 'Should have exactly 6 distinct particle species');
    assert.strictEqual(sim.species.length, 6);
    assert.strictEqual(sim.particles.length, 2400, 'Default particle count should be 2400');
    assert.strictEqual(sim.isPaused, false, 'Simulation should start in unpaused state');
    assert.strictEqual(sim.currentPreset, 'mitosis', 'Default preset should be mitosis');
    assert.strictEqual(sim.matrix.length, 6);
    assert.strictEqual(sim.matrix[0].length, 6);
});

test('ParticleSimulation - Presets Integrity', () => {
    const sim = new ParticleSimulation();
    const presets = ['mitosis', 'serpents', 'predator', 'crystalline', 'supernova'];

    for (const name of presets) {
        const loaded = sim.loadPreset(name);
        assert.strictEqual(loaded, true, `Preset ${name} should load successfully`);
        assert.strictEqual(sim.currentPreset, name);

        for (let i = 0; i < sim.numSpecies; i++) {
            for (let j = 0; j < sim.numSpecies; j++) {
                const val = sim.matrix[i][j];
                assert.ok(!isNaN(val), `Matrix entry [${i}][${j}] in ${name} should be a valid number`);
                assert.ok(val >= -1.0 && val <= 1.0, `Matrix entry [${i}][${j}] should be bounded between -1.0 and 1.0`);
            }
        }
    }
});

test('ParticleSimulation - Pause and Resume Lifecycle', () => {
    const sim = new ParticleSimulation();
    assert.strictEqual(sim.isPaused, false);

    const paused = sim.togglePause();
    assert.strictEqual(paused, true);
    assert.strictEqual(sim.isPaused, true);

    const initialPos = { x: sim.particles[0].x, y: sim.particles[0].y };
    sim.step();
    assert.strictEqual(sim.particles[0].x, initialPos.x, 'Particles should not move when paused');
    assert.strictEqual(sim.particles[0].y, initialPos.y, 'Particles should not move when paused');

    const resumed = sim.togglePause();
    assert.strictEqual(resumed, false);
    assert.strictEqual(sim.isPaused, false);
});

test('ParticleSimulation - Particle Operations: Spawn, Clear, Reset', () => {
    const sim = new ParticleSimulation();
    sim.clearParticles();
    assert.strictEqual(sim.particles.length, 0);
    assert.strictEqual(sim.targetCount, 0);
    assert.strictEqual(sim.averageVelocity, 0);

    // Spawn 15 particles of species 3 (Delta)
    sim.spawnParticles(100, 100, 3, 15, 20);
    assert.strictEqual(sim.particles.length, 15);
    for (const p of sim.particles) {
        assert.strictEqual(p.species, 3);
        assert.ok(!isNaN(p.x) && !isNaN(p.y));
        assert.ok(p.x >= 0 && p.x <= sim.width);
        assert.ok(p.y >= 0 && p.y <= sim.height);
    }

    // Reset particles
    sim.resetParticles(500);
    assert.strictEqual(sim.particles.length, 500);
    assert.strictEqual(sim.targetCount, 500);
});

test('ParticleSimulation - Matrix Mutation & Randomization', () => {
    const sim = new ParticleSimulation();
    sim.loadPreset('mitosis');

    sim.mutateMatrix(1.0); // Mutate 100% of cells
    for (let i = 0; i < sim.numSpecies; i++) {
        for (let j = 0; j < sim.numSpecies; j++) {
            const val = sim.matrix[i][j];
            assert.ok(!isNaN(val));
            assert.ok(val >= -1.0 && val <= 1.0, `Mutated value ${val} must stay within [-1.0, 1.0]`);
        }
    }

    sim.randomizeMatrix();
    for (let i = 0; i < sim.numSpecies; i++) {
        for (let j = 0; j < sim.numSpecies; j++) {
            const val = sim.matrix[i][j];
            assert.ok(!isNaN(val));
            assert.ok(val >= -1.0 && val <= 1.0, `Randomized value ${val} must stay within [-1.0, 1.0]`);
        }
    }
});

test('ParticleSimulation - Export & Import Matrix Configuration', () => {
    const sim = new ParticleSimulation();
    sim.loadPreset('crystalline');

    const exported = sim.exportMatrix();
    assert.ok(typeof exported === 'string');

    const parsed = JSON.parse(exported);
    assert.strictEqual(parsed.preset, 'crystalline');
    assert.strictEqual(parsed.matrix.length, 6);

    const newSim = new ParticleSimulation();
    newSim.loadPreset('serpents');

    const success = newSim.importMatrix(exported);
    assert.strictEqual(success, true);
    assert.strictEqual(newSim.currentPreset, 'crystalline');
    assert.deepStrictEqual(newSim.matrix, parsed.matrix);

    // Invalid import should fail gracefully
    assert.strictEqual(newSim.importMatrix('invalid-json'), false);
    assert.strictEqual(newSim.importMatrix({ matrix: [1, 2] }), false);
});

test('ParticleSimulation - Physics Step & Singularity Resolution', () => {
    const sim = new ParticleSimulation();
    sim.clearParticles();

    // Place 2 particles at exact same coordinates (singularity condition)
    sim.particles.push({ x: 200, y: 200, vx: 0, vy: 0, species: 0 });
    sim.particles.push({ x: 200, y: 200, vx: 0, vy: 0, species: 0 });

    sim.step();

    const p1 = sim.particles[0];
    const p2 = sim.particles[1];

    assert.ok(!isNaN(p1.x) && !isNaN(p1.y), 'Particle 1 coordinates must not be NaN');
    assert.ok(!isNaN(p2.x) && !isNaN(p2.y), 'Particle 2 coordinates must not be NaN');
    assert.ok(!isNaN(p1.vx) && !isNaN(p1.vy), 'Particle 1 velocity must not be NaN');
    assert.ok(!isNaN(p2.vx) && !isNaN(p2.vy), 'Particle 2 velocity must not be NaN');

    // Singularity jitter kick should have separated them
    const separated = (p1.x !== p2.x) || (p1.y !== p2.y) || (p1.vx !== 0) || (p2.vx !== 0);
    assert.ok(separated, 'Coincident particles must receive separation jitter');
});
