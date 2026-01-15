
import { CandleData, SignalType } from '../types';

export const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const rsis: number[] = new Array(prices.length).fill(0);
  if (prices.length <= period) return rsis;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsis[period] = 100 - 100 / (1 + avgGain / (avgLoss || 1));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsis[i] = 100 - 100 / (1 + avgGain / (avgLoss || 1));
  }

  return rsis;
};

export const calculateEMA = (prices: number[], period: number = 20): number[] => {
  const emas: number[] = new Array(prices.length).fill(0);
  if (prices.length === 0) return emas;

  const k = 2 / (period + 1);
  emas[0] = prices[0];

  for (let i = 1; i < prices.length; i++) {
    emas[i] = prices[i] * k + emas[i - 1] * (1 - k);
  }

  return emas;
};

export const generateSignal = (
  data: CandleData[]
): { signal: SignalType; rsi: number; ema: number } => {
  if (data.length < 20) return { signal: "WAIT", rsi: 50, ema: 0 };

  const last = data[data.length - 1];
  const rsi = last.rsi || 50;
  const ema = last.ema || 0;
  const price = last.close;

  let signal: SignalType = "WAIT";

  // Logic: BUY if RSI < 30 and price > EMA
  // Logic: SELL if RSI > 70 and price < EMA
  if (rsi < 30 && price > ema) {
    signal = "BUY";
  } else if (rsi > 70 && price < ema) {
    signal = "SELL";
  }

  return { signal, rsi, ema };
};
