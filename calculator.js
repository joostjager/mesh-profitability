export function calculate({ watts, tokensPerSecond, pricePerKwh }) {
  if (![watts, tokensPerSecond, pricePerKwh].every(Number.isFinite)
    || watts <= 0 || tokensPerSecond <= 0 || pricePerKwh < 0) {
    throw new RangeError('Enter a non-negative electricity price and positive speed and power.');
  }
  const hours = 1_000_000 / tokensPerSecond / 3600;
  const kwh = watts / 1000 * hours;
  return { hours, kwh, cost: kwh * pricePerKwh };
}

export function maximumProfitPerMonth({ watts, tokensPerSecond, pricePerKwh, outputPricePerMillion }) {
  calculate({ watts, tokensPerSecond, pricePerKwh });
  if (!Number.isFinite(outputPricePerMillion) || outputPricePerMillion < 0) {
    throw new RangeError('Enter a non-negative output price.');
  }
  const hoursPerMonth = 30 * 24;
  const revenuePerMonth = tokensPerSecond * 3600 / 1_000_000 * outputPricePerMillion * hoursPerMonth;
  const electricityPerMonth = watts / 1000 * pricePerKwh * hoursPerMonth;
  return { revenuePerMonth, electricityPerMonth, profitPerMonth: revenuePerMonth - electricityPerMonth };
}
