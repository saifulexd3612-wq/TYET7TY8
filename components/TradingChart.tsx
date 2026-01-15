
import React from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine
} from 'recharts';
import { CandleData } from '../types';

interface TradingChartProps {
  data: CandleData[];
  symbol: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const time = new Date(label).toLocaleTimeString();
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs font-mono">
        <p className="text-gray-400 mb-1">{time}</p>
        <p className="text-white">Price: <span className="text-emerald-400">${payload[0].value.toFixed(2)}</span></p>
        {payload[1] && <p className="text-white">EMA: <span className="text-blue-400">${payload[1].value.toFixed(2)}</span></p>}
        {payload[2] && <p className="text-white">RSI: <span className="text-amber-400">{payload[2].value.toFixed(2)}</span></p>}
      </div>
    );
  }
  return null;
};

const TradingChart: React.FC<TradingChartProps> = ({ data, symbol }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="time" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="ema" 
            stroke="#3b82f6" 
            dot={false} 
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;
