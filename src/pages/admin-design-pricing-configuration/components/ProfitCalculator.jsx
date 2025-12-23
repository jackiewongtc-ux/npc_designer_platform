import React from 'react';

export function ProfitCalculator({ tiers, fixedCost = 5, platformFees = 2.5 }) {
  const calculateProfit = (tier) => {
    const profit = tier?.retailPrice - (tier?.supplierCost + fixedCost + platformFees);
    return profit?.toFixed(2);
  };

  const getProfitColor = (profit) => {
    if (profit > 10) return 'text-green-600';
    if (profit > 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Profit Calculator
      </h2>
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Formula:</strong> Profit = Retail Price - (Supplier Cost + Fixed Cost + Platform Fees)
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Fixed Cost: ${fixedCost} | Platform Fees: ${platformFees}
        </p>
      </div>
      <div className="space-y-4">
        {tiers?.map((tier) => {
          const profit = calculateProfit(tier);
          return (
            <div 
              key={tier?.tier}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  Tier {tier?.tier}
                </h3>
                <p className="text-sm text-gray-600">
                  {tier?.rangeLow} - {tier?.rangeHigh} units
                </p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-600">Retail Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${tier?.retailPrice?.toFixed(2)}
                </p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-600">Supplier Cost</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${tier?.supplierCost?.toFixed(2)}
                </p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-gray-600">Platform Profit per Unit</p>
                <p className={`text-2xl font-bold ${getProfitColor(parseFloat(profit))}`}>
                  ${profit}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">Total Potential Revenue</p>
            <p className="text-xs text-green-600">Based on maximum tier 3 volume</p>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ${(parseFloat(calculateProfit(tiers?.[2])) * tiers?.[2]?.rangeHigh)?.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}