export function calculate({ watts, tokensPerSecond, pricePerKwh }) {
  if (![watts, tokensPerSecond, pricePerKwh].every(Number.isFinite)
    || watts <= 0 || tokensPerSecond <= 0 || pricePerKwh < 0) {
    throw new RangeError('Enter a non-negative electricity price and positive speed and power.');
  }
  const hours = 1_000_000 / tokensPerSecond / 3600;
  const kwh = watts / 1000 * hours;
  return { hours, kwh, cost: kwh * pricePerKwh };
}

export function maximumProfitPerMonth({ watts, tokensPerSecond, pricePerKwh, outputPricePerMillion, utilizationPercent = 100, idleWatts = 0 }) {
  calculate({ watts, tokensPerSecond, pricePerKwh });
  if (!Number.isFinite(outputPricePerMillion) || outputPricePerMillion < 0) {
    throw new RangeError('Enter a non-negative output price.');
  }
  if (!Number.isFinite(utilizationPercent) || utilizationPercent < 0 || utilizationPercent > 100
    || !Number.isFinite(idleWatts) || idleWatts < 0) {
    throw new RangeError('Enter utilization from 0 to 100 and non-negative power estimates.');
  }
  const hoursPerMonth = 30 * 24;
  const activeHours = hoursPerMonth * utilizationPercent / 100;
  const idleHours = hoursPerMonth - activeHours;
  const outputTokensPerMonth = tokensPerSecond * 3600 * activeHours;
  const revenuePerMonth = outputTokensPerMonth / 1_000_000 * outputPricePerMillion;
  const activeElectricityPerMonth = watts / 1000 * pricePerKwh * activeHours;
  const idleElectricityPerMonth = idleWatts / 1000 * pricePerKwh * idleHours;
  const electricityPerMonth = activeElectricityPerMonth + idleElectricityPerMonth;
  const totalElectricityPerMillion = outputTokensPerMonth > 0 ? electricityPerMonth / (outputTokensPerMonth / 1_000_000) : null;
  return { activeHours, idleHours, outputTokensPerMonth, revenuePerMonth, activeElectricityPerMonth, idleElectricityPerMonth, electricityPerMonth, totalElectricityPerMillion, profitPerMonth: revenuePerMonth - electricityPerMonth };
}
