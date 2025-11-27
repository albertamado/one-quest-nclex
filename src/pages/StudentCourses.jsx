import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Lock, Crown, Shield, Award, CheckCircle, ArrowRight, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import LoadingScreen from "../components/shared/LoadingScreen";
import { Button } from "@/components/ui/button";

export default function StudentCourses() {
  const [currentUser, setCurrentUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [allPhaseCourses, setAllPhaseCourses] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        window.location.href = createPageUrl("LandingPage");
        return;
      }

      const user = await base44.auth.me();
      setCurrentUser(user);

      if (!user.subscription_tier) {
        setLoading(false);
        return;
      }

      const subscriptions = await base44.entities.Subscription.filter({ 
        user_id: user.id,
        is_active: true 
      });
      
      const activeSubscription = subscriptions.length > 0 ? subscriptions[0] : null;
      setSubscription(activeSubscription);

      const userEnrollments = await base44.entities.Enrollment.filter({ student_id: user.id });
      setEnrollments(userEnrollments || []);

      const allCourses = await base44.entities.Course.list('order_index');
      
      const filteredCourses = allCourses.filter(course => 
        user.assigned_phase && course.phase === user.assigned_phase
      );
      
      setAllPhaseCourses(filteredCourses || []);

    } catch (error) {
      console.error("Error loading courses:", error);
      setError(error.message || "Failed to load courses");
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingScreen message="Loading your courses..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Error Loading Courses</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={loadCourses} 
              className="flex-1 bg-[#0077B6] hover:bg-[#005f8f] text-white py-2 px-4 rounded-xl shadow-md"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = createPageUrl("StudentDashboard")} 
              variant="outline"
              className="flex-1 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 py-2 px-4 rounded-xl shadow-sm"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser?.subscription_tier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-[#0077B6]">
            <div className="w-24 h-24 bg-gradient-to-br from-[#0077B6] to-[#00B4D8] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black text-[#023E8A] mb-4">Subscription Required</h2>
            <p className="text-lg text-gray-600 mb-8 text-justify max-w-2xl mx-auto">
              You need an active subscription to access courses. Please choose a subscription plan to continue your learning journey.
            </p>
            <Link to={createPageUrl("Programs")}>
              <Button className="px-8 py-6 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] hover:from-[#005f8f] hover:to-[#0096C7] text-white font-bold rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all">
                View Subscription Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  
  const getSubscriptionIcon = (tier) => {
    switch (tier) {
      case 'premium': return Crown;
      case 'standard': return Shield;
      case 'basic': return Award;
      default: return Award;
    }
  };

  const getSubscriptionGradient = (tier) => {
    switch (tier) {
      case 'premium': return 'from-yellow-500 to-amber-600';
      case 'standard': return 'from-gray-400 to-gray-500';
      case 'basic': return 'from-amber-700 to-amber-900';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const SubscriptionIcon = getSubscriptionIcon(currentUser?.subscription_tier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Subscription */}
        <div className="bg-gradient-to-r from-[#0077B6] via-[#0096C7] to-[#00B4D8] rounded-3xl shadow-2xl p-8 mb-8 border-4 border-white">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white mb-2">My Courses</h1>
              <p className="text-[#CAF0F8] text-lg font-medium">Your learning journey with {currentUser?.subscription_tier} subscription</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${getSubscriptionGradient(currentUser?.subscription_tier)} rounded-xl flex items-center justify-center shadow-lg`}>
                  <SubscriptionIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase mb-1">Active Subscription</p>
                  <p className="text-2xl font-black text-white uppercase">{currentUser?.subscription_tier}</p>
                  {currentUser?.subscription_end_date && (
                    <div className="flex items-center gap-2 mt-2">
                      <CalendarIcon className="w-4 h-4 text-white/80" />
                      <p className="text-sm font-semibold text-white/90">
                        Valid until: {new Date(currentUser.subscription_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accessible Phases */}
          <div className="mt-6 pt-6 border-t-2 border-white/20">
            <p className="text-white/90 font-bold mb-3">Your Subscription Access:</p>
            <div className="flex flex-wrap gap-3">
              {['Academic Phase (Phase 1)', 'Critical Phase (Phase 2)', 'Extensive Phase (Phase 3)'].map((phase, idx) => {
                const hasAccess = 
                  (currentUser?.subscription_tier === 'premium') ||
                  (currentUser?.subscription_tier === 'standard' && idx > 0) ||
                  (currentUser?.subscription_tier === 'basic' && idx > 0);
                
                return (
                  <div 
                    key={idx}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      hasAccess 
                        ? 'bg-white text-[#0077B6]' 
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {hasAccess ? '✓' : '✗'} {phase}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {allPhaseCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPhaseCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course.id);
              const enrollment = enrollments.find(e => e.course_id === course.id);
              const progress = enrollment?.progress_percentage || 0;
              
              return (
                <div 
                  key={course.id} 
                  className={`rounded-2xl shadow-xl overflow-hidden transition-all duration-300 flex flex-col h-full border-2 ${
                    isEnrolled 
                      ? 'bg-white border-[#0077B6] hover:shadow-2xl hover:scale-105' 
                      : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
                >
                  {/* Course Image */}
                  {course.cover_photo_url && (
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={course.cover_photo_url}
                        alt={course.title}
                        className={`w-full h-full object-cover ${isEnrolled ? 'group-hover:scale-110 transition-transform duration-300' : 'grayscale'}`}
                      />
                      {!isEnrolled && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Lock className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-[#023E8A] mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 text-justify flex-grow">
                      {course.description}
                    </p>

                    {isEnrolled ? (
                      <>
                        <div className="space-y-3 mb-4 mt-auto">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 font-semibold">Progress</span>
                            <span className="font-bold text-[#0077B6]">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] h-3 rounded-full transition-all duration-500 shadow-lg"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <Link to={createPageUrl(`StudentCourse?id=${course.id}`)}>
                          <Button className="w-full bg-gradient-to-r from-[#0077B6] to-[#00B4D8] hover:from-[#005f8f] hover:to-[#0096C7] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center group">
                            Continue Learning
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <div className="mt-auto">
                        <Button 
                          disabled 
                          className="w-full bg-gray-300 text-gray-500 cursor-not-allowed py-4 rounded-xl"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Locked Course
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Not enrolled in this course
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center bg-white rounded-3xl p-12 shadow-xl border-2 border-[#0077B6]">
            <BookOpen className="w-16 h-16 text-[#0077B6] mx-auto mb-4" />
            <h3 className="text-2xl font-black text-[#023E8A] mb-2">No courses available</h3>
            <p className="text-gray-600">Courses will appear here once you're assigned to a phase</p>
          </div>
        )}
      </div>
    </div>
  );
}