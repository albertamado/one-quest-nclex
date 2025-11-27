
import React, { useState, useCallback } from 'react';
import { Comment } from '@/api/entities';
import { Reaction } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MessageCircle, Send, Shield } from 'lucide-react'; // Added Shield
import { getUserRole } from '../utils/getUserRole';
// Removed 'format' from 'date-fns' as it's replaced by timeAgo

// Simple timeAgo function for display, can be moved to a utility file if needed
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (seconds < 60) return seconds === 0 ? "just now" : `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  if (weeks < 4) return `${weeks} weeks ago`;
  if (months < 12) return `${months} months ago`;
  return `${years} years ago`;
};

export default function CommentItem({ comment, author, currentUser, allComments, users, onReply, courseId, contentId, contentType, onDelete }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [hasReacted, setHasReacted] = useState(false);

  const loadReactions = useCallback(async () => {
    try {
      const commentReactions = await Reaction.filter({ content_id: comment.id, content_type: 'comment' });
      setReactions(commentReactions);
      // Ensure currentUser.id exists before checking hasReacted to prevent errors if user is not logged in or null
      setHasReacted(currentUser && commentReactions.some(r => r.user_id === currentUser.id));
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  }, [comment.id, currentUser]); // Added currentUser to dependencies for safety

  React.useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  const handleReact = async () => {
    if (!currentUser) {
      console.log("User must be logged in to react.");
      // Optionally show a login/signup prompt
      return;
    }
    try {
      if (hasReacted) {
        const userReaction = reactions.find(r => r.user_id === currentUser.id);
        if (userReaction) {
          await Reaction.delete(userReaction.id);
        }
      } else {
        await Reaction.create({
          content_id: comment.id,
          content_type: 'comment',
          user_id: currentUser.id,
          reaction_type: 'like'
        });
      }
      await loadReactions();
    } catch (error) {
      console.error("Error reacting:", error);
    }
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;
    if (!currentUser) {
      console.log("User must be logged in to post a reply.");
      return;
    }
    setIsPosting(true);
    try {
      await Comment.create({
        course_id: courseId,
        content_id: contentId,
        content_type: contentType,
        user_id: currentUser.id,
        content: replyContent,
        parent_comment_id: comment.id
      });
      setReplyContent('');
      setShowReplyForm(false);
      if (onReply) onReply();
    } catch (error) {
      console.error("Error posting reply:", error);
    }
    setIsPosting(false);
  };

  const replies = allComments.filter(c => c.parent_comment_id === comment.id);

  const isTeacher = author ? getUserRole(author) === 'teacher' : false; // Ensure author exists

  return (
    <div className="flex items-start space-x-3 py-4">
      <div className="flex-shrink-0">
        {/* New avatar rendering */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {author?.full_name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 text-sm">{author?.full_name || author?.email || 'Unknown User'}</p> {/* Ensured author exists */}
          {isTeacher && (
            <div className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md flex items-center gap-1">
              <Shield className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">TEACHER</span>
            </div>
          )}
          <span className="text-xs text-gray-500">{timeAgo(comment.created_date)}</span>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-2">
          <button
            onClick={handleReact}
            className={`flex items-center space-x-1 text-sm ${hasReacted ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{reactions.length > 0 && reactions.length}</span>
          </button>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Reply</span>
          </button>
        </div>

        {showReplyForm && (
          <div className="mt-3 flex items-start space-x-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button onClick={handlePostReply} disabled={isPosting || !currentUser} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-4 space-y-4 ml-6 border-l-2 border-gray-200 pl-4">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                // Ensure users object is passed and user_id exists for author lookup
                author={users && users[reply.user_id]} 
                currentUser={currentUser}
                allComments={allComments}
                users={users}
                onReply={onReply}
                courseId={courseId}
                contentId={contentId}
                contentType={contentType}
                onDelete={onDelete} // Pass onDelete down to replies
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
