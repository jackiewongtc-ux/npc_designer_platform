import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Tag, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export function DesignPortfolio({ designs, onFilterChange }) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'apparel', label: 'Apparel' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'footwear', label: 'Footwear' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'activewear', label: 'Activewear' },
    { value: 'loungewear', label: 'Loungewear' }
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popularity', label: 'Most Popular' }
  ];

  const handleSortChange = (value) => {
    setSortBy(value);
    onFilterChange?.({ sortBy: value, category: selectedCategory !== 'all' ? selectedCategory : null });
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    onFilterChange?.({ sortBy, category: value !== 'all' ? value : null });
  };

  const handleDesignClick = (designId) => {
    navigate(`/design-details?id=${designId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Design Portfolio</h2>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e?.target?.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categories?.map(cat => (
              <option key={cat?.value} value={cat?.value}>
                {cat?.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e?.target?.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {sortOptions?.map(opt => (
              <option key={opt?.value} value={opt?.value}>
                {opt?.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Design Grid */}
      {designs?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-2">No designs found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs?.map(design => (
            <div
              key={design?.id}
              onClick={() => handleDesignClick(design?.id)}
              className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Design Image */}
              <div className="relative aspect-square bg-gray-200">
                {design?.imageUrls?.[0] ? (
                  <img
                    src={design?.imageUrls?.[0]}
                    alt={design?.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <ArrowUpRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    design?.submissionStatus === 'community_voting' ?'bg-blue-100 text-blue-700'
                      : design?.submissionStatus === 'in_production' ?'bg-green-100 text-green-700'
                      : design?.submissionStatus === 'completed' ?'bg-purple-100 text-purple-700' :'bg-gray-100 text-gray-700'
                  }`}>
                    {design?.submissionStatus?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Design Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {design?.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {design?.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-pink-600">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">{design?.votesCount || 0}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <Tag className="w-4 h-4" />
                      <span className="text-xs">{design?.category}</span>
                    </div>
                  </div>

                  {design?.submittedAt && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(design.submittedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}