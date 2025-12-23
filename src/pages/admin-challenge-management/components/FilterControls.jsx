import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterControls = ({ 
  filters, 
  onFilterChange, 
  onSearch, 
  onExport, 
  onReset,
  resultCount 
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'active', label: 'Active Voting' },
    { value: 'completed', label: 'Completed' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'streetwear', label: 'Streetwear' },
    { value: 'formal', label: 'Formal Wear' },
    { value: 'casual', label: 'Casual' },
    { value: 'sportswear', label: 'Sportswear' },
    { value: 'accessories', label: 'Accessories' }
  ];

  const flagOptions = [
    { value: 'all', label: 'All Flags' },
    { value: 'ip_risk', label: 'IP Risk Detected' },
    { value: 'community_report', label: 'Community Reports' },
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'spam', label: 'Spam/Low Quality' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Filter Challenges</h3>
        <span className="text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? 'result' : 'results'} found
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          type="search"
          placeholder="Search by title or creator..."
          value={filters?.search}
          onChange={(e) => onSearch(e?.target?.value)}
        />

        <Select
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
          placeholder="Filter by status"
        />

        <Select
          options={categoryOptions}
          value={filters?.category}
          onChange={(value) => onFilterChange('category', value)}
          placeholder="Filter by category"
        />

        <Select
          options={flagOptions}
          value={filters?.flag}
          onChange={(value) => onFilterChange('flag', value)}
          placeholder="Filter by flag"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="From Date"
          value={filters?.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e?.target?.value)}
        />

        <Input
          type="date"
          label="To Date"
          value={filters?.dateTo}
          onChange={(e) => onFilterChange('dateTo', e?.target?.value)}
        />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" onClick={onReset} iconName="RotateCcw" iconPosition="left">
          Reset Filters
        </Button>
        <Button variant="secondary" onClick={onExport} iconName="Download" iconPosition="left">
          Export Results
        </Button>
      </div>
    </div>
  );
};

export default FilterControls;