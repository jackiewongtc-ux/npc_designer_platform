import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const BulkActionsBar = ({ selectedCount, onBulkAction, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideInUp">
      <div className="bg-card border border-border rounded-lg shadow-lg px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Icon name="CheckSquare" size={20} color="var(--color-accent)" />
          <span className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? 'challenge' : 'challenges'} selected
          </span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="success"
            size="sm"
            iconName="Check"
            iconPosition="left"
            onClick={() => onBulkAction('approve')}
          >
            Approve
          </Button>

          <Button
            variant="danger"
            size="sm"
            iconName="X"
            iconPosition="left"
            onClick={() => onBulkAction('reject')}
          >
            Reject
          </Button>

          <Button
            variant="outline"
            size="sm"
            iconName="Flag"
            iconPosition="left"
            onClick={() => onBulkAction('flag')}
          >
            Flag
          </Button>

          <Button
            variant="ghost"
            size="sm"
            iconName="Trash2"
            iconPosition="left"
            onClick={() => onBulkAction('delete')}
          >
            Delete
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          iconName="X"
          onClick={onClearSelection}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;