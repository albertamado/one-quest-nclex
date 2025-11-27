
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Trophy, ArrowRight, Award, Crown, Shield, CheckCircle, Target, AlertCircle, Calendar as CalendarIcon, MessageCircle, ClipboardCheck } from "lucide-react";
import { getUserRole } from "../components/utils/getUserRole";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import LoadingScreen from "../components/shared/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FloatingChatWidget from "../components/student/FloatingChatWidget";
import TicketWidget from '../components/student/TicketWidget'; // Added TicketWidget import

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedQuizzes: 0,
    averageScore: 0,
    hoursWatched: 0,
    coursesCompleted: 0,
    quizzesCompleted: 0,
    quizzesPassed: 0,
    successRate: 0,
    strongestSubjects: [],
    weakestSubjects: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [badges, setBadges] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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

      const userRole = getUserRole(user);
      
      if (userRole === 'admin') {
        window.location.href = createPageUrl("AdminDashboard");
        return;
      } else if (userRole === 'teacher') {
        window.location.href = createPageUrl("TeacherDashboard");
        return;
      }

      if (!user.subscription_tier || user.subscription_status !== 'active') {
        window.location.href = createPageUrl("LandingPage");
        return;
      }

      // Check if student has completed assessment
      const assessmentAttempts = await base44.entities.AssessmentAttempt.filter({ student_id: user.id });
      const hasAssessment = assessmentAttempts.length > 0;
      setHasCompletedAssessment(hasAssessment);

      if (!hasAssessment) {
        setShowAssessmentModal(true);
        setLoading(false);
        return;
      }

      const userEnrollments = await base44.entities.Enrollment.filter({ student_id: user.id });
      setEnrollments(userEnrollments || []);

      if (userEnrollments && userEnrollments.length > 0) {
        const courseIds = userEnrollments.map(e => e.course_id);
        const enrolledCourses = await Promise.all(
          courseIds.map(async (courseId) => {
            try {
              const course = await base44.entities.Course.filter({ id: courseId });
              return course[0];
            } catch (err) {
              console.error(`Error loading course ${courseId}:`, err);
              return null;
            }
          })
        );
        setCourses(enrolledCourses.filter(Boolean));
      }

      const progress = await base44.entities.StudentProgress.filter({ student_id: user.id });
      const quizAttempts = await base44.entities.QuizAttempt.filter({ student_id: user.id });
      const completedQuizAttempts = quizAttempts.filter(a => a.status === 'completed');
      
      const uniqueCompletedQuizzesCount = [...new Set(completedQuizAttempts.map(a => a.quiz_id))].length;
      const quizzesPassedCount = completedQuizAttempts.filter(a => a.score >= 75).length;
      const averageScore = completedQuizAttempts.length > 0 
        ? completedQuizAttempts.reduce((sum, a) => sum + a.score, 0) / completedQuizAttempts.length
        : 0;
      
      const totalHours = progress
        .filter(p => p.time_spent_minutes)
        .reduce((sum, p) => sum + p.time_spent_minutes, 0) / 60;
      
      const completedCourses = userEnrollments.filter(e => e.progress_percentage >= 100).length;
      const successRate = completedQuizAttempts.length > 0 
        ? Math.round((quizzesPassedCount / completedQuizAttempts.length) * 100)
        : 0;

      const subjectScores = {};
      for (const attempt of completedQuizAttempts) {
        try {
          const quiz = await base44.entities.Quiz.filter({ id: attempt.quiz_id });
          if (quiz[0] && quiz[0].course_id) {
            const course = await base44.entities.Course.filter({ id: quiz[0].course_id });
            if (course[0]) {
              const subject = course[0].category || 'General';
              if (!subjectScores[subject]) {
                subjectScores[subject] = { total: 0, count: 0 };
              }
              subjectScores[subject].total += attempt.score;
              subjectScores[subject].count += 1;
            }
          }
        } catch (err) {
          console.error("Error processing quiz attempt for ID:", attempt.quiz_id, err);
        }
      }

      const subjectAverages = Object.entries(subjectScores).map(([subject, data]) => ({
        subject,
        average: data.total / data.count
      }));

      const strongestSubjects = subjectAverages
        .sort((a, b) => b.average - a.average)
        .slice(0, 3);
      
      const weakestSubjects = subjectAverages
        .sort((a, b) => a.average - b.average)
        .slice(0, 3);

      const recentActivity = progress
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 10);

      const earnedBadges = [];
      if (completedCourses >= 1) earnedBadges.push({ name: 'First Course Complete', icon: '🎓', color: 'bg-blue-100 text-blue-800' });
      if (completedCourses >= 3) earnedBadges.push({ name: 'Course Master', icon: '🏆', color: 'bg-yellow-100 text-yellow-800' });
      if (quizzesPassedCount >= 5) earnedBadges.push({ name: 'Quiz Champion', icon: '⭐', color: 'bg-green-100 text-green-800' });
      if (successRate >= 80) earnedBadges.push({ name: 'High Achiever', icon: '🎯', color: 'bg-purple-100 text-purple-800' });
      if (totalHours >= 10) earnedBadges.push({ name: 'Dedicated Learner', icon: '📚', color: 'bg-indigo-100 text-indigo-800' });
      
      setBadges(earnedBadges);

      setStats({
        totalCourses: userEnrollments.length,
        completedQuizzes: uniqueCompletedQuizzesCount,
        averageScore: Math.round(averageScore),
        hoursWatched: Math.round(totalHours * 10) / 10,
        coursesCompleted: completedCourses,
        quizzesCompleted: completedQuizAttempts.length,
        quizzesPassed: quizzesPassedCount,
        successRate: successRate,
        strongestSubjects,
        weakestSubjects,
        recentActivity
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(error.message || "Failed to load dashboard data. Please try again.");
    }
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
      case 'standard': return 'from-blue-500 to-indigo-600';
      case 'basic': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const SubscriptionIcon = getSubscriptionIcon(currentUser?.subscription_tier);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={loadDashboardData} 
              className="flex-1 bg-[#0077B6] hover:bg-[#005f8f] text-white py-2 px-4 rounded-xl shadow-md"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = createPageUrl("LandingPage")} 
              variant="outline"
              className="flex-1 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 py-2 px-4 rounded-xl shadow-sm"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Greeting with Premium Badge */}
        <div className="mb-6 bg-gradient-to-r from-[#023E8A] via-[#0077B6] to-[#0096C7] rounded-3xl shadow-2xl text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {getGreeting()}, {currentUser?.full_name || 'Student'}! 👋
                </h1>
                {SubscriptionIcon && (
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${getSubscriptionGradient(currentUser?.subscription_tier)} rounded-xl flex items-center justify-center shadow-lg`}>
                    <SubscriptionIcon className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <p className="text-[#CAF0F8] text-lg font-medium">
                Ready to continue your NCLEX preparation journey? 🚀
              </p>
            </div>
          </div>
        </div>

        {/* Subscription & Areas for Improvement Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Subscription Badge */}
          <div className="lg:col-span-2 bg-white backdrop-blur-sm border-3 border-[#0077B6] rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[#023E8A] text-lg flex items-center gap-2">
                    Active Subscription
                    {SubscriptionIcon && (
                      <SubscriptionIcon className="w-5 h-5 text-yellow-500" />
                    )}
                  </h3>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getSubscriptionGradient(currentUser?.subscription_tier)} rounded-xl shadow-lg`}>
                    <span className="text-white font-bold text-base uppercase">
                      {currentUser?.subscription_tier}
                    </span>
                  </div>
                </div>
                {currentUser?.subscription_end_date && (
                  <p className="text-gray-600 text-sm font-semibold flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4" />
                    Valid until: {new Date(currentUser.subscription_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <p className="text-gray-600 text-sm mt-2">
                  You have full access to your subscribed courses and materials. Make the most of your learning journey!
                </p>
                
                {/* Badges Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Badges Earned
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {badges.length > 0 ? (
                      badges.map((badge, idx) => (
                        <div key={idx} className={`${badge.color} px-3 py-2 rounded-lg flex items-center gap-2`}>
                          <span className="text-xl">{badge.icon}</span>
                          <span className="text-sm font-semibold">{badge.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Complete courses and quizzes to earn badges!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-orange-600" />
              <h3 className="font-bold text-gray-900 text-lg">Areas for Improvement</h3>
            </div>
            {stats.weakestSubjects.length > 0 ? (
              <div className="space-y-3">
                {stats.weakestSubjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="font-medium text-gray-900 capitalize text-sm">{subject.subject.replace('-', ' ')}</span>
                    <span className="text-orange-700 font-bold text-sm">{Math.round(subject.average)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Complete more quizzes to identify areas for improvement</p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#023E8A] to-[#0077B6] rounded-3xl shadow-2xl p-6 text-center border-3 border-[#00B4D8]/30 hover:border-[#00B4D8]/50 hover:shadow-3xl transition-all">
            <div className="w-12 h-12 bg-[#00B4D8]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {stats.coursesCompleted}/{stats.totalCourses}
            </div>
            <div className="text-sm text-[#CAF0F8] font-medium">Courses Completed</div>
          </div>

          <div className="bg-gradient-to-br from-[#023E8A] to-[#0077B6] rounded-3xl shadow-2xl p-6 text-center border-3 border-green-500/30 hover:border-green-400/50 hover:shadow-3xl transition-all">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.completedQuizzes}</div>
            <div className="text-sm text-[#CAF0F8] font-medium">Quizzes Completed</div>
          </div>

          <div className="bg-gradient-to-br from-[#023E8A] to-[#0077B6] rounded-3xl shadow-2xl p-6 text-center border-3 border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-3xl transition-all">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.averageScore}%</div>
            <div className="text-sm text-[#CAF0F8] font-medium">Average Score</div>
          </div>

          <div className="bg-gradient-to-br from-[#023E8A] to-[#0077B6] rounded-3xl shadow-2xl p-6 text-center border-3 border-purple-500/30 hover:border-purple-400/50 hover:shadow-3xl transition-all">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.successRate}%</div>
            <div className="text-sm text-[#CAF0F8] font-medium">Success Rate</div>
          </div>
        </div>

        {/* Strongest Subjects */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-200 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-gray-900 text-lg">Strongest Areas</h3>
          </div>
          {stats.strongestSubjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.strongestSubjects.map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-medium text-gray-900 capitalize">{subject.subject.replace('-', ' ')}</span>
                  <span className="text-green-700 font-bold text-lg">{Math.round(subject.average)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Complete quizzes to see your strongest areas</p>
          )}
        </div>

        {/* My Courses Section */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          </div>
          <div className="p-6">
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const enrollment = enrollments.find(e => e.course_id === course.id);
                  const progress = enrollment?.progress_percentage || 0;
                  
                  return (
                    <div key={course.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                      {course.cover_photo_url && (
                        <div className="h-48 flex-shrink-0">
                          <img
                            src={course.cover_photo_url}
                            alt={course.title}
                            className="w-full h-full object-cover rounded-t-2xl"
                          />
                        </div>
                      )}
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 text-justify flex-grow">{course.description}</p>
                        
                        <div className="space-y-3 mb-4 mt-auto">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-bold text-gray-700">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-gray-400 to-gray-500 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              progress === 100 
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : progress > 0 
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <Link to={createPageUrl(`StudentCourse?id=${course.id}`)}>
                            <Button className="w-full bg-gradient-to-r from-[#023E8A] to-[#0077B6] hover:from-[#0096C7] hover:to-[#0077B6] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center group">
                              Continue Learning
                              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No courses enrolled yet</p>
                <Link to={createPageUrl("StudentCourses")}>
                  <Button className="px-6 py-3 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white rounded-xl hover:shadow-lg transition-all">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Widget */}
      {currentUser && <FloatingChatWidget currentUser={currentUser} />}

      {/* Add Ticket Widget */}
      {currentUser && <TicketWidget currentUser={currentUser} />}

      {/* Assessment Modal */}
      <Dialog open={showAssessmentModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <ClipboardCheck className="w-8 h-8 text-blue-600" />
              Assessment Required
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-4">
                Before starting your courses, you need to complete an initial assessment exam. This helps us understand your current knowledge level and personalize your learning experience.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium">
                  📊 Your results will help instructors provide better guidance
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("AssessmentExam"))}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg text-lg"
            >
              Take Assessment Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
