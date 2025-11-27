
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageSquare, Search, Mail, MailOpen } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getUserRole } from '../components/utils/getUserRole';
import LoadingScreen from '../components/shared/LoadingScreen';
import { Badge } from '@/components/ui/badge';

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    course_id: '',
    recipient_ids: [],
    is_private: true
  });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);

      let allUsersData = [];
      
      // For students, get teachers from InstructorProfile only
      if (userRole === 'student') {
        try {
          // Get instructors/teachers from InstructorProfile entity
          const instructorProfiles = await base44.entities.InstructorProfile.filter({ is_active: true });
          
          // Map instructor profiles to user format
          const teachersFromProfiles = instructorProfiles
            .filter(profile => profile.user_id) // Only profiles with linked user accounts
            .map(profile => ({
              id: profile.user_id,
              name: profile.full_name,
              email: profile.email,
              role: 'teacher'
            }));
          
          allUsersData = teachersFromProfiles;

        } catch (error) {
          console.error("Error loading instructors:", error);
          allUsersData = [];
        }
      } else {
        // For admins and teachers, get all users
        try {
          allUsersData = await base44.entities.User.list();
        } catch (error) {
          console.error("Error loading all users:", error);
          allUsersData = [];
        }
      }

      const formattedUsers = allUsersData
        .filter(u => u.id !== user.id)
        .map(u => ({
          id: u.id,
          name: u.full_name || u.name || u.email,
          email: u.email,
          role: u.user_type || u.role || getUserRole(u),
        }));

      setAllUsers(formattedUsers);

      const allCourses = await base44.entities.Course.list();
      const allEnrollments = await base44.entities.Enrollment.list();
      setCourses(allCourses);
      setEnrollments(allEnrollments);

      let userMessages = [];
      if (userRole === 'admin' || userRole === 'teacher') {
        userMessages = await base44.entities.Message.list('-created_date');
      } else {
        const sent = await base44.entities.Message.filter({ sender_id: user.id }, '-created_date');
        const receivedAll = await base44.entities.Message.list('-created_date');
        const receivedFiltered = receivedAll.filter(m =>
          m.recipient_ids && m.recipient_ids.includes(user.id)
        );
        
        const combinedMessages = [...sent, ...receivedFiltered];
        const uniqueMessages = Array.from(new Map(combinedMessages.map(msg => [msg.id, msg])).values());

        userMessages = uniqueMessages.sort((a, b) =>
          new Date(b.created_date) - new Date(a.created_date)
        );
      }

      setMessages(userMessages);

    } catch (error) {
      console.error("Error loading messages:", error);
    }
    setLoading(false);
  };

  const getRecipientOptions = () => {
    if (!currentUser) return [];
    
    const userRole = getUserRole(currentUser);
    
    if (userRole === 'student') {
      // Students can only message teachers and admins
      // Based on current loadData, allUsers for students only contains teachers.
      // So, this filter will effectively just return teachers.
      return allUsers.filter(u => {
        return u.role === 'admin' || u.role === 'teacher';
      });
    } else if (userRole === 'teacher' || userRole === 'admin') {
      if (newMessage.course_id) {
        const courseEnrollments = enrollments.filter(e => e.course_id === newMessage.course_id);
        const enrolledStudentIds = new Set(courseEnrollments.map(e => e.student_id));
        
        return allUsers.filter(u => {
          return enrolledStudentIds.has(u.id) || u.role === 'admin' || u.role === 'teacher';
        });
      }
      return allUsers;
    }
    
    return [];
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.content || !newMessage.recipient_ids || newMessage.recipient_ids.length === 0) {
      alert("Please fill in all required fields and select at least one recipient");
      return;
    }

    try {
      const messageData = {
        ...newMessage,
        sender_id: currentUser.id,
        read_by: []
      };

      await base44.entities.Message.create(messageData);

      await Promise.all(newMessage.recipient_ids.map(recipientId => 
        base44.entities.Notification.create({
          user_id: recipientId,
          title: 'New Message',
          message: `${currentUser.full_name} sent you a message: ${newMessage.subject}`,
          notification_type: 'message',
          related_entity_type: 'message',
          link_url: '/Messages'
        })
      ));

      await loadData();
      setIsComposeOpen(false);
      setNewMessage({
        subject: '',
        content: '',
        course_id: '',
        recipient_ids: [],
        is_private: true
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const markAsRead = async (message) => {
    if (!message.read_by || !message.read_by.includes(currentUser.id)) {
      try {
        await base44.entities.Message.update(message.id, {
          read_by: [...(message.read_by || []), currentUser.id]
        });
        await loadData();
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  const getSenderName = (senderId) => {
    if (currentUser && senderId === currentUser.id) {
        return currentUser.full_name || 'You';
    }
    const sender = allUsers.find(u => u.id === senderId);
    return sender?.name || 'Unknown';
  };

  const toggleRecipient = (userId) => {
    setNewMessage(prev => {
      const currentIds = prev.recipient_ids || [];
      const newIds = currentIds.includes(userId)
        ? currentIds.filter(id => id !== userId)
        : [...currentIds, userId];
      return { ...prev, recipient_ids: newIds };
    });
  };

  const recipients = getRecipientOptions();

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'unread') {
      const isUnread = !message.read_by || !message.read_by.includes(currentUser?.id);
      const isRecipient = message.sender_id !== currentUser?.id;
      return matchesSearch && isUnread && isRecipient;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return <LoadingScreen message="Loading messages..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Messages</h1>
            <p className="text-gray-600">Communicate with your instructors and students</p>
          </div>
          <Button 
            onClick={() => setIsComposeOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-lg px-6 py-6"
          >
            <Send className="w-5 h-5 mr-2" />
            Compose
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-blue-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px] border-2 border-gray-200">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600" />
                Inbox
                <Badge className="ml-auto bg-blue-600">
                  {filteredMessages.filter(m => !m.read_by?.includes(currentUser?.id) && m.sender_id !== currentUser?.id).length}
                </Badge>
              </h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredMessages.length > 0 ? (
                filteredMessages.map(message => {
                  const isUnread = !message.read_by || !message.read_by.includes(currentUser.id);
                  const isSender = message.sender_id === currentUser.id;
                  const isSelected = selectedMessage?.id === message.id;
                  
                  return (
                    <button
                      key={message.id}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!isSender) markAsRead(message);
                      }}
                      className={`w-full p-5 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all ${
                        isUnread && !isSender ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      } ${isSelected ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {isUnread && !isSender ? (
                              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <MailOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <p className={`text-sm truncate ${isUnread && !isSender ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                              {isSender ? `To: ${message.recipient_ids?.map(id => getSenderName(id)).join(', ')}` : getSenderName(message.sender_id)}
                            </p>
                          </div>
                          <p className={`text-base truncate mb-2 ${isUnread && !isSender ? 'font-bold text-gray-900' : 'text-gray-800'}`}>
                            {message.subject}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{message.content}</p>
                        </div>
                        {isUnread && !isSender && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        {new Date(message.created_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No messages found</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border-2 border-gray-100">
            {selectedMessage ? (
              <div className="h-full flex flex-col">
                <div className="border-b-2 border-gray-100 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 break-words">{selectedMessage.subject}</h2>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {getSenderName(selectedMessage.sender_id)[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{getSenderName(selectedMessage.sender_id)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedMessage.created_date).toLocaleString('en-US', { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedMessage.recipient_ids && selectedMessage.recipient_ids.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="font-semibold">To:</span>
                        <span className="flex-1">{selectedMessage.recipient_ids.map(id => getSenderName(id)).join(', ')}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                  <div className="prose max-w-none">
                    <p className="text-gray-800 text-lg whitespace-pre-wrap break-words leading-relaxed">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-gray-500 p-12">
                <div>
                  <MessageSquare className="w-24 h-24 mx-auto mb-6 opacity-20" />
                  <p className="text-2xl font-semibold mb-2">Select a message to read</p>
                  <p className="text-gray-400">Choose a conversation from the inbox</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Compose Message
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {(getUserRole(currentUser) === 'teacher' || getUserRole(currentUser) === 'admin') && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Filter by Course (Optional)</Label>
                <Select
                  value={newMessage.course_id || ''}
                  onValueChange={(value) => setNewMessage({...newMessage, course_id: value, recipient_ids: []})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Users</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.title}>{course.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Recipients <span className="text-red-500">*</span>
                {newMessage.recipient_ids && newMessage.recipient_ids.length > 0 && (
                  <span className="ml-2 text-gray-500">({newMessage.recipient_ids.length} selected)</span>
                )}
              </Label>
              
              <div className="border-2 border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {(getUserRole(currentUser) === 'teacher' || getUserRole(currentUser) === 'admin') && recipients.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                    <Checkbox
                      id="select-all"
                      checked={newMessage.recipient_ids && newMessage.recipient_ids.length === recipients.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewMessage({
                            ...newMessage,
                            recipient_ids: recipients.map(u => u.id)
                          });
                        } else {
                          setNewMessage({...newMessage, recipient_ids: []});
                        }
                      }}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All ({recipients.length} users)
                    </label>
                  </div>
                )}
                
                {recipients.length > 0 ? (
                  recipients.map(user => (
                    <div key={user.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded px-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={newMessage.recipient_ids && newMessage.recipient_ids.includes(user.id)}
                        onCheckedChange={() => toggleRecipient(user.id)}
                      />
                      <label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer flex-1">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-gray-500 ml-2">({user.role})</span>
                        <span className="text-gray-400 ml-2 text-xs">{user.email}</span>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {getUserRole(currentUser) === 'student' 
                      ? 'No teachers or admins available to message' 
                      : 'No users available to message'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Subject <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Enter message subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                className="border-2 border-gray-200"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Message <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Type your message here..."
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                className="min-h-[200px] border-2 border-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsComposeOpen(false);
              setNewMessage({
                subject: '',
                content: '',
                course_id: '',
                recipient_ids: [],
                is_private: true
              });
            }}>Cancel</Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.subject || !newMessage.content || !newMessage.recipient_ids || newMessage.recipient_ids.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
