import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserRole } from '../components/utils/getUserRole';
import { CheckCircle, XCircle, Clock, Crown, Shield, Award, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LoadingScreen from '../components/shared/LoadingScreen';

export default function AdminEnrollmentRequests() {
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (getUserRole(user) !== 'admin') {
        window.location.href = createPageUrl("LandingPage");
        return;
      }

      const [allRequests, allUsers] = await Promise.all([
        base44.entities.EnrollmentRequest.list('-requested_date'),
        base44.entities.User.list()
      ]);

      setRequests(allRequests);

      const studentsMap = {};
      allUsers.forEach(u => {
        studentsMap[u.id] = u;
      });
      setStudents(studentsMap);

    } catch (error) {
      console.error("Error loading enrollment requests:", error);
    }
    setLoading(false);
  };

  const openModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    setIsModalOpen(true);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);
    try {
      const newStatus = actionType === 'approve' ? 'approved' : 'declined';
      
      await base44.entities.EnrollmentRequest.update(selectedRequest.id, {
        status: newStatus,
        reviewed_by: currentUser.id,
        reviewed_date: new Date().toISOString(),
        admin_notes: adminNotes
      });

      if (actionType === 'approve') {
        const startDate = new Date();
        let endDate = new Date();
        let durationDays = 0;
        let studyPlanWeeks = 0;

        switch (selectedRequest.subscription_tier) {
          case 'premium':
            endDate.setFullYear(endDate.getFullYear() + 1);
            durationDays = 365;
            studyPlanWeeks = 18;
            break;
          case 'standard':
            endDate.setDate(endDate.getDate() + 90);
            durationDays = 90;
            studyPlanWeeks = 6;
            break;
          case 'basic':
            endDate.setDate(endDate.getDate() + 45);
            durationDays = 45;
            studyPlanWeeks = 2;
            break;
        }

        // Create subscription
        await base44.entities.Subscription.create({
          user_id: selectedRequest.student_id,
          subscription_tier: selectedRequest.subscription_tier,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true,
          academic_phase_access: selectedRequest.subscription_tier === 'premium',
          critical_phase_access: true,
          extensive_phase_access: true,
          has_personal_counselor: selectedRequest.subscription_tier !== 'basic',
          has_personal_mentor: selectedRequest.subscription_tier !== 'basic',
          has_pass_guarantee: selectedRequest.subscription_tier === 'premium',
          study_plan_weeks: studyPlanWeeks,
          duration_days: durationDays
        });

        // Update user subscription tier
        await base44.entities.User.update(selectedRequest.student_id, {
          subscription_tier: selectedRequest.subscription_tier,
          subscription_status: 'active'
        });
      }

      // Try to create notification, but don't fail if it doesn't work
      try {
        await base44.entities.Notification.create({
          user_id: selectedRequest.student_id,
          title: `Enrollment Request ${newStatus === 'approved' ? 'Approved' : 'Declined'}`,
          message: newStatus === 'approved' 
            ? `Your ${selectedRequest.subscription_tier} subscription has been approved! You can now access your courses.`
            : `Your enrollment request has been declined. ${adminNotes ? 'Reason: ' + adminNotes : 'Please contact support for more information.'}`,
          notification_type: 'system',
          related_entity_type: 'enrollment_request'
        });
      } catch (notificationError) {
        console.log("Could not create notification:", notificationError);
        // Continue anyway - notification is not critical
      }

      await loadData();
      setIsModalOpen(false);
      alert(`Enrollment request ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Failed to process request. Please try again.');
    }
    setIsProcessing(false);
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'premium': return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'standard': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'basic': return <Award className="w-5 h-5 text-gray-500" />;
      default: return null;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium': return 'from-yellow-500 to-amber-600';
      case 'standard': return 'from-blue-500 to-indigo-600';
      case 'basic': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading enrollment requests..." />;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to={createPageUrl("AdminDashboard")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Enrollment Requests
          </h1>
          <p className="text-gray-600 text-lg">Review and process student enrollment requests</p>
        </div>

        {/* Pending Requests */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Requests ({pendingRequests.length})</h2>
          
          {pendingRequests.length > 0 ? (
            <div className="grid gap-6">
              {pendingRequests.map((request) => {
                const student = students[request.student_id];
                
                return (
                  <div key={request.id} className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {student?.full_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{student?.full_name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-600">{student?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <div className={`px-4 py-2 bg-gradient-to-r ${getTierColor(request.subscription_tier)} rounded-lg flex items-center gap-2`}>
                            {getTierIcon(request.subscription_tier)}
                            <span className="text-white font-bold uppercase">{request.subscription_tier}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {new Date(request.requested_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => openModal(request, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => openModal(request, 'decline')}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-100">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No pending requests</p>
            </div>
          )}
        </div>

        {/* Processed Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Processed Requests ({processedRequests.length})</h2>
          
          {processedRequests.length > 0 ? (
            <div className="grid gap-4">
              {processedRequests.map((request) => {
                const student = students[request.student_id];
                const reviewer = students[request.reviewed_by];
                
                return (
                  <div key={request.id} className={`bg-white rounded-xl shadow-md border-2 ${request.status === 'approved' ? 'border-green-200' : 'border-red-200'} p-6`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900">{student?.full_name || 'Unknown'}</h3>
                          <div className={`px-3 py-1 ${request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} rounded-lg text-sm font-semibold`}>
                            {request.status.toUpperCase()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{student?.email}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          {getTierIcon(request.subscription_tier)}
                          <span className="font-medium uppercase">{request.subscription_tier}</span>
                          <span>•</span>
                          <span>Reviewed by {reviewer?.full_name || 'Admin'}</span>
                          <span>•</span>
                          <span>{new Date(request.reviewed_date).toLocaleDateString()}</span>
                        </div>
                        {request.admin_notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">Notes: {request.admin_notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-100">
              <p className="text-gray-600">No processed requests</p>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve' : 'Decline'} Enrollment Request
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to {actionType} this request?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes or reasons..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProcessRequest}
                  disabled={isProcessing}
                  className={`flex-1 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isProcessing ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Decline'}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}