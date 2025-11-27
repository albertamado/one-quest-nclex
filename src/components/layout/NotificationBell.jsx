import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !hasError) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser, hasError]);

  const loadNotifications = async () => {
    if (!currentUser || hasError) return;
    
    try {
      setLoading(true);
      
      const userNotifications = await base44.entities.Notification.filter(
        { user_id: currentUser.id }, 
        '-created_date'
      );
      
      const recent = userNotifications.slice(0, 10);
      setNotifications(recent);
      setUnreadCount(recent.filter(n => !n.is_read).length);
      setHasError(false);
    } catch (err) {
      console.log("Notification error:", err);
      setHasError(true);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await base44.entities.Notification.update(notification.id, { 
          ...notification, 
          is_read: true 
        });
        await loadNotifications();
      }
      
      if (notification.link_url) {
        navigate(notification.link_url);
      }
    } catch (err) {
      console.log("Error updating notification:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { ...n, is_read: true })
      ));
      await loadNotifications();
    } catch (err) {
      console.log("Error marking all as read:", err);
    }
  };

  if (hasError) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-blue-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto shadow-xl border-2 border-gray-100">
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-teal-50">
          <span className="font-bold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs hover:bg-blue-100">
              Mark all read
            </Button>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 cursor-pointer border-b hover:bg-blue-50 transition-colors ${!notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
            >
              <div>
                <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.created_date).toLocaleDateString()}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No notifications</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}