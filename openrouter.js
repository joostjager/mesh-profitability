export function cheapestOutputOffer(endpoints) {
  const offers = endpoints.filter((endpoint) => {
    const price = endpoint.pricing?.completion;
    return endpoint.status === 0 && endpoint.provider_name
      && (typeof price === 'number' || (typeof price === 'string' && price.trim() !== ''))
      && Number.isFinite(Number(price)) && Number(price) >= 0;
  });
  offers.sort((a, b) => Number(a.pricing.completion) - Number(b.pricing.completion)
    || a.provider_name.localeCompare(b.provider_name));
  const cheapest = offers[0];
  return cheapest ? {
    provider: cheapest.provider_name,
    outputPerMillion: Number(cheapest.pricing.completion) * 1_000_000,
  } : null;
}
