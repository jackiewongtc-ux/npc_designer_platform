import React from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';


const FilterToolbar = ({ 
  filters, 
  onFilterChange, 
  resultCount,
  onCreateChallenge 
}) => {
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'streetwear', label: 'Streetwear' },
    { value: 'formal', label: 'Formal Wear' },
    { value: 'activewear', label: 'Activewear' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'footwear', label: 'Footwear' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'voting', label: 'Voting' },
    { value: 'completed', label: 'Completed' }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest First' },
    { value: 'deadline', label: 'Ending Soon' },
    { value: 'votes', label: 'Most Votes' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            options={categoryOptions}
            value={filters?.category}
            onChange={(value) => onFilterChange('category', value)}
            placeholder="Category"
          />
          <Select
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => onFilterChange('status', value)}
            placeholder="Status"
          />
          <Select
            options={sortOptions}
            value={filters?.sort}
            onChange={(value) => onFilterChange('sort', value)}
            placeholder="Sort by"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            <span className="font-medium text-foreground">{resultCount}</span> challenges
          </div>
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={onCreateChallenge}
            className="whitespace-nowrap"
          >
            Create Challenge
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;