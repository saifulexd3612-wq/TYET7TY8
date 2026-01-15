
import React from 'react';
import { SignalType } from '../types';

interface SignalBadgeProps {
  signal: SignalType;
}

const SignalBadge: React.FC<SignalBadgeProps> = ({ signal }) => {
  const styles = {
    BUY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/50",
    SELL: "bg-rose-500/10 text-rose-500 border-rose-500/50",
    WAIT: "bg-gray-500/10 text-gray-400 border-gray-700",
  };

  return (
    <div className={`px-3 py-1 rounded-full border text-sm font-bold tracking-wider ${styles[signal]}`}>
      {signal}
    </div>
  );
};

export default SignalBadge;
