import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate, maximumProfitPerMonth } from '../calculator.js';
import { hardware, models, profiles, memoryFit } from '../data.js';

test('converts output time into whole-machine energy and electricity cost', () => {
  const result = calculate({ watts: 360, tokensPerSecond: 100, pricePerKwh: 0.20 });
  assert.equal(result.hours, 25 / 9);
  assert.ok(Math.abs(result.kwh - 1) < 1e-12);
  assert.ok(Math.abs(result.cost - 0.20) < 1e-12);
});

test('price and power scale cost linearly; doubling speed halves it', () => {
  const base = { watts: 350, tokensPerSecond: 47.62, pricePerKwh: 0.20 };
  const { cost } = calculate(base);
  assert.ok(Math.abs(cost - 0.4083251668299967) < 1e-12);
  assert.equal(calculate({ ...base, pricePerKwh: 0.40 }).cost, cost * 2);
  assert.equal(calculate({ ...base, watts: 700 }).cost, cost * 2);
  assert.equal(calculate({ ...base, tokensPerSecond: 95.24 }).cost, cost / 2);
  assert.equal(calculate({ ...base, pricePerKwh: 0 }).cost, 0);
});

test('rejects invalid inputs rather than producing misleading costs', () => {
  const base = { watts: 100, tokensPerSecond: 50, pricePerKwh: 0.20 };
  for (const field of Object.keys(base)) {
    for (const value of [-1, NaN, Infinity, undefined, '100']) {
      assert.throws(() => calculate({ ...base, [field]: value }), RangeError);
    }
  }
  for (const field of ['watts', 'tokensPerSecond']) {
    assert.throws(() => calculate({ ...base, [field]: 0 }), RangeError);
  }
});

test('maximum 30-day profit subtracts electricity from continuous output revenue', () => {
  const inputs = { watts: 360, tokensPerSecond: 100, pricePerKwh: 0.20, outputPricePerMillion: 0.5 };
  const result = maximumProfitPerMonth(inputs);
  assert.ok(Math.abs(result.revenuePerMonth - 129.6) < 1e-12);
  assert.ok(Math.abs(result.electricityPerMonth - 51.84) < 1e-12);
  assert.ok(Math.abs(result.profitPerMonth - 77.76) < 1e-12);
  assert.ok(maximumProfitPerMonth({ ...inputs, outputPricePerMillion: 0.1 }).profitPerMonth < 0);
  assert.ok(Math.abs(maximumProfitPerMonth({ ...inputs, outputPricePerMillion: 0 }).profitPerMonth + 51.84) < 1e-12);
  assert.equal(maximumProfitPerMonth({ ...inputs, pricePerKwh: 0 }).profitPerMonth, result.revenuePerMonth);
  for (const value of [-1, NaN, Infinity, undefined]) {
    assert.throws(() => maximumProfitPerMonth({ ...inputs, outputPricePerMillion: value }), RangeError);
  }
});

test('utilization splits a powered-on month into active and idle electricity', () => {
  const inputs = { watts: 400, activeOverheadWatts: 100, idleWatts: 280, tokensPerSecond: 90, pricePerKwh: 0.20, outputPricePerMillion: 0.0784 };
  const full = maximumProfitPerMonth({ ...inputs, utilizationPercent: 100 });
  assert.equal(full.activeHours, 720);
  assert.equal(full.idleElectricityPerMonth, 0);
  assert.ok(Math.abs(full.activeElectricityPerMonth - 72) < 1e-12);
  const idle = maximumProfitPerMonth({ ...inputs, utilizationPercent: 0 });
  assert.equal(idle.revenuePerMonth, 0);
  assert.equal(idle.activeElectricityPerMonth, 0);
  assert.equal(idle.idleHours, 720);
  assert.ok(Math.abs(idle.profitPerMonth + 40.32) < 1e-12);
  const half = maximumProfitPerMonth({ ...inputs, utilizationPercent: 50 });
  assert.equal(half.revenuePerMonth, full.revenuePerMonth / 2);
  assert.ok(Math.abs(half.activeElectricityPerMonth - 36) < 1e-12);
  assert.ok(Math.abs(half.idleElectricityPerMonth - 20.16) < 1e-12);
  assert.ok(Math.abs(half.profitPerMonth + 47.015424) < 1e-10);
  const free = maximumProfitPerMonth({ ...inputs, utilizationPercent: 50, pricePerKwh: 0 });
  assert.equal(free.profitPerMonth, half.revenuePerMonth);
  const noIdle = maximumProfitPerMonth({ ...inputs, utilizationPercent: 50, idleWatts: 0 });
  assert.equal(noIdle.electricityPerMonth, half.activeElectricityPerMonth);
  for (const [field, values] of Object.entries({
    utilizationPercent: [-1, 101, NaN, Infinity, '50', null],
    idleWatts: [-1, NaN, Infinity, '280', null],
    activeOverheadWatts: [-1, NaN, Infinity, '100', null],
  })) {
    for (const value of values) assert.throws(() => maximumProfitPerMonth({ ...inputs, [field]: value }), RangeError);
  }
});

