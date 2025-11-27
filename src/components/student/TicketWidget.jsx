import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { HelpCircle, Send, CheckCircle } from 'lucide-react';

export default function TicketWidget({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketData, setTicketData] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticketData.subject.trim() || !ticketData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await base44.entities.Ticket.create({
        user_id: currentUser.id,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: 'open'
      });

      // Notify admins
      const admins = await base44.entities.User.filter({ user_type: 'admin' });
      await Promise.all(admins.map(admin => 
        base44.entities.Notification.create({
          user_id: admin.id,
          title: 'New Support Ticket',
          message: `${currentUser.full_name} submitted a ticket: ${ticketData.subject}`,
          notification_type: 'system',
          related_entity_type: 'ticket',
          link_url: '/AdminTickets'
        })
      ));

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        setTicketData({
          subject: '',
          description: '',
          category: 'other',
          priority: 'medium'
        });
      }, 2000);

    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("Failed to submit ticket. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transform hover:scale-110 transition-all duration-300"
      >
        <HelpCircle className="w-8 h-8" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Submit Support Ticket
            </DialogTitle>
            <p className="text-gray-600 text-sm">
              Need help? Submit a ticket and our team will assist you.
            </p>
          </DialogHeader>

          {showSuccess ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted!</h3>
              <p className="text-gray-600">We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">Subject *</Label>
                <Input
                  placeholder="Brief description of your issue"
                  value={ticketData.subject}
                  onChange={(e) => setTicketData({...ticketData, subject: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Category *</Label>
                <Select
                  value={ticketData.category}
                  onValueChange={(value) => setTicketData({...ticketData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="course">Course Content</SelectItem>
                    <SelectItem value="quiz">Quiz Problem</SelectItem>
                    <SelectItem value="video">Video Issue</SelectItem>
                    <SelectItem value="account">Account Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Priority</Label>
                <Select
                  value={ticketData.priority}
                  onValueChange={(value) => setTicketData({...ticketData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Description *</Label>
                <Textarea
                  placeholder="Provide detailed information about your issue..."
                  value={ticketData.description}
                  onChange={(e) => setTicketData({...ticketData, description: e.target.value})}
                  className="min-h-[150px]"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}