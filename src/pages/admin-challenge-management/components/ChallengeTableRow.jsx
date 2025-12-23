import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const ChallengeTableRow = ({ 
  challenge, 
  isSelected, 
  onSelect, 
  onQuickAction,
  onViewDetails 
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-warning/10 text-warning border-warning/20', icon: 'Clock', label: 'Pending Review' },
      approved: { color: 'bg-success/10 text-success border-success/20', icon: 'CheckCircle', label: 'Approved' },
      rejected: { color: 'bg-error/10 text-error border-error/20', icon: 'XCircle', label: 'Rejected' },
      flagged: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: 'AlertTriangle', label: 'Flagged' },
      active: { color: 'bg-accent/10 text-accent border-accent/20', icon: 'Vote', label: 'Active Voting' },
      completed: { color: 'bg-muted text-muted-foreground border-border', icon: 'CheckCheck', label: 'Completed' }
    };

    const badge = badges?.[status] || badges?.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badge?.color}`}>
        <Icon name={badge?.icon} size={14} />
        {badge?.label}
      </span>
    );
  };

  const handleCreatorClick = (e) => {
    e?.stopPropagation();
    navigate(`/profile/${challenge?.creator?.username}`);
  };

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors duration-150">
      <td className="px-4 py-4">
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(challenge?.id, e?.target?.checked)}
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={challenge?.thumbnail}
              alt={challenge?.thumbnailAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onViewDetails(challenge)}
              className="text-sm font-medium text-foreground hover:text-accent transition-colors duration-150 text-left line-clamp-2"
            >
              {challenge?.title}
            </button>
            <p className="text-xs text-muted-foreground mt-1">{challenge?.category}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <button
          onClick={handleCreatorClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-150"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={challenge?.creator?.avatar}
              alt={challenge?.creator?.avatarAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-foreground">{challenge?.creator?.name}</span>
        </button>
      </td>
      <td className="px-4 py-4">
        {getStatusBadge(challenge?.status)}
      </td>
      <td className="px-4 py-4">
        <div className="text-sm text-foreground">{challenge?.submissionDate}</div>
        <div className="text-xs text-muted-foreground">{challenge?.submissionTime}</div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Icon name="ThumbsUp" size={16} color="var(--color-success)" />
            <span className="text-sm font-medium text-foreground">{challenge?.upvotes}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="ThumbsDown" size={16} color="var(--color-error)" />
            <span className="text-sm font-medium text-foreground">{challenge?.downvotes}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        {challenge?.flags?.length > 0 && (
          <div className="flex items-center gap-2">
            <Icon name="Flag" size={16} color="var(--color-destructive)" />
            <span className="text-sm font-medium text-destructive">{challenge?.flags?.length}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {challenge?.status === 'pending' && (
            <>
              <Button
                variant="success"
                size="sm"
                iconName="Check"
                onClick={() => onQuickAction(challenge?.id, 'approve')}
              />
              <Button
                variant="danger"
                size="sm"
                iconName="X"
                onClick={() => onQuickAction(challenge?.id, 'reject')}
              />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            iconName="Eye"
            onClick={() => onViewDetails(challenge)}
          />
          <Button
            variant="ghost"
            size="sm"
            iconName="MoreVertical"
            onClick={() => onQuickAction(challenge?.id, 'menu')}
          />
        </div>
      </td>
    </tr>
  );
};

export default ChallengeTableRow;