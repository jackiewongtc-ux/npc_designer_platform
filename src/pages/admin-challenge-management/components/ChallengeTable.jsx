import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

import { Checkbox } from '../../../components/ui/Checkbox';
import ChallengeTableRow from './ChallengeTableRow';

const ChallengeTable = ({ 
  challenges, 
  selectedIds, 
  onSelectAll, 
  onSelectOne,
  onSort,
  sortConfig,
  onQuickAction,
  onViewDetails
}) => {
  const columns = [
    { key: 'title', label: 'Challenge', sortable: true },
    { key: 'creator', label: 'Creator', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'date', label: 'Submission Date', sortable: true },
    { key: 'votes', label: 'Votes', sortable: true },
    { key: 'flags', label: 'Flags', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const getSortIcon = (columnKey) => {
    if (sortConfig?.key !== columnKey) {
      return <Icon name="ChevronsUpDown" size={16} color="var(--color-muted-foreground)" />;
    }
    return sortConfig?.direction === 'asc' 
      ? <Icon name="ChevronUp" size={16} color="var(--color-primary)" />
      : <Icon name="ChevronDown" size={16} color="var(--color-primary)" />;
  };

  const allSelected = challenges?.length > 0 && selectedIds?.length === challenges?.length;
  const someSelected = selectedIds?.length > 0 && selectedIds?.length < challenges?.length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                />
              </th>
              {columns?.map((column) => (
                <th key={column?.key} className="px-4 py-3 text-left">
                  {column?.sortable ? (
                    <button
                      onClick={() => onSort(column?.key)}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors duration-150"
                    >
                      {column?.label}
                      {getSortIcon(column?.key)}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">{column?.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {challenges?.length === 0 ? (
              <tr>
                <td colSpan={columns?.length + 1} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="Inbox" size={48} color="var(--color-muted-foreground)" />
                    <p className="text-muted-foreground">No challenges found matching your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              challenges?.map((challenge) => (
                <ChallengeTableRow
                  key={challenge?.id}
                  challenge={challenge}
                  isSelected={selectedIds?.includes(challenge?.id)}
                  onSelect={onSelectOne}
                  onQuickAction={onQuickAction}
                  onViewDetails={onViewDetails}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChallengeTable;