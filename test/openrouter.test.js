import test from 'node:test';
import assert from 'node:assert/strict';
import { cheapestOutputOffer } from '../openrouter.js';

const endpoint = (provider, completion, status = 0) => ({
  provider_name: provider, status, pricing: { completion },
});

test('selects the lowest active output price, independently of input price', () => {
  const offers = [
    { ...endpoint('Low input price', '0.000002'), pricing: { prompt: '0', completion: '0.000002' } },
    { ...endpoint('Low output price', '0.000000101'), pricing: { prompt: '0.00001', completion: '0.000000101' } },
    endpoint('Unavailable', '0.00000001', -2),
  ];
  assert.deepEqual(cheapestOutputOffer(offers), { provider: 'Low output price', outputPerMillion: 0.101 });
});

test('ignores missing and invalid prices instead of treating them as free', () => {
  const offers = [null, undefined, '', ' ', 'n/a', -1, Infinity].map((price) => endpoint('Invalid', price));
  assert.equal(cheapestOutputOffer(offers), null);
  assert.equal(cheapestOutputOffer([]), null);
  const offer = cheapestOutputOffer([...offers, endpoint('Valid', '0.0000004')]);
  assert.equal(offer.provider, 'Valid');
  assert.ok(Math.abs(offer.outputPerMillion - 0.4) < 1e-12);
});

test('accepts a genuine zero output rate and breaks price ties by provider name', () => {
  assert.deepEqual(cheapestOutputOffer([endpoint('Free output', '0')]), { provider: 'Free output', outputPerMillion: 0 });
  assert.equal(cheapestOutputOffer([endpoint('Z provider', '0.000001'), endpoint('A provider', '0.000001')]).provider, 'A provider');
});
