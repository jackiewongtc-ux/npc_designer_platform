import React, { useState } from 'react';
import { Info } from 'lucide-react';

export function BodyMeasurementsInput({ value, onChange }) {
  const [measurements, setMeasurements] = useState(() => {
    try {
      return value ? JSON.parse(value) : {
        height: '',
        weight: '',
        chest: '',
        waist: '',
        hips: '',
        shoeSize: '',
        shirtSize: '',
        pantSize: ''
      };
    } catch {
      return {
        height: '',
        weight: '',
        chest: '',
        waist: '',
        hips: '',
        shoeSize: '',
        shirtSize: '',
        pantSize: ''
      };
    }
  });

  const [showGuide, setShowGuide] = useState(false);

  const handleChange = (field, val) => {
    const updated = { ...measurements, [field]: val };
    setMeasurements(updated);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Body Measurements
        </label>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
        >
          <Info className="w-4 h-4" />
          <span>Measurement Guide</span>
        </button>
      </div>
      {showGuide && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-gray-700">
          <h4 className="font-semibold mb-2">How to measure:</h4>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Height:</strong> Stand straight, measure from floor to top of head</li>
            <li>• <strong>Chest:</strong> Measure around fullest part of chest</li>
            <li>• <strong>Waist:</strong> Measure around natural waistline</li>
            <li>• <strong>Hips:</strong> Measure around fullest part of hips</li>
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="height" className="block text-xs font-medium text-gray-600 mb-1">
            Height (cm)
          </label>
          <input
            type="number"
            id="height"
            value={measurements?.height}
            onChange={(e) => handleChange('height', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="170"
          />
        </div>

        <div>
          <label htmlFor="weight" className="block text-xs font-medium text-gray-600 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight"
            value={measurements?.weight}
            onChange={(e) => handleChange('weight', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="65"
          />
        </div>

        <div>
          <label htmlFor="chest" className="block text-xs font-medium text-gray-600 mb-1">
            Chest (cm)
          </label>
          <input
            type="number"
            id="chest"
            value={measurements?.chest}
            onChange={(e) => handleChange('chest', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="90"
          />
        </div>

        <div>
          <label htmlFor="waist" className="block text-xs font-medium text-gray-600 mb-1">
            Waist (cm)
          </label>
          <input
            type="number"
            id="waist"
            value={measurements?.waist}
            onChange={(e) => handleChange('waist', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="75"
          />
        </div>

        <div>
          <label htmlFor="hips" className="block text-xs font-medium text-gray-600 mb-1">
            Hips (cm)
          </label>
          <input
            type="number"
            id="hips"
            value={measurements?.hips}
            onChange={(e) => handleChange('hips', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="95"
          />
        </div>

        <div>
          <label htmlFor="shoeSize" className="block text-xs font-medium text-gray-600 mb-1">
            Shoe Size (US)
          </label>
          <input
            type="text"
            id="shoeSize"
            value={measurements?.shoeSize}
            onChange={(e) => handleChange('shoeSize', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="9"
          />
        </div>

        <div>
          <label htmlFor="shirtSize" className="block text-xs font-medium text-gray-600 mb-1">
            Shirt Size
          </label>
          <select
            id="shirtSize"
            value={measurements?.shirtSize}
            onChange={(e) => handleChange('shirtSize', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </div>

        <div>
          <label htmlFor="pantSize" className="block text-xs font-medium text-gray-600 mb-1">
            Pant Size
          </label>
          <input
            type="text"
            id="pantSize"
            value={measurements?.pantSize}
            onChange={(e) => handleChange('pantSize', e?.target?.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="32"
          />
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-600">
        <p>These measurements enable accurate Size Advisor recommendations and help designers create designs that fit you perfectly.</p>
      </div>
    </div>
  );
}