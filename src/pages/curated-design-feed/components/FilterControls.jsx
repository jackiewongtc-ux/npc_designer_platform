import React from 'react';
import { Filter, Grid, Trophy, Users, Palette } from 'lucide-react';


export default function FilterControls({
  selectedCategory,
  selectedTimeframe,
  activeTab,
  onCategoryChange,
  onTimeframeChange,
  onTabChange
}) {
  const categories = [
    { value: null, label: 'All Categories', icon: Grid },
    { value: 'apparel', label: 'Apparel', icon: Palette },
    { value: 'accessories', label: 'Accessories', icon: Palette },
    { value: 'footwear', label: 'Footwear', icon: Palette },
    { value: 'outerwear', label: 'Outerwear', icon: Palette },
    { value: 'activewear', label: 'Activewear', icon: Palette },
    { value: 'loungewear', label: 'Loungewear', icon: Palette }
  ];

  const timeframes = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  const tabs = [
    { value: 'all', label: 'All Content', icon: Grid },
    { value: 'designs', label: 'Designs', icon: Palette },
    { value: 'challenges', label: 'Challenges', icon: Trophy },
    { value: 'designers', label: 'Designers', icon: Users }
  ];

  return (
    <div className="space-y-4">
      {/* Content Type Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs?.map(tab => {
          const TabIcon = tab?.icon;
          return (
            <button
              key={tab?.value}
              onClick={() => onTabChange(tab?.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab?.value
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab?.label}</span>
            </button>
          );
        })}
      </div>
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e?.target?.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {categories?.map(category => (
              <option key={category?.value || 'all'} value={category?.value || ''}>
                {category?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Trending:</span>
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
            {timeframes?.map(timeframe => (
              <button
                key={timeframe?.value}
                onClick={() => onTimeframeChange(timeframe?.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe?.value
                    ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {timeframe?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedCategory || activeTab !== 'all') && (
          <button
            onClick={() => {
              onCategoryChange(null);
              onTabChange('all');
            }}
            className="ml-auto px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 underline"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}