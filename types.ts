
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  ema?: number;
}

export type MarketSymbol = "BTCUSDT" | "ETHUSDT" | "BNBUSDT";
export type Interval = "1m" | "3m" | "5m";

export type SignalType = "BUY" | "SELL" | "WAIT";

export interface SignalHistory {
  symbol: MarketSymbol;
  interval: Interval;
  signal: SignalType;
  price: number;
  timestamp: number;
  isCorrect?: boolean;
}

export interface MarketStats {
  signals: SignalHistory[];
  accuracy: number;
  currentPrice: number;
  lastUpdate: number;
}
