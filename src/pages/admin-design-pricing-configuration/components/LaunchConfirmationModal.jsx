import React from 'react';
import { X } from 'lucide-react';
import Button from '../../../components/ui/Button';

export function LaunchConfirmationModal({ isOpen, onClose, onConfirm, tiers, designTitle }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Confirm Pre-order Launch
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Design Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Design</p>
              <p className="text-lg font-semibold text-blue-800">{designTitle}</p>
            </div>

            {/* Pricing Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Final Pricing Summary
              </h3>
              <div className="space-y-3">
                {tiers?.map((tier) => (
                  <div 
                    key={tier?.tier}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Tier {tier?.tier}</p>
                      <p className="text-sm text-gray-600">
                        {tier?.rangeLow} - {tier?.rangeHigh} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${tier?.retailPrice?.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">per unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                Important Terms
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Pre-order period will start immediately upon confirmation</li>
                <li>• 30-day countdown timer will begin</li>
                <li>• Tier prices will be locked and cannot be changed during pre-order</li>
                <li>• Design status will be changed to "pre-order"</li>
                <li>• Customers will see the tier-based pricing structure</li>
              </ul>
            </div>

            {/* Warning */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-1">⚠️ Warning</p>
              <p className="text-sm text-red-800">
                This action cannot be undone. Once launched, the pre-order will be active 
                and visible to all users. Make sure all pricing information is correct before proceeding.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              Confirm & Launch Pre-order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}