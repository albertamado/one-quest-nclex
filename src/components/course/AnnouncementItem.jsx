
import React, { useState, useEffect } from 'react';
import { Reaction } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Shield, Trash2 } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import CommentsSection from './CommentsSection';

// Helper function to get user role (assuming user object has a 'role' property)
// This function needs to be defined to support the 'isTeacher' logic.
const getUserRole = (user) => {
  if (!user) return 'guest';
  // Example: user.role could be 'teacher', 'student', 'admin'
  return user.role || 'student'; // Default to student if role is not defined
};

// Helper function to format time ago
// This replaces the direct use of `format` for created_date display.
const timeAgo = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Use formatDistanceToNowStrict from date-fns for "time ago" string
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date for time ago:", error);
    // Fallback to original date format if `formatDistanceToNowStrict` fails
    return format(new Date(dateString), 'MMM d, yyyy h:mm a'); 
  }
};

export default function AnnouncementItem({ announcement, currentUser, users, onDelete }) {
  const [reactions, setReactions] = useState([]);
  const [hasReacted, setHasReacted] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [announcement.id]);

  const loadReactions = async () => {
    try {
      const announcementReactions = await Reaction.filter({ 
        content_id: announcement.id, 
        content_type: 'announcement' 
      });
      setReactions(announcementReactions);
      setHasReacted(announcementReactions.some(r => r.user_id === currentUser.id));
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const handleReaction = async () => {
    try {
      if (hasReacted) {
        const userReaction = reactions.find(r => r.user_id === currentUser.id);
        if (userReaction) {
          await Reaction.delete(userReaction.id);
        }
      } else {
        await Reaction.create({
          content_id: announcement.id,
          content_type: 'announcement',
          user_id: currentUser.id,
          reaction_type: 'like'
        });
      }
      await loadReactions();
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  // Safely get author info by finding the user from the provided 'users' list
  // The 'author' prop is no longer passed directly.
  const author = users?.find(u => u.id === announcement.user_id);
  const authorName = author?.full_name || 'Unknown User';
  // const authorEmail = author?.email || 'N/A'; // No longer displayed
  // const authorInitial = authorName?.[0]?.toUpperCase() || 'U'; // No longer used in this way
  // const authorPhoto = author?.profile_photo_url; // No longer used

  const isTeacher = getUserRole(author) === 'teacher';
  // Determine if the current user can delete the announcement (e.g., if they are the author)
  const canDelete = onDelete && currentUser.id === announcement.user_id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Replaced old author photo/initial logic with new gradient initial circle */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">
              {author?.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900">{authorName}</p>
              {isTeacher && (
                <div className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md flex items-center gap-1">
                  <Shield className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">TEACHER</span>
                </div>
              )}
            </div>
            {/* Replaced email and standard date format with timeAgo helper */}
            <p className="text-sm text-gray-500">{timeAgo(announcement.created_date)}</p>
          </div>
        </div>
        
        {/* Delete button, conditional rendering based on 'canDelete' */}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(announcement.id)}
            className="text-gray-500 hover:text-red-500"
            aria-label="Delete announcement"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-gray-700 whitespace-pre-wrap break-words">{announcement.content}</p>
      
      <div className="flex items-center space-x-4 mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReaction}
          className={hasReacted ? 'text-blue-600' : 'text-gray-500'}
        >
          <ThumbsUp className={`w-4 h-4 mr-1 ${hasReacted ? 'fill-current' : ''}`} />
          {reactions.length > 0 && <span>{reactions.length}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-gray-500"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Comments
        </Button>
      </div>

      {showComments && (
        <div className="mt-4">
          <CommentsSection
            contentId={announcement.id}
            contentType="announcement"
            courseId={announcement.course_id}
            currentUser={currentUser}
            users={users}
          />
        </div>
      )}
    </div>
  );
}
