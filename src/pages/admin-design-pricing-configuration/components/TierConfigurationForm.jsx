import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';

export function TierConfigurationForm({ 
  initialTiers, 
  preorderGoal = 100, 
  supplierSettings,
  onTiersChange,
  onValidationChange 
}) {
  const [tiers, setTiers] = useState(initialTiers || [
    { tier: 1, rangeLow: 1, rangeHigh: preorderGoal, supplierCost: 0, retailPrice: 0 },
    { tier: 2, rangeLow: preorderGoal + 1, rangeHigh: 200, supplierCost: 0, retailPrice: 0 },
    { tier: 3, rangeLow: 201, rangeHigh: 500, supplierCost: 0, retailPrice: 0 }
  ]);

  const [validationErrors, setValidationErrors] = useState({});

  // Auto-suggest based on supplier volume brackets
  useEffect(() => {
    if (supplierSettings?.volumeBrackets && tiers?.[0]?.rangeHigh) {
      const tier1Max = tiers?.[0]?.rangeHigh;
      const brackets = supplierSettings?.volumeBrackets;

      // Find appropriate brackets for tier 2 and 3
      const tier2Bracket = brackets?.find(b => b?.min > tier1Max) || brackets?.[1];
      const tier3Bracket = brackets?.find(b => b?.min > tier2Bracket?.max) || brackets?.[2];

      setTiers(prev => {
        const updated = [...prev];
        if (tier2Bracket) {
          updated[1].rangeLow = tier1Max + 1;
          updated[1].rangeHigh = tier2Bracket?.max || tier1Max * 2;
          updated[1].supplierCost = tier2Bracket?.cost || 0;
        }
        if (tier3Bracket) {
          updated[2].rangeLow = (updated?.[1]?.rangeHigh || tier1Max * 2) + 1;
          updated[2].rangeHigh = tier3Bracket?.max || tier1Max * 5;
          updated[2].supplierCost = tier3Bracket?.cost || 0;
        }
        return updated;
      });
    }
  }, [supplierSettings, preorderGoal]);

  const validateTiers = (updatedTiers) => {
    const errors = {};

    // Check tier 2 price < tier 1 price
    if (updatedTiers?.[1]?.retailPrice >= updatedTiers?.[0]?.retailPrice) {
      errors.tier2Price = 'Tier 2 price must be less than Tier 1 price';
    }

    // Check tier 3 price < tier 2 price
    if (updatedTiers?.[2]?.retailPrice >= updatedTiers?.[1]?.retailPrice) {
      errors.tier3Price = 'Tier 3 price must be less than Tier 2 price';
    }

    // Check ranges don't overlap
    if (updatedTiers?.[1]?.rangeLow <= updatedTiers?.[0]?.rangeHigh) {
      errors.tier2Range = 'Tier 2 range must start after Tier 1';
    }
    if (updatedTiers?.[2]?.rangeLow <= updatedTiers?.[1]?.rangeHigh) {
      errors.tier3Range = 'Tier 3 range must start after Tier 2';
    }

    setValidationErrors(errors);
    onValidationChange?.(Object.keys(errors)?.length === 0);
    return errors;
  };

  const handleTierChange = (tierIndex, field, value) => {
    const updatedTiers = [...tiers];
    updatedTiers[tierIndex][field] = parseFloat(value) || 0;

    setTiers(updatedTiers);
    validateTiers(updatedTiers);
    onTiersChange?.(updatedTiers);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Three-Tier Pricing Configuration
        </h2>

        {tiers?.map((tier, index) => (
          <div 
            key={tier?.tier} 
            className={`mb-6 pb-6 ${index < tiers?.length - 1 ? 'border-b border-gray-200' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Tier {tier?.tier}
                {tier?.tier === 1 && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Auto-filled from preorder goal: {preorderGoal})
                  </span>
                )}
              </h3>
              {tier?.tier > 1 && (
                <span className="text-sm text-blue-600">
                  Auto-suggested from supplier volume brackets
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Range Low"
                type="number"
                value={tier?.rangeLow}
                onChange={(e) => handleTierChange(index, 'rangeLow', e?.target?.value)}
                disabled={tier?.tier === 1}
                className="w-full"
              />
              <Input
                label="Range High"
                type="number"
                value={tier?.rangeHigh}
                onChange={(e) => handleTierChange(index, 'rangeHigh', e?.target?.value)}
                disabled={tier?.tier === 1}
                className="w-full"
              />
              <Input
                label="Supplier Cost ($)"
                type="number"
                step="0.01"
                value={tier?.supplierCost}
                onChange={(e) => handleTierChange(index, 'supplierCost', e?.target?.value)}
                className="w-full"
              />
              <Input
                label="Retail Price ($)"
                type="number"
                step="0.01"
                value={tier?.retailPrice}
                onChange={(e) => handleTierChange(index, 'retailPrice', e?.target?.value)}
                className="w-full"
              />
            </div>

            {/* Validation errors */}
            {tier?.tier === 2 && validationErrors?.tier2Price && (
              <p className="mt-2 text-sm text-red-600">{validationErrors?.tier2Price}</p>
            )}
            {tier?.tier === 2 && validationErrors?.tier2Range && (
              <p className="mt-2 text-sm text-red-600">{validationErrors?.tier2Range}</p>
            )}
            {tier?.tier === 3 && validationErrors?.tier3Price && (
              <p className="mt-2 text-sm text-red-600">{validationErrors?.tier3Price}</p>
            )}
            {tier?.tier === 3 && validationErrors?.tier3Range && (
              <p className="mt-2 text-sm text-red-600">{validationErrors?.tier3Range}</p>
            )}
          </div>
        ))}

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Manual Override:</strong> You can manually adjust any values. 
            The system will validate that Tier 2 price &lt; Tier 1 price, Tier 3 price &lt; Tier 2 price, 
            and ranges don't overlap.
          </p>
        </div>
      </div>
    </div>
  );
}