import React from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const MobileFilterPanel = ({ isOpen, onClose, filters, onFilterChange, onApply }) => {
  if (!isOpen) return null;

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
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1500]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border z-[1600] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-muted transition-colors flex items-center justify-center"
            aria-label="Close filters"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <Select
            label="Category"
            options={categoryOptions}
            value={filters?.category}
            onChange={(value) => onFilterChange('category', value)}
          />

          <Select
            label="Status"
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => onFilterChange('status', value)}
          />

          <Select
            label="Sort By"
            options={sortOptions}
            value={filters?.sort}
            onChange={(value) => onFilterChange('sort', value)}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                onFilterChange('category', 'all');
                onFilterChange('status', 'all');
                onFilterChange('sort', 'popular');
              }}
              fullWidth
            >
              Reset
            </Button>
            <Button
              variant="default"
              onClick={() => {
                onApply();
                onClose();
              }}
              fullWidth
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileFilterPanel;