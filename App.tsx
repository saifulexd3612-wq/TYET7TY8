
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchKlines } from './services/binanceService';
import { generateSignal } from './services/tradingEngine';
import { MarketSymbol, Interval, CandleData, SignalHistory, MarketStats, SignalType } from './types';
import TradingChart from './components/TradingChart';
import SignalBadge from './components/SignalBadge';
import AIAnalysis from './components/AIAnalysis';
import { Activity, Clock, TrendingUp, ShieldCheck, AlertCircle, History, LayoutDashboard, Zap, Radio } from 'lucide-react';

const MARKETS: MarketSymbol[] = ["BTCUSDT", "ETHUSDT", "BNBUSDT"];
const INTERVALS: Interval[] = ["1m", "3m", "5m"];

const App: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketSymbol>("BTCUSDT");
  const [selectedInterval, setSelectedInterval] = useState<Interval>("1m");
  const [marketData, setMarketData] = useState<CandleData[]>([]);
  const [stats, setStats] = useState<Record<MarketSymbol, MarketStats>>({
    BTCUSDT: { signals: [], accuracy: 0, currentPrice: 0, lastUpdate: Date.now() },
    ETHUSDT: { signals: [], accuracy: 0, currentPrice: 0, lastUpdate: Date.now() },
    BNBUSDT: { signals: [], accuracy: 0, currentPrice: 0, lastUpdate: Date.now() },
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSignal, setLastSignal] = useState<{signal: SignalType, rsi: number, ema: number} | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize as null but type as any to avoid NodeJS vs Browser conflict
  const fetchTimer = useRef<any>(null);

  const updateMarketInfo = useCallback(async () => {
    setIsSyncing(true);
    console.log(`[Bot] Syncing ${selectedMarket} (${selectedInterval})...`);
    try {
      const data = await fetchKlines(selectedMarket, selectedInterval);
      
      if (!data || data.length === 0) {
        throw new Error("Empty response from Binance cluster");
      }
      
      setMarketData(data);
      setError(null);
      
      const { signal, rsi, ema } = generateSignal(data);
      setLastSignal({ signal, rsi, ema });

      const lastPrice = data[data.length - 1].close;
      const prevPrice = data[data.length - 2].close;

      setStats(prev => {
        const currentStats = prev[selectedMarket];
        let newSignals = [...currentStats.signals];
        
        if (signal !== "WAIT") {
          const lastLogged = newSignals[newSignals.length - 1];
          // Log signal if it's new or at least 30 seconds since last log of same type
          if (!lastLogged || (Date.now() - lastLogged.timestamp > 30000)) {
            const isCorrect = (signal === "BUY" && lastPrice > prevPrice) || (signal === "SELL" && lastPrice < prevPrice);
            newSignals.push({
              symbol: selectedMarket,
              interval: selectedInterval,
              signal,
              price: lastPrice,
              timestamp: Date.now(),
              isCorrect
            });
            if (newSignals.length > 50) newSignals.shift();
          }
        }

        const correctCount = newSignals.filter(s => s.isCorrect).length;
        const accuracy = newSignals.length > 0 ? (correctCount / newSignals.length) * 100 : 0;

        return {
          ...prev,
          [selectedMarket]: {
            ...currentStats,
            currentPrice: lastPrice,
            lastUpdate: Date.now(),
            signals: newSignals,
            accuracy: parseFloat(accuracy.toFixed(2))
          }
        };
      });
      
      setLoading(false);
    } catch (err: any) {
      console.error("[Bot Error]", err);
      setError(err.message || "Network Error");
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [selectedMarket, selectedInterval]);

  useEffect(() => {
    setLoading(true);
    updateMarketInfo();
    
    // Auto-refresh every 5 seconds
    fetchTimer.current = setInterval(updateMarketInfo, 5000);
    
    return () => {
      if (fetchTimer.current) clearInterval(fetchTimer.current);
    };
  }, [updateMarketInfo]);

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#030712]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Activity className="text-white w-6 h-6" />
              </div>
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#030712] ${isSyncing ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`}></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CryptoPulse <span className="text-indigo-500">AI</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-1">
                {isSyncing ? "Syncing Clusters..." : "Autonomous Monitoring Active"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-xl border border-gray-800">
            {MARKETS.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMarket(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedMarket === m 
                    ? "bg-gray-800 text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m.replace("USDT", "")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-xl border border-gray-800">
            {INTERVALS.map(i => (
              <button
                key={i}
                onClick={() => setSelectedInterval(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedInterval === i 
                    ? "bg-indigo-600/20 text-indigo-400" 
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Error Notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm font-medium">System Alert: {error}. Retrying connection...</div>
          </div>
        )}

        {/* Status Banner */}
        {!loading && !error && lastSignal?.signal === "WAIT" && (
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-200">Scanning for entry signals...</p>
                <p className="text-[10px] text-indigo-400/60 font-mono uppercase tracking-widest">
                  RSI Targets: &lt;30 (BUY) | &gt;70 (SELL) • Current: {lastSignal.rsi.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-gray-500">
              <span>EMA: ${lastSignal.ema.toLocaleString()}</span>
              <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
              <span>VOL: {marketData[marketData.length-1]?.volume.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Market Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 group hover:border-gray-700 transition-colors">
            <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Price</p>
              <p className="text-lg font-bold font-mono text-white">
                ${stats[selectedMarket].currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 group hover:border-gray-700 transition-colors">
            <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Success Rate</p>
              <p className="text-lg font-bold font-mono text-white">
                {stats[selectedMarket].accuracy}%
              </p>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 group hover:border-gray-700 transition-colors">
            <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Heartbeat</p>
              <p className="text-lg font-bold font-mono text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE
              </p>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 group hover:border-gray-700 transition-colors">
            <div className="p-3 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-colors">
              <Zap className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">RSI (14)</p>
              <p className="text-lg font-bold font-mono text-white">
                {lastSignal?.rsi.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Chart and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold">{selectedMarket} Market Flow</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded">
                    LATEST: ${stats[selectedMarket].currentPrice.toFixed(2)}
                  </div>
                  {lastSignal && <SignalBadge signal={lastSignal.signal} />}
                </div>
              </div>
              
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 font-medium">Booting Analytics Engine</p>
                    <p className="text-[10px] text-gray-600 font-mono mt-1">Connecting to Global Data Streams...</p>
                  </div>
                </div>
              ) : (
                <TradingChart data={marketData} symbol={selectedMarket} />
              )}
              
              {!loading && !error && <AIAnalysis symbol={selectedMarket} data={marketData} />}
            </div>

            {/* Indicator Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <AlertCircle className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold">Relative Strength</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Momentum Intensity</span>
                    <span className={`font-mono font-bold ${lastSignal && lastSignal.rsi < 30 ? 'text-emerald-400' : lastSignal && lastSignal.rsi > 70 ? 'text-rose-400' : 'text-indigo-400'}`}>
                      {lastSignal?.rsi.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden p-0.5 border border-gray-700/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        lastSignal && lastSignal.rsi < 30 ? 'bg-emerald-500' : 
                        lastSignal && lastSignal.rsi > 70 ? 'bg-rose-500' : 
                        'bg-indigo-500'
                      }`}
                      style={{ width: `${lastSignal?.rsi}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600 uppercase font-bold">
                    <span>Oversold</span>
                    <span className="text-indigo-400/40 font-mono">Neutral</span>
                    <span>Overbought</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 flex flex-col shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold">Trend Analysis</h2>
                </div>
                <div className="flex-grow flex flex-col justify-center gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Live Price</span>
                    <span className="text-xs font-mono">${stats[selectedMarket].currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">EMA (20)</span>
                    <span className="text-xs font-mono text-indigo-400">${lastSignal?.ema.toFixed(2)}</span>
                  </div>
                  <div className={`mt-2 p-2 rounded-lg border text-center text-[10px] font-bold uppercase tracking-widest ${
                    marketData.length > 0 && marketData[marketData.length-1].close > (lastSignal?.ema || 0) 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  }`}>
                    Bias: {marketData.length > 0 && marketData[marketData.length-1].close > (lastSignal?.ema || 0) ? "BULLISH" : "BEARISH"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - History */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 h-full min-h-[500px] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">Bot Activity</h2>
              </div>
              <div className="text-[10px] font-mono text-gray-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> LIVE
              </div>
            </div>
            
            <div className="space-y-4 overflow-y-auto flex-grow max-h-[700px] pr-2 custom-scrollbar">
              {stats[selectedMarket].signals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                    <Radio className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500 italic">No entry signals detected</p>
                  <p className="text-[10px] text-gray-700 mt-2 max-w-[150px]">The algorithm is currently filtering market noise for high-confidence setups.</p>
                </div>
              ) : (
                stats[selectedMarket].signals.slice().reverse().map((sig, idx) => (
                  <div key={idx} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-3 flex items-center justify-between group hover:border-indigo-500/30 transition-all hover:translate-x-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        sig.signal === "BUY" ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                      }`}>
                        {sig.signal[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">${sig.price.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">{new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-tighter ${
                        sig.isCorrect ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-gray-500/10 border-gray-700 text-gray-500"
                      }`}>
                        {sig.isCorrect ? "Target Hit" : "Evaluated"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800/50">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                <span>Cluster Node</span>
                <span className="text-indigo-400">BINANCE-API-V3</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-900 py-8 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-xs mb-2 italic">Designed for professional algorithmic execution.</p>
          <p className="text-gray-800 text-[10px] uppercase tracking-widest font-mono">
            &copy; {new Date().getFullYear()} CryptoPulse AI • Data delayed by 1-2 seconds
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
