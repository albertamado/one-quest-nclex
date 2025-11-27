
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function FloatingChatWidget({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadInstructors();
      loadConversations();
    }
  }, [isOpen]);

  const loadInstructors = async () => {
    try {
      // Load instructor profiles
      const instructorProfiles = await base44.entities.InstructorProfile.filter({ is_active: true });
      
      const instructorList = instructorProfiles.map(profile => ({
        id: profile.user_id || profile.id,
        name: profile.full_name,
        email: profile.email,
        profile_photo_url: profile.profile_photo_url,
        isProfile: true
      }));

      // Load users who have user_type === 'teacher'
      const allMessages = await base44.entities.Message.list();
      const teacherIds = new Set();
      
      allMessages.forEach(msg => {
        if (msg.sender_id !== currentUser.id) {
          teacherIds.add(msg.sender_id);
        }
        if (msg.recipient_ids && Array.isArray(msg.recipient_ids)) {
          msg.recipient_ids.forEach(id => {
            if (id !== currentUser.id) teacherIds.add(id);
          });
        }
      });

      // Load each teacher individually and check user_type
      for (const teacherId of teacherIds) {
        if (!instructorList.find(i => i.id === teacherId)) {
          try {
            const teacher = await base44.entities.User.filter({ id: teacherId });
            if (teacher[0] && teacher[0].user_type === 'teacher') {
              instructorList.push({
                id: teacher[0].id,
                name: teacher[0].full_name || teacher[0].email,
                email: teacher[0].email,
                profile_photo_url: teacher[0].profile_photo_url,
                isProfile: false
              });
            }
          } catch (err) {
            console.warn("Could not load teacher:", teacherId);
          }
        }
      }

      setInstructors(instructorList);
      if (instructorList.length > 0 && !selectedInstructor) {
        setSelectedInstructor(instructorList[0].id);
      }
    } catch (error) {
      console.error("Error loading instructors:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const sent = await base44.entities.Message.filter({ sender_id: currentUser.id }, '-created_date');
      const allMessages = await base44.entities.Message.list('-created_date');
      const received = allMessages.filter(m => 
        m.recipient_ids && m.recipient_ids.includes(currentUser.id)
      );

      const allConvos = [...sent, ...received].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );

      setConversations(allConvos);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedInstructor) return;
    
    setIsSending(true);
    try {
      await base44.entities.Message.create({
        sender_id: currentUser.id,
        recipient_ids: [selectedInstructor],
        subject: 'Student Support Request',
        content: message,
        is_private: true
      });

      await base44.entities.Notification.create({
        user_id: selectedInstructor,
        title: 'New Student Message',
        message: `${currentUser.full_name} sent you a message`,
        notification_type: 'message',
        related_entity_type: 'message',
        link_url: '/Messages'
      });

      setMessage('');
      await loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
    setIsSending(false);
  };

  const getConversationsWithInstructor = () => {
    if (!selectedInstructor) return [];
    
    return conversations.filter(conv => 
      conv.sender_id === selectedInstructor || 
      (conv.recipient_ids && conv.recipient_ids.includes(selectedInstructor))
    );
  };

  const selectedInstructorData = instructors.find(i => i.id === selectedInstructor);
  const instructorConversations = getConversationsWithInstructor();

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:from-blue-700 hover:to-teal-700 transition-all z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-28 right-8 w-96 bg-white rounded-2xl shadow-2xl z-50 border-2 border-gray-200 flex flex-col"
            style={{ maxHeight: '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 text-white rounded-t-2xl">
              <h3 className="font-bold text-lg mb-3">Contact Instructors</h3>
              
              {/* Instructor Profile Pictures */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {instructors.map((instructor) => (
                  <button
                    key={instructor.id}
                    onClick={() => setSelectedInstructor(instructor.id)}
                    className={`flex-shrink-0 transition-all ${
                      selectedInstructor === instructor.id
                        ? 'ring-4 ring-white scale-110'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={instructor.profile_photo_url} />
                      <AvatarFallback className="bg-white text-blue-600 font-bold">
                        {instructor.name?.[0]?.toUpperCase() || 'I'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Chat Head */}
            {selectedInstructorData && (
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedInstructorData.profile_photo_url} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedInstructorData.name?.[0]?.toUpperCase() || 'I'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{selectedInstructorData.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedInstructorData.email}</p>
                </div>
              </div>
            )}

            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '300px' }}>
              {instructorConversations.length > 0 ? (
                instructorConversations.map((conv, idx) => {
                  const isFromMe = conv.sender_id === currentUser.id;
                  return (
                    <div key={idx} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        isFromMe 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm break-words">{conv.content}</p>
                        <p className={`text-xs mt-1 ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(conv.created_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No conversation yet</p>
                  <p className="text-xs">Start chatting with your instructor</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full min-h-20 resize-none border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mb-2"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isSending || !selectedInstructor}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-2"
              >
                {isSending ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
