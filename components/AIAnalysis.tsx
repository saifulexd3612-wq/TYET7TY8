
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MarketSymbol, CandleData } from '../types';
import { BrainCircuit, RefreshCw, Sparkles } from 'lucide-react';

interface AIAnalysisProps {
  symbol: MarketSymbol;
  data: CandleData[];
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ symbol, data }) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const analyzeMarket = async () => {
    if (!data.length) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      
      const prompt = `
        Analyze the following ${symbol} market data:
        Last Price: $${last.close}
        Price Change (last period): ${((last.close - prev.close) / prev.close * 100).toFixed(4)}%
        Current RSI: ${last.rsi?.toFixed(2)}
        Current EMA(20): $${last.ema?.toFixed(2)}
        Volume: ${last.volume}
        
        Provide a concise 2-sentence market sentiment analysis and a likely short-term direction (Bullish/Bearish/Neutral).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      setAnalysis(response.text || "Unable to generate analysis.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAnalysis("Deep analysis failed. Please check your connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeMarket();
  }, [symbol]);

  return (
    <div className="bg-gray-900/50 border border-indigo-500/20 rounded-xl p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-indigo-100">AI Sentiment Engine</h3>
        </div>
        <button 
          onClick={analyzeMarket}
          disabled={loading}
          className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-md hover:bg-indigo-500/10"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-indigo-500/10 animate-pulse rounded w-full"></div>
          <div className="h-3 bg-indigo-500/10 animate-pulse rounded w-3/4"></div>
        </div>
      ) : (
        <p className="text-gray-300 text-sm leading-relaxed italic">
          "{analysis}"
        </p>
      )}
    </div>
  );
};

export default AIAnalysis;
