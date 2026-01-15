
import { CandleData, MarketSymbol, Interval } from '../types';
import { calculateRSI, calculateEMA } from './tradingEngine';

export const fetchKlines = async (
  symbol: MarketSymbol,
  interval: Interval,
  limit: number = 100
): Promise<CandleData[]> => {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  const data = await response.json();

  const candles: CandleData[] = data.map((d: any) => ({
    time: d[0],
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }));

  const prices = candles.map((c) => c.close);
  const rsis = calculateRSI(prices);
  const emas = calculateEMA(prices);

  return candles.map((c, i) => ({
    ...c,
    rsi: rsis[i],
    ema: emas[i],
  }));
};
