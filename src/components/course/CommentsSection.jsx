import React, { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare } from 'lucide-react';
import CommentItem from './CommentItem';

export default function CommentsSection({ contentId, contentType, currentUser, courseId }) {
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const filter = { content_id: contentId, content_type: contentType };
      const commentsData = await Comment.filter(filter, '-created_date');
      setComments(commentsData);

      if (commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const usersData = await User.list();
        const usersMap = usersData.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
        setUsers(usersMap);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
    setLoading(false);
  }, [contentId, contentType]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      await Comment.create({
        content_id: contentId,
        content_type: contentType,
        user_id: currentUser.id,
        content: newComment,
        course_id: courseId, // Added courseId
      });
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error("Error posting comment:", error);
    }
    setIsPosting(false);
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Discussion ({comments.length})
      </h3>
      
      <div className="mb-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {currentUser.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="Ask a question or share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-2"
            />
            <div className="flex justify-end">
              <Button onClick={handlePostComment} disabled={isPosting}>
                <Send className="w-4 h-4 mr-2" />
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-500">Loading discussion...</div>
      ) : topLevelComments.length > 0 ? (
        <div className="space-y-6">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              author={users[comment.user_id]}
              currentUser={currentUser}
              allComments={comments}
              users={users}
              onReply={loadComments}
              courseId={courseId}
              contentId={contentId}
              contentType={contentType}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
          <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <h4 className="text-md font-medium text-gray-800">No discussion yet</h4>
          <p className="text-sm text-gray-500">Be the first to start the conversation.</p>
        </div>
      )}
    </div>
  );
}