test('all six setups retain documented idle assumptions and the H200 measured GPU idle draw', () => {
  const assumptions = JSON.parse(readFileSync(new URL('../data/power-assumptions.json', import.meta.url)));
  assert.equal(assumptions.records.length, hardware.length);
  for (const machine of hardware) {
    const record = assumptions.records.find((item) => item.hardware_id === machine.id);
    assert.equal(machine.idleWatts, record.idle_watts);
    assert.equal(machine.activeOverheadWatts, record.active_overhead_watts);
    const idle = maximumProfitPerMonth({ watts: 1, tokensPerSecond: 1, pricePerKwh: 0.20, outputPricePerMillion: 0, utilizationPercent: 0, idleWatts: machine.idleWatts });
    assert.ok(Math.abs(idle.profitPerMonth + machine.idleWatts * 0.144) < 1e-10);
  }
  const h200 = hardware.find((item) => item.id === 'h200nvl2');
  const source = JSON.parse(readFileSync(new URL('../data/glm53-h200nvl-benchmark.json', import.meta.url)));
  assert.equal(h200.idleGpuWatts, 180);
  assert.equal(h200.idleGpuWatts, source.idle_gpu_watts);
  assert.equal(h200.idleWatts, h200.idleGpuWatts + h200.activeOverheadWatts);
});

test('memory budget and benchmark availability remain separate', () => {
  const gpu24 = hardware.find((item) => item.id === 'rtx4090');
  const gpu32 = hardware.find((item) => item.id === 'rtx5090');
  const qwen36 = models.find((item) => item.id === 'qwen36');
  assert.equal(memoryFit(gpu24, qwen36).fits, false);
  assert.equal(memoryFit(gpu32, qwen36).fits, true);
  const gemma = models.find((item) => item.id === 'gemma4');
  assert.equal(memoryFit(gpu24, gemma).fits, true);
  assert.ok(!profiles.some((item) => item.hardwareId === gpu24.id && item.modelId === gemma.id));
  for (const profile of profiles) {
    assert.equal(memoryFit(hardware.find((item) => item.id === profile.hardwareId), models.find((item) => item.id === profile.modelId)).fits, true);
  }
});

test('512 GB Studio has measured profiles for the larger models while smaller machines exceed budget', () => {
  const studio = hardware.find((item) => item.id === 'm3ultra');
  assert.equal(studio.memoryGB, 512);
  for (const id of ['glm53', 'minimaxm3']) {
    const model = models.find((item) => item.id === id);
    const profile = profiles.find((item) => item.hardwareId === studio.id && item.modelId === id);
    assert.ok(profile);
    assert.equal(memoryFit(studio, model, profile).fits, true);
    for (const machine of hardware.filter((item) => item.id !== studio.id && !item.nodeCount && !item.gpuCount)) {
      assert.equal(memoryFit(machine, model).fits, false);
    }
  }
});

