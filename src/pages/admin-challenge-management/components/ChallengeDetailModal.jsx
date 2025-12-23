import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ChallengeDetailModal = ({ challenge, onClose, onApprove, onReject, onSaveNotes }) => {
  const navigate = useNavigate();
  const [adminNotes, setAdminNotes] = useState(challenge?.adminNotes || '');
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  const handleAction = (action) => {
    setShowConfirmDialog(action);
  };

  const confirmAction = () => {
    if (showConfirmDialog === 'approve') {
      onApprove(challenge?.id, adminNotes);
    } else if (showConfirmDialog === 'reject') {
      onReject(challenge?.id, adminNotes);
    }
    setShowConfirmDialog(null);
  };

  const handleConfigurePricing = () => {
    navigate(`/admin/designs/${challenge?.id}/pricing`);
  };

  const getIPRiskLevel = (level) => {
    const levels = {
      low: { color: 'text-success', bg: 'bg-success/10', label: 'Low Risk' },
      medium: { color: 'text-warning', bg: 'bg-warning/10', label: 'Medium Risk' },
      high: { color: 'text-error', bg: 'bg-error/10', label: 'High Risk' }
    };
    return levels?.[level] || levels?.low;
  };

  const ipRisk = getIPRiskLevel(challenge?.ipRiskLevel);

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Challenge Review</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted/50 transition-colors duration-150"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Challenge Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={challenge?.thumbnail}
                  alt={challenge?.thumbnailAlt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{challenge?.title}</h3>
                <p className="text-sm text-muted-foreground">{challenge?.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Category: <span className="text-foreground font-medium">{challenge?.category}</span></span>
                  <span className="text-muted-foreground">Budget: <span className="text-foreground font-medium">${challenge?.budget}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Creator Information</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                <Image
                  src={challenge?.creator?.avatar}
                  alt={challenge?.creator?.avatarAlt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{challenge?.creator?.name}</p>
                <p className="text-xs text-muted-foreground">@{challenge?.creator?.username}</p>
              </div>
              <div className="ml-auto flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Member since: <span className="text-foreground">{challenge?.creator?.memberSince}</span></span>
                <span className="text-muted-foreground">Tier: <span className="text-foreground font-medium">{challenge?.creator?.tier}</span></span>
              </div>
            </div>
          </div>

          {/* IP Risk Analysis */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">IP Risk Analysis</h4>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${ipRisk?.bg} ${ipRisk?.color}`}>
                <Icon name="Shield" size={14} />
                {ipRisk?.label}
              </span>
            </div>
            <div className="space-y-2">
              {challenge?.ipScanResults?.map((result, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Icon name={result?.detected ? 'AlertCircle' : 'CheckCircle'} size={16} color={result?.detected ? 'var(--color-warning)' : 'var(--color-success)'} />
                  <span className="text-muted-foreground">{result?.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Feedback */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Community Feedback</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon name="ThumbsUp" size={20} color="var(--color-success)" />
                  <span className="text-2xl font-bold text-foreground">{challenge?.upvotes}</span>
                </div>
                <p className="text-xs text-muted-foreground">Upvotes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon name="ThumbsDown" size={20} color="var(--color-error)" />
                  <span className="text-2xl font-bold text-foreground">{challenge?.downvotes}</span>
                </div>
                <p className="text-xs text-muted-foreground">Downvotes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon name="MessageSquare" size={20} color="var(--color-accent)" />
                  <span className="text-2xl font-bold text-foreground">{challenge?.comments}</span>
                </div>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
            </div>
          </div>

          {/* Flags */}
          {challenge?.flags?.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                <Icon name="Flag" size={16} />
                Community Reports ({challenge?.flags?.length})
              </h4>
              <div className="space-y-2">
                {challenge?.flags?.map((flag, index) => (
                  <div key={index} className="text-sm text-foreground bg-background/50 rounded p-2">
                    <span className="font-medium">{flag?.reason}:</span> {flag?.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <Input
              label="Admin Notes"
              description="Internal notes for moderation team (not visible to users)"
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e?.target?.value)}
              placeholder="Add notes about this challenge review..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onSaveNotes(challenge?.id, adminNotes)}
              iconName="Save"
              iconPosition="left"
            >
              Save Notes
            </Button>
            {challenge?.status === 'approved' && (
              <Button
                variant="primary"
                onClick={handleConfigurePricing}
                iconName="Settings"
                iconPosition="left"
              >
                Configure Pricing
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              onClick={() => handleAction('reject')}
              iconName="X"
              iconPosition="left"
            >
              Reject Challenge
            </Button>
            <Button
              variant="success"
              onClick={() => handleAction('approve')}
              iconName="Check"
              iconPosition="left"
            >
              Approve Challenge
            </Button>
          </div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-lg ${showConfirmDialog === 'approve' ? 'bg-success/10' : 'bg-error/10'}`}>
                <Icon 
                  name={showConfirmDialog === 'approve' ? 'CheckCircle' : 'XCircle'} 
                  size={24} 
                  color={showConfirmDialog === 'approve' ? 'var(--color-success)' : 'var(--color-error)'} 
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm {showConfirmDialog === 'approve' ? 'Approval' : 'Rejection'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to {showConfirmDialog} this challenge? This action will notify the creator and update the challenge status.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant={showConfirmDialog === 'approve' ? 'success' : 'danger'}
                onClick={confirmAction}
              >
                Confirm {showConfirmDialog === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeDetailModal;