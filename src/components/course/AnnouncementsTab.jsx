import React, { useState, useEffect, useCallback } from 'react';
import { Announcement } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare } from 'lucide-react';
import AnnouncementItem from './AnnouncementItem';
import { getUserRole } from '../utils/getUserRole';
import { base44 } from '@/api/base44Client';

export default function AnnouncementsTab({ course, currentUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState({});
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const canPost = getUserRole(currentUser) === 'admin' || getUserRole(currentUser) === 'teacher';

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const announcementsData = await base44.entities.Announcement.filter({ course_id: course.id }, '-created_date');
      setAnnouncements(announcementsData);

      // Load users safely - collect unique user IDs from announcements
      const userIds = new Set(announcementsData.map(a => a.user_id));
      const usersMap = {};
      
      // Load each user individually to avoid permission issues
      for (const userId of userIds) {
        try {
          const userData = await base44.entities.User.filter({ id: userId });
          if (userData && userData[0]) {
            usersMap[userId] = userData[0];
          }
        } catch (error) {
          console.warn(`Could not load user ${userId}:`, error);
          // Create a fallback user object
          usersMap[userId] = {
            id: userId,
            full_name: 'Unknown User',
            email: 'N/A'
          };
        }
      }
      
      setUsers(usersMap);
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
    setLoading(false);
  }, [course.id]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    setIsPosting(true);
    try {
      await base44.entities.Announcement.create({
        course_id: course.id,
        user_id: currentUser.id,
        content: newAnnouncement,
      });
      setNewAnnouncement('');
      await loadAnnouncements();
    } catch (error) {
      console.error("Error posting announcement:", error);
    }
    setIsPosting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Course Announcements</h2>
      </div>
      <div className="p-6">
        {canPost && (
          <div className="mb-8">
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-blue-600">
                        {currentUser.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div className="flex-1">
                    <Textarea
                    placeholder="Make an announcement to the class..."
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    className="mb-2"
                    />
                    <div className="flex justify-end">
                    <Button onClick={handlePostAnnouncement} disabled={isPosting}>
                        <Send className="w-4 h-4 mr-2" />
                        {isPosting ? 'Posting...' : 'Post'}
                    </Button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading announcements...</div>
        ) : announcements.length > 0 ? (
          <div className="space-y-8">
            {announcements.map((announcement) => (
              <AnnouncementItem
                key={announcement.id}
                announcement={announcement}
                author={users[announcement.user_id] || { full_name: 'Unknown User', email: 'N/A' }}
                currentUser={currentUser}
                users={users}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Announcements Yet</h3>
            <p className="text-gray-500 mt-1">
              {canPost ? 'Be the first to post an announcement.' : 'Check back later for updates.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}