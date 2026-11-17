import { hardware, models, profiles, memoryFit } from './data.js';
import { calculate, maximumProfitPerMonth } from './calculator.js?v=utilization';
import { cheapestOutputOffer } from './openrouter.js';

const $ = (id) => document.getElementById(id);
const format = (value, digits = 2) => value.toLocaleString('en-US', { maximumFractionDigits: digits });
const money = (value, digits = 3, maximumDigits = digits) => value.toLocaleString('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: digits,
  maximumFractionDigits: value !== 0 && Math.abs(value) < 0.001 ? 6 : maximumDigits,
});
let hardwareId = hardware[0].id;
const quotes = new Map(models.map((model) => [model.id, { status: 'loading' }]));

const gpuIcon = '<svg viewBox="0 0 40 32" fill="none" aria-hidden="true"><rect x="4" y="5" width="32" height="21" rx="3"/><circle cx="15" cy="15.5" r="6"/><path d="M15 9.5v12m-6-6h12M25 11h6m-6 5h6m-6 5h6M9 26v3m5-3v3m5-3v3m5-3v3"/></svg>';
const macIcon = '<svg viewBox="0 0 40 32" fill="none" aria-hidden="true"><rect x="5" y="11" width="30" height="16" rx="4"/><path d="M5 17h30M11 22h6m10 0h2M10 8h20"/></svg>';

for (const item of hardware) {
  const label = document.createElement('label');
  label.className = 'hardware-option';
  label.innerHTML = `<input type="radio" name="hardware" value="${item.id}" ${item.id === hardwareId ? 'checked' : ''}><span class="hardware-card"><span class="hardware-card-top">${item.kind === 'gpu' ? gpuIcon : macIcon}<span class="radio-dot"></span></span><strong>${item.name}</strong><span class="hardware-detail">${item.detail}</span></span>`;
  $('hardware-options').append(label);
}

function render() {
  const machine = hardware.find((item) => item.id === hardwareId);
  const input = $('electricity-price');
  const valid = input.value.trim() !== '' && input.validity.valid;
  input.setAttribute('aria-invalid', String(!valid));
  $('validation').hidden = valid;
  const idleWatts = machine.idleWatts;
  const utilizationPercent = $('utilization').valueAsNumber;
  $('utilization-value').value = `${utilizationPercent}%`;
  $('profit-period').textContent = `USD · 30 days · ${utilizationPercent}% utilized`;
  $('idle-power-note').textContent = machine.idleGpuWatts !== undefined
    ? `Estimated idle: ${idleWatts} W total (${machine.idleGpuWatts} W measured GPUs + ${machine.activeOverheadWatts} W estimated host).`
    : `Estimated idle: ${idleWatts} W for the whole setup.`;
  $('idle-power-note').title = machine.idleNote;
  $('setup-description').textContent = `${machine.name} · ${machine.detail} · ${machine.setup ?? 'single-machine inference'}`;
  $('configuration-note').hidden = !machine.note;
  $('configuration-note').textContent = machine.note ?? '';

  const rows = models.map((model) => {
    const profile = profiles.find((item) => item.hardwareId === hardwareId && item.modelId === model.id);
    const fit = memoryFit(machine, model, profile);
    const quote = quotes.get(model.id);
    const measured = fit.fits && profile;
    const watts = profile?.watts ?? machine.watts;
    const energy = measured ? calculate({ watts, tokensPerSecond: profile.tps, pricePerKwh: 0 }) : null;
    const cost = energy && valid ? energy.kwh * input.valueAsNumber : null;
    const monthly = cost !== null && (quote.offer || utilizationPercent === 0) ? maximumProfitPerMonth({
      watts, tokensPerSecond: profile.tps,
      pricePerKwh: input.valueAsNumber, outputPricePerMillion: quote.offer?.outputPerMillion ?? 0,
      utilizationPercent, idleWatts, activeOverheadWatts: machine.activeOverheadWatts,
    }) : null;
    const profit = monthly?.profitPerMonth ?? null;
    const row = document.createElement('tr');
    row.id = `row-${model.id}`;
    row.dataset.state = !fit.fits ? 'unsupported' : profile ? 'ready' : 'unbenchmarked';
    const quant = profile?.quant ?? model.defaultQuant;
    const status = !fit.fits ? `Over budget · needs ≈${format(fit.requiredGB, 1)} GB`
      : profile ? quant : `${quant} · no benchmark`;
    row.innerHTML = `
      <th scope="row"><span class="model-name">${model.name}</span><span class="model-status">${status}</span></th>
      <td class="speed-cell"><span class="value">${measured ? format(profile.tps) : '—'}</span><span class="cell-note">${measured ? profile.speedLabel ?? '' : fit.fits ? 'No benchmark' : ''}</span></td>
      <td class="power-cell"><span class="value">${fit.fits && watts !== undefined ? format(watts) : '—'}</span><span class="cell-note">${fit.fits && watts !== undefined ? profile?.powerLabel ?? 'Unverified wall estimate' : ''}</span><span class="cell-note">${measured && machine.activeOverheadWatts ? `Monthly active ≈${format(watts + machine.activeOverheadWatts)} W` : ''}</span></td>
      <td><span class="value">${energy ? format(energy.kwh, 3) : '—'}</span><span class="cell-note">${energy ? profile.energyLabel ?? '' : ''}</span></td>
      <td class="cost-column"><span class="value cost-value">${cost !== null ? money(cost) : '—'}</span><span class="cell-note">${cost !== null && profile.gpuJoulesPerToken ? 'GPU decode only' : ''}</span></td>
      <td class="hosted-cell"><span class="value hosted-value"></span><a class="cell-note provider-link" href="https://openrouter.ai/${model.openRouterId}"></a></td>
      <td class="profit-column"><span class="value profit-value">${profit !== null ? money(profit, 2) : '—'}</span><span class="cell-note">${monthly ? `Idle electricity: ${money(monthly.idleElectricityPerMonth, 2)}` : ''}</span><span class="cell-note">${monthly && machine.activeOverheadWatts ? 'Includes estimated host power' : ''}</span></td>`;
    row.querySelector('th').title = `${format(fit.requiredGB, 1)} GB estimated from ${fit.basis} plus 20% headroom; ${fit.availableGB} GB memory budget. Other quantizations and context lengths may change fit.`;
    row.querySelector('.power-cell').title = profile?.powerNote ?? machine.powerNote ?? 'No power benchmark for this pairing.';
    if (monthly) row.querySelector('.profit-column').title = `30-day output revenue: ${money(monthly.revenuePerMonth, 2)}. Active electricity: ${money(monthly.activeElectricityPerMonth, 2)} (${format(monthly.activeHours, 1)} h at ${format(watts + machine.activeOverheadWatts)} W). Idle electricity: ${money(monthly.idleElectricityPerMonth, 2)} (${format(monthly.idleHours, 1)} h at ${format(idleWatts)} W). ${machine.idleNote}`;
    if (measured) {
      const link = document.createElement('a');
      link.className = 'cell-note benchmark-link';
      link.href = profile.sourceUrl;
      link.textContent = 'Benchmark ↗';
      link.title = profile.note;
      row.querySelector('.speed-cell').append(link);
    }
    row.querySelector('.hosted-value').textContent = quote.offer ? money(quote.offer.outputPerMillion, 3, 6)
      : quote.status === 'loading' ? '…' : 'Unavailable';
    row.querySelector('.provider-link').textContent = quote.offer ? `${quote.offer.provider} ↗`
      : quote.status === 'loading' ? 'Checking providers' : 'View providers ↗';
    if (profit !== null) row.querySelector('.profit-value').classList.add(profit < 0 ? 'negative' : 'positive');
    return { row, profit };
  });
  rows.sort((a, b) => {
    if (a.profit === null) return b.profit === null ? 0 : 1;
    if (b.profit === null) return -1;
    return b.profit - a.profit;
  });
  $('model-rows').replaceChildren(...rows.map(({ row }) => row));
}

async function loadHostedPrices() {
  $('refresh-prices').disabled = true;
  $('hosted-status').textContent = 'Fetching current OpenRouter prices…';
  for (const model of models) quotes.set(model.id, { status: 'loading' });
  render();
  await Promise.all(models.map(async (model) => {
    try {
      const response = await fetch(`https://openrouter.ai/api/v1/models/${model.openRouterId}/endpoints`, {
        credentials: 'omit', signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('OpenRouter prices unavailable');
      const payload = await response.json();
      quotes.set(model.id, { status: 'ready', offer: cheapestOutputOffer(payload.data.endpoints) });
    } catch {
      quotes.set(model.id, { status: 'error' });
    }
    render();
  }));
  const unavailable = [...quotes.values()].filter((quote) => !quote.offer).length;
  $('hosted-status').textContent = `Checked ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${unavailable ? ` · ${unavailable} unavailable` : ''}`;
  $('refresh-prices').disabled = false;
}

$('hardware-options').addEventListener('change', (event) => {
  hardwareId = event.target.value;
  render();
});
$('electricity-price').addEventListener('input', render);
$('utilization').addEventListener('input', render);
$('refresh-prices').addEventListener('click', loadHostedPrices);
loadHostedPrices();
