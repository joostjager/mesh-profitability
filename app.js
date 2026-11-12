import { hardware, models, profiles, memoryFit } from './data.js';
import { calculate, maximumProfitPerMonth } from './calculator.js';
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
  $('setup-description').textContent = `${machine.name} · ${machine.detail} · single-machine inference`;

  const rows = models.map((model) => {
    const profile = profiles.find((item) => item.hardwareId === hardwareId && item.modelId === model.id);
    const fit = memoryFit(machine, model, profile);
    const quote = quotes.get(model.id);
    const measured = fit.fits && profile;
    const energy = measured ? calculate({ watts: machine.watts, tokensPerSecond: profile.tps, pricePerKwh: 0 }) : null;
    const cost = energy && valid ? energy.kwh * input.valueAsNumber : null;
    const profit = cost !== null && quote.offer ? maximumProfitPerMonth({
      watts: machine.watts, tokensPerSecond: profile.tps,
      pricePerKwh: input.valueAsNumber, outputPricePerMillion: quote.offer.outputPerMillion,
    }).profitPerMonth : null;
    const row = document.createElement('tr');
    row.id = `row-${model.id}`;
    row.dataset.state = !fit.fits ? 'unsupported' : profile ? 'ready' : 'unbenchmarked';
    const quant = profile?.quant ?? model.defaultQuant;
    const status = !fit.fits ? `Over budget · needs ≈${format(fit.requiredGB, 1)} GB`
      : profile ? quant : `${quant} · no benchmark`;
    row.innerHTML = `
      <th scope="row"><span class="model-name">${model.name}</span><span class="model-status">${status}</span></th>
      <td class="speed-cell"><span class="value">${measured ? format(profile.tps) : '—'}</span><span class="cell-note">${fit.fits && !profile ? 'No benchmark' : ''}</span></td>
      <td><span class="value">${fit.fits ? format(machine.watts) : '—'}</span><span class="cell-note">${fit.fits ? 'Wall power estimate' : ''}</span></td>
      <td><span class="value">${energy ? format(energy.kwh, 3) : '—'}</span></td>
      <td class="cost-column"><span class="value cost-value">${cost !== null ? money(cost) : '—'}</span></td>
      <td class="hosted-cell"><span class="value hosted-value"></span><a class="cell-note provider-link" href="https://openrouter.ai/${model.openRouterId}"></a></td>
      <td class="profit-column"><span class="value profit-value">${profit !== null ? money(profit, 2) : '—'}</span><span class="cell-note">${profit !== null ? '30 days · 24/7' : ''}</span></td>`;
    row.querySelector('th').title = `${format(fit.requiredGB, 1)} GB estimated from ${fit.basis} plus 20% headroom; ${fit.availableGB} GB memory budget. Other quantizations and context lengths may change fit.`;
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
$('refresh-prices').addEventListener('click', loadHostedPrices);
loadHostedPrices();
