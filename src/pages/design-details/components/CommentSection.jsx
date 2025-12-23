import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CommentSection = ({ designId, initialComments = [] }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const mockComments = [
  {
    id: 1,
    user: {
      name: "Sarah Chen",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11e82195f-1763301916996.png",
      avatarAlt: "Professional headshot of Asian woman with short black hair wearing white blouse",
      tier: "Gold"
    },
    content: "This design is absolutely stunning! The attention to detail in the fabric choice really shows. Can\'t wait to pre-order!",
    timestamp: new Date(Date.now() - 3600000),
    likes: 24,
    replies: []
  },
  {
    id: 2,
    user: {
      name: "Marcus Johnson",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17f0bc6ff-1763291964471.png",
      avatarAlt: "Professional headshot of African American man with beard wearing navy suit",
      tier: "Silver"
    },
    content: "Love the sustainable materials used here. Would it be possible to get this in a darker shade?",
    timestamp: new Date(Date.now() - 7200000),
    likes: 18,
    replies: [
    {
      id: 3,
      user: {
        name: "Designer",
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1908e3d35-1765222080801.png",
        avatarAlt: "Professional headshot of female designer with long brown hair wearing black turtleneck",
        tier: "Platinum"
      },
      content: "Thanks for the feedback! We\'re considering adding a charcoal gray option based on community requests.",
      timestamp: new Date(Date.now() - 5400000),
      likes: 12
    }]

  }];


  const displayComments = comments?.length > 0 ? comments : mockComments;

  const handleSubmitComment = (e) => {
    e?.preventDefault();
    if (!newComment?.trim()) return;

    const comment = {
      id: Date.now(),
      user: {
        name: "You",
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4318d08-1764792568737.png",
        avatarAlt: "User profile picture",
        tier: "Bronze"
      },
      content: newComment,
      timestamp: new Date(),
      likes: 0,
      replies: []
    };

    if (replyTo) {
      const updatedComments = displayComments?.map((c) => {
        if (c?.id === replyTo) {
          return {
            ...c,
            replies: [...(c?.replies || []), comment]
          };
        }
        return c;
      });
      setComments(updatedComments);
      setReplyTo(null);
    } else {
      setComments([comment, ...displayComments]);
    }

    setNewComment("");
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const CommentItem = ({ comment, isReply = false }) =>
  <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <Image
      src={comment?.user?.avatar}
      alt={comment?.user?.avatarAlt}
      className="w-10 h-10 rounded-full object-cover flex-shrink-0" />

      
      <div className="flex-1 space-y-2">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground">
              {comment?.user?.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(comment?.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {comment?.content}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200">
            <Icon name="Heart" size={14} />
            <span>{comment?.likes}</span>
          </button>
          {!isReply &&
        <button
          onClick={() => setReplyTo(comment?.id)}
          className="text-muted-foreground hover:text-foreground transition-colors duration-200">

              Reply
            </button>
        }
        </div>

        {comment?.replies && comment?.replies?.length > 0 &&
      <div className="space-y-4 mt-4">
            {comment?.replies?.map((reply) =>
        <CommentItem key={reply?.id} comment={reply} isReply={true} />
        )}
          </div>
      }
      </div>
    </div>;


  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon name="MessageCircle" size={20} />
        Comments ({displayComments?.length})
      </h3>
      <form onSubmit={handleSubmitComment} className="space-y-3">
        {replyTo &&
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="CornerDownRight" size={14} />
            <span>Replying to comment</span>
            <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-accent hover:underline">

              Cancel
            </button>
          </div>
        }
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e?.target?.value)}
          placeholder="Share your thoughts about this design..."
          rows={3}
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="default"
            size="sm"
            iconName="Send"
            iconPosition="left"
            disabled={!newComment?.trim()}>

            Post Comment
          </Button>
        </div>
      </form>
      <div className="space-y-6 pt-4">
        {displayComments?.map((comment) =>
        <CommentItem key={comment?.id} comment={comment} />
        )}
      </div>
    </div>);

};

export default CommentSection;