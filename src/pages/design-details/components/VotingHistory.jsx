import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { voteService } from '../../../services/voteService';

const VotingHistory = ({ designId }) => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    if (designId) {
      loadVotingHistory();
    }
  }, [designId]);

  const loadVotingHistory = async (append = false) => {
    try {
      setLoading(true);
      const currentOffset = append ? offset : 0;
      const history = await voteService?.getVotingHistory(designId, LIMIT, currentOffset);

      if (append) {
        setVotes(prev => [...prev, ...history]);
      } else {
        setVotes(history);
      }

      setHasMore(history?.length === LIMIT);
      setOffset(currentOffset + history?.length);
    } catch (err) {
      console.error('Error loading voting history:', err);
      setError(err?.message || 'Failed to load voting history');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadVotingHistory(true);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Icon name="History" size={20} />
          Recent Votes
        </h3>
        <span className="text-sm text-muted-foreground">
          {votes?.length} {votes?.length === 1 ? 'vote' : 'votes'}
        </span>
      </div>
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading && votes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading voting history...
          </div>
        ) : votes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No votes yet. Be the first to vote!
          </div>
        ) : (
          votes?.map((vote) => (
            <div
              key={vote?.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {vote?.profilePic ? (
                  <img 
                    src={vote?.profilePic} 
                    alt={vote?.username || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Icon name="User" size={16} color="var(--color-muted-foreground)" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {vote?.username || 'Anonymous'}
                  </span>
                  {vote?.voteType === 'upvote' ? (
                    <Icon name="ThumbsUp" size={14} color="var(--color-primary)" />
                  ) : (
                    <Icon name="ThumbsDown" size={14} color="var(--color-destructive)" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(vote?.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {hasMore && votes?.length > 0 && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2 text-sm text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default VotingHistory;