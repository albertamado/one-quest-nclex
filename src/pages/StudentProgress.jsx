import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Enrollment } from "@/api/entities";
import { StudentProgress } from "@/api/entities";
import { QuizAttempt } from "@/api/entities";
import { TrendingUp, BookOpen, FileText, Clock, Trophy, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function StudentProgressPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    averageScore: 0,
    totalStudyTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load enrollments
      const userEnrollments = await Enrollment.filter({ student_id: user.id });
      setEnrollments(userEnrollments);

      // Load progress
      const userProgress = await StudentProgress.filter(
        { student_id: user.id }, 
        '-created_date'
      );
      setProgress(userProgress);

      // Load quiz attempts
      const userQuizAttempts = await QuizAttempt.filter({ student_id: user.id });
      setQuizAttempts(userQuizAttempts);

      // Calculate stats
      const completedCourses = userEnrollments.filter(e => e.progress_percentage >= 100).length;
      const completedQuizzes = userQuizAttempts.filter(a => a.status === 'completed');
      const averageScore = completedQuizzes.length > 0 
        ? completedQuizzes.reduce((sum, a) => sum + a.score, 0) / completedQuizzes.length
        : 0;
      
      const totalStudyTime = userProgress
        .filter(p => p.time_spent_minutes)
        .reduce((sum, p) => sum + p.time_spent_minutes, 0);

      setStats({
        totalCourses: userEnrollments.length,
        completedCourses,
        averageScore: Math.round(averageScore),
        totalStudyTime: Math.round(totalStudyTime)
      });

    } catch (error) {
      console.error("Error loading progress data:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Progress</h1>
          <p className="text-gray-600">
            Track your learning progress and achievements
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudyTime}m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Course Progress</h2>
            </div>
            <div className="p-6">
              {enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.map((enrollment, index) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Course {index + 1}</h3>
                        <p className="text-sm text-gray-500">
                          Enrolled: {format(new Date(enrollment.enrollment_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {enrollment.progress_percentage || 0}%
                        </p>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No courses enrolled yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {progress.length > 0 ? (
                <div className="space-y-4">
                  {progress.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.progress_type.includes('video') ? (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.progress_type === 'video_completed' && 'Completed video'}
                          {activity.progress_type === 'video_watched' && 'Started video'}
                          {activity.progress_type === 'quiz_completed' && 'Completed quiz'}
                          {activity.progress_type === 'quiz_started' && 'Started quiz'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.created_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}