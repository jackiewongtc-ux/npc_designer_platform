import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { voteService } from '../../../services/voteService';

const VotingInterface = ({ designId, votingEndDate = null }) => {
  const [votes, setVotes] = useState(0);
  const [currentVote, setCurrentVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voteStats, setVoteStats] = useState({ upvotes: 0, downvotes: 0, percentage: 0 });

  useEffect(() => {
    if (designId) {
      loadVotingData();
    }
  }, [designId]);

  useEffect(() => {
    if (!designId) return;

    const channel = voteService?.subscribeToVotes(designId, () => {
      loadVotingData();
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [designId]);

  const loadVotingData = async () => {
    try {
      setLoading(true);
      const [userVote, stats] = await Promise.all([
        voteService?.getUserVote(designId),
        voteService?.getVoteStats(designId)
      ]);

      if (userVote) {
        setCurrentVote(userVote?.voteType);
      }

      setVotes(stats?.total);
      setVoteStats(stats);
    } catch (err) {
      console.error('Error loading voting data:', err);
      setError(err?.message || 'Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      setError('');
      
      if (currentVote === voteType) {
        await voteService?.removeVote(designId);
        setCurrentVote(null);
      } else {
        await voteService?.castVote(designId, voteType);
        setCurrentVote(voteType);
      }

      await loadVotingData();
    } catch (err) {
      console.error('Error handling vote:', err);
      setError(err?.message || 'Failed to cast vote');
    }
  };

  const calculateTimeRemaining = () => {
    if (!votingEndDate) return null;
    
    const now = new Date();
    const end = new Date(votingEndDate);
    const diff = end - now;
    
    if (diff <= 0) return "Voting ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };

  const timeRemaining = calculateTimeRemaining();

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 flex justify-center items-center">
        <div className="text-muted-foreground">Loading voting data...</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Icon name="TrendingUp" size={20} />
          Community Voting
        </h3>
        {timeRemaining && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Clock" size={16} />
            {timeRemaining}
          </div>
        )}
      </div>
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-center gap-4 py-6">
        <Button
          variant={currentVote === 'upvote' ? 'default' : 'outline'}
          size="lg"
          onClick={() => handleVote('upvote')}
          className="flex-col h-auto py-4 px-6"
        >
          <Icon 
            name="ChevronUp" 
            size={32} 
            color={currentVote === 'upvote' ? 'white' : 'var(--color-foreground)'}
          />
          <span className="text-xs mt-1">Upvote</span>
        </Button>

        <div className="text-center">
          <div className="text-4xl font-bold text-foreground font-data">
            {votes}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Total Votes
          </div>
        </div>

        <Button
          variant={currentVote === 'downvote' ? 'destructive' : 'outline'}
          size="lg"
          onClick={() => handleVote('downvote')}
          className="flex-col h-auto py-4 px-6"
        >
          <Icon 
            name="ChevronDown" 
            size={32} 
            color={currentVote === 'downvote' ? 'white' : 'var(--color-foreground)'}
          />
          <span className="text-xs mt-1">Downvote</span>
        </Button>
      </div>
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your vote helps determine production</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Icon name="ThumbsUp" size={14} color="var(--color-primary)" />
              <span className="font-medium text-foreground">{voteStats?.upvotes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="ThumbsDown" size={14} color="var(--color-destructive)" />
              <span className="font-medium text-foreground">{voteStats?.downvotes}</span>
            </div>
            <span className="font-medium text-primary">{voteStats?.percentage}% approval</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingInterface;