import React from 'react';

const CreditBalanceCard = ({ balance }) => {
  return (
    <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-xl border border-green-500/30 p-6 relative overflow-hidden">
      {/* Animated Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent animate-pulse"></div>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Credit Balance</h3>
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">💎</span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-6">
          <div className="text-4xl font-bold text-white mb-2">
            ${(balance || 0)?.toFixed(2)}
          </div>
          <div className="text-green-300 text-sm">Available Credits</div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg py-3 px-4 text-white text-sm font-medium transition-all duration-200 hover:scale-105">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">➕</span>
              <span>Add Credits</span>
            </div>
          </button>
          <button className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg py-3 px-4 text-white text-sm font-medium transition-all duration-200 hover:scale-105">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">📜</span>
              <span>History</span>
            </div>
          </button>
        </div>

        {/* Info Text */}
        <div className="mt-4 text-xs text-green-300/70 text-center">
          Credits can be used for premium features and purchases
        </div>
      </div>
    </div>
  );
};

export default CreditBalanceCard;