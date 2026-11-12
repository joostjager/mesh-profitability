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
    for (const machine of hardware.filter((item) => item.id !== studio.id)) {
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
    assert.ok(Number.isFinite(calculate({ watts: machine.watts, tokensPerSecond: profile.tps, pricePerKwh: 0.2 }).cost));
    const pair = `${profile.hardwareId}/${profile.modelId}`;
    assert.ok(!pairs.has(pair));
    pairs.add(pair);
  }
  for (const machine of hardware) assert.ok(profiles.some((item) => item.hardwareId === machine.id));
  for (const model of models) assert.ok(profiles.some((item) => item.modelId === model.id));
});