test('every selectable pairing retains its exact source and a finite result', () => {
  const sources = JSON.parse(readFileSync(new URL('../data/benchmark-sources.json', import.meta.url)));
  const pairs = new Set();
  for (const profile of profiles) {
    const machine = hardware.find((item) => item.id === profile.hardwareId);
    assert.ok(machine);
    assert.ok(models.some((item) => item.id === profile.modelId));
    const source = sources.records.find((item) => item.id === profile.recordId);
    assert.ok(source);
    assert.equal(profile.tps, Number(source.tps));
    assert.equal(profile.sourceUrl, source.source_url);
    assert.ok(Number.isFinite(calculate({ watts: profile.watts ?? machine.watts, tokensPerSecond: profile.tps, pricePerKwh: 0.2 }).cost));
    const pair = `${profile.hardwareId}/${profile.modelId}`;
    assert.ok(!pairs.has(pair));
    pairs.add(pair);
  }
  for (const machine of hardware) assert.ok(profiles.some((item) => item.hardwareId === machine.id));
  for (const model of models) assert.ok(profiles.some((item) => item.modelId === model.id));
});

test('eight-laptop estimate uses the slowest measured slice and counts GPU energy once', () => {
  const report = JSON.parse(readFileSync(new URL('../data/glm53-m3max-slice-benchmark.json', import.meta.url)));
  const machine = hardware.find((item) => item.id === 'm3max8');
  const profile = profiles.find((item) => item.hardwareId === machine.id);
  assert.equal(machine.nodeCount, report.stages.length);
  assert.equal(machine.memoryGB / machine.nodeCount, 64);
  const slowestMs = Math.max(...report.stages.map((stage) => stage.measurement.decode_ms_per_output_token));
  const joules = report.stages.reduce((sum, stage) => sum + stage.measurement.energy.decode.estimated_total_sensor_joules_per_token, 0);
  assert.ok(Math.abs(profile.tps - 1000 / slowestMs) < 1e-10);
  assert.ok(Math.abs(profile.gpuJoulesPerToken - joules) < 1e-10);
  const energy = calculate({ watts: profile.watts, tokensPerSecond: profile.tps, pricePerKwh: 0.20 });
  assert.ok(Math.abs(energy.kwh - joules / 3.6) < 1e-12);
  assert.ok(Math.abs(energy.cost - 0.056291660936850056) < 1e-12);
  const fit = memoryFit(machine, models.find((model) => model.id === profile.modelId), profile);
  const largestStageGB = Math.max(...report.stages.map((stage) => stage.resident_tensor_bytes)) / 1e9;
  assert.equal(profile.stageTensorGB, largestStageGB);
  assert.equal(fit.availableGB, 48);
  assert.equal(fit.fits, true);
  assert.equal(memoryFit({ ...machine, memoryGB: 8 * 32 }, models.find((model) => model.id === profile.modelId), profile).fits, false);
  assert.equal(machine.watts, undefined, 'do not transfer GLM power to unbenchmarked models');
});

test('dual H200 benchmark uses combined GPU power and the reported single-request speed', () => {
  const source = JSON.parse(readFileSync(new URL('../data/glm53-h200nvl-benchmark.json', import.meta.url)));
  const machine = hardware.find((item) => item.id === 'h200nvl2');
  const profile = profiles.find((item) => item.hardwareId === machine.id);
  assert.equal(machine.gpuCount, 2);
  assert.equal(profile.tps, source.tps);
  assert.equal(profile.watts, source.power_w);
  assert.equal(profile.gpuJoulesPerToken, 400 / 90);
  const inputs = { watts: profile.watts, tokensPerSecond: profile.tps, pricePerKwh: 0.20 };
  const energy = calculate(inputs);
  assert.ok(Math.abs(energy.kwh - 1.2345679012345678) < 1e-12);
  assert.ok(Math.abs(energy.cost - 0.24691358024691357) < 1e-12);
  const monthly = maximumProfitPerMonth({ ...inputs, outputPricePerMillion: 0.0784 });
  assert.ok(Math.abs(monthly.electricityPerMonth - 57.60) < 1e-12);
  assert.ok(Math.abs(monthly.profitPerMonth - (-39.310848)) < 1e-10);
  const fit = memoryFit(machine, models.find((item) => item.id === profile.modelId), profile);
  assert.equal(fit.basis, 'weight size');
  assert.equal(fit.requiredGB, 199.71 * 1.2);
  assert.equal(fit.fits, true);
  assert.equal(machine.watts, undefined, 'do not transfer GLM power to unbenchmarked models');
});
