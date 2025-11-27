import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Users, FileText, TrendingUp, Calendar, Clock, PlayCircle, ChevronRight, ChevronDown, Shield, MessageCircle, ClipboardCheck, Printer } from "lucide-react";
import { getUserRole } from "../components/utils/getUserRole";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from "@/components/ui/button";

export default function TeacherDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseDetails, setCourseDetails] = useState({});
  const [enrollments, setEnrollments] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [recentProgress, setRecentProgress] = useState([]);
  const [progressSummary, setProgressSummary] = useState({});
  const [assessments, setAssessments] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalLectures: 0,
    totalQuizzes: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);
      if (userRole !== 'teacher') {
        if (userRole === 'admin') {
          window.location.href = createPageUrl("AdminDashboard");
          return;
        } else {
          window.location.href = createPageUrl("StudentDashboard");
          return;
        }
      }

      const teacherCourses = await base44.entities.Course.filter({ instructor_id: user.id });
      setCourses(teacherCourses);

      // Load assessments
      const allAssessments = await base44.entities.AssessmentExam.list();
      setAssessments(allAssessments);

      const details = {};
      const progressSummaryData = {};
      let totalLectures = 0;
      let totalQuizzes = 0;

      for (const course of teacherCourses) {
        const [modules, sections, videos, quizzes, courseEnrollments, courseProgress] = await Promise.all([
          base44.entities.Module.filter({ course_id: course.id }, 'order_index'),
          base44.entities.Section.filter({ course_id: course.id }, 'order_index'),
          base44.entities.Video.filter({ course_id: course.id }, 'order_index'),
          base44.entities.Quiz.filter({ course_id: course.id }),
          base44.entities.Enrollment.filter({ course_id: course.id }),
          base44.entities.StudentProgress.filter({ course_id: course.id })
        ]);

        details[course.id] = {
          modules,
          sections,
          videos,
          quizzes,
          enrollmentCount: courseEnrollments.length
        };

        const totalStudents = courseEnrollments.length;
        const completedStudents = courseEnrollments.filter(e => e.progress_percentage >= 100).length;
        const inProgressStudents = courseEnrollments.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100).length;
        const notStartedStudents = courseEnrollments.filter(e => !e.progress_percentage || e.progress_percentage === 0).length;

        progressSummaryData[course.id] = {
          totalStudents,
          completedStudents,
          inProgressStudents,
          notStartedStudents,
          completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0
        };

        totalLectures += videos.length;
        totalQuizzes += quizzes.length;
      }

      setCourseDetails(details);
      setProgressSummary(progressSummaryData);

      const courseIds = teacherCourses.map(c => c.id);
      const allEnrollments = [];
      for (const courseId of courseIds) {
        const courseEnrollments = await base44.entities.Enrollment.filter({ course_id: courseId });
        allEnrollments.push(...courseEnrollments);
      }
      setEnrollments(allEnrollments);

      const allQuizAttempts = await base44.entities.QuizAttempt.list();
      setQuizAttempts(allQuizAttempts);

      const allProgress = [];
      for (const courseId of courseIds) {
        const courseProgress = await base44.entities.StudentProgress.filter(
          { course_id: courseId },
          '-created_date',
          10
        );
        allProgress.push(...courseProgress);
      }
      setRecentProgress(allProgress.slice(0, 10));

      const uniqueStudents = new Set(allEnrollments.map(e => e.student_id));
      const completedQuizzes = allQuizAttempts.filter(a => a.status === 'completed');
      const averageScore = completedQuizzes.length > 0
        ? completedQuizzes.reduce((sum, a) => sum + a.score, 0) / completedQuizzes.length
        : 0;

      setStats({
        totalCourses: teacherCourses.length,
        totalStudents: uniqueStudents.size,
        totalLectures,
        totalQuizzes,
        averageScore: Math.round(averageScore)
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      window.location.href = createPageUrl("LandingPage");
    }
    setLoading(false);
  };

  const statCards = [
    { 
      title: "My Courses", 
      value: stats.totalCourses, 
      icon: BookOpen, 
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: createPageUrl("TeacherCourses")
    },
    { 
      title: "Total Students", 
      value: stats.totalStudents, 
      icon: Users, 
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      link: createPageUrl("TeacherCourses")
    },
    { 
      title: "Total Lectures", 
      value: stats.totalLectures, 
      icon: PlayCircle, 
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      link: createPageUrl("TeacherCourses")
    },
    { 
      title: "Total Quizzes", 
      value: stats.totalQuizzes, 
      icon: FileText, 
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      link: createPageUrl("TeacherCourses")
    },
    { 
      title: "Avg Score", 
      value: `${stats.averageScore}%`, 
      icon: TrendingUp, 
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      link: createPageUrl("StudentPerformance")
    },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
        {/* Welcome Section with Teacher Badge */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-2xl shadow-lg text-white mb-8">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                Welcome back, {currentUser?.full_name}! 👨‍🏫
              </h1>
              <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center gap-2 shadow-xl border-2 border-white/30">
                <Shield className="w-6 h-6 text-white" />
                <span className="text-sm font-black text-white tracking-wide">INSTRUCTOR</span>
              </div>
            </div>
            <p className="text-blue-100 mb-4">
              Manage your courses and track student progress
            </p>
            <div className="flex items-center text-blue-100">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">{new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link key={stat.title} to={stat.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer p-6`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">{stat.title}</p>
                      <motion.p
                        key={stat.value}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-bold text-gray-900"
                      >
                        {stat.value}
                      </motion.p>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-md`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </motion.div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                    />
                  </div>
                </div>

                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-bl-full`}></div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Assessment Exams Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Assessment Exams</h2>
            </div>
          </div>
          <div className="p-6">
            {assessments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{assessment.title}</h3>
                        <p className="text-sm text-gray-600">{assessment.questions?.length || 0} questions</p>
                      </div>
                      <Button
                        onClick={() => navigate(createPageUrl(`AssessmentSummary?id=${assessment.id}`))}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        View Summary
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">{assessment.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No assessment exams available</p>
              </div>
            )}
          </div>
        </div>

        {/* Course Progress Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Course Progress Summary</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {courses.length > 0 ? (
                courses.map((course) => {
                  const summary = progressSummary[course.id] || {};
                  return (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-500">{summary.totalStudents} students enrolled</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{summary.completionRate}%</p>
                          <p className="text-xs text-gray-500">Completion Rate</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{summary.completedStudents || 0}</p>
                          <p className="text-xs text-green-700">Completed</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">{summary.inProgressStudents || 0}</p>
                          <p className="text-xs text-yellow-700">In Progress</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-600">{summary.notStartedStudents || 0}</p>
                          <p className="text-xs text-gray-700">Not Started</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No courses assigned yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Quiz Analytics with Dropdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Quiz Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">Detailed performance metrics with question-level insights</p>
          </div>
          <div className="p-6">
            {courses.length > 0 ? (
              <div className="space-y-6">
                {courses.map((course) => {
                  const details = courseDetails[course.id] || {};
                  const quizzes = details.quizzes || [];
                  
                  if (quizzes.length === 0) return null;
                  
                  return (
                    <div key={course.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900 text-lg">{course.title}</h3>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        {quizzes.map((quiz) => {
                          const attempts = quizAttempts.filter(a => a.quiz_id === quiz.id && a.status === 'completed');
                          const totalAttempts = attempts.length;
                          const avgScore = totalAttempts > 0 
                            ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
                            : 0;
                          const passRate = totalAttempts > 0 
                            ? Math.round((attempts.filter(a => a.score >= (quiz.passing_score || 60)).length / totalAttempts) * 100)
                            : 0;
                          
                          const questionAnalytics = quiz.questions?.map((question, qIndex) => {
                            const questionAttempts = attempts.filter(a => a.answers && a.answers[qIndex] !== undefined);
                            const correctCount = questionAttempts.filter(a => {
                              const answer = a.answers[qIndex];
                              const correctAnswer = question.correct_answer;
                              if (Array.isArray(correctAnswer)) {
                                return JSON.stringify(answer) === JSON.stringify(correctAnswer);
                              }
                              return answer === correctAnswer;
                            }).length;
                            const correctPercentage = questionAttempts.length > 0 
                              ? Math.round((correctCount / questionAttempts.length) * 100)
                              : 0;
                            
                            return {
                              question: question.question,
                              correctPercentage,
                              totalAttempts: questionAttempts.length,
                              correctCount,
                              wrongCount: questionAttempts.length - correctCount
                            };
                          }) || [];

                          const scoreRanges = [
                            { range: '0-20', count: attempts.filter(a => a.score <= 20).length },
                            { range: '21-40', count: attempts.filter(a => a.score > 20 && a.score <= 40).length },
                            { range: '41-60', count: attempts.filter(a => a.score > 40 && a.score <= 60).length },
                            { range: '61-80', count: attempts.filter(a => a.score > 60 && a.score <= 80).length },
                            { range: '81-100', count: attempts.filter(a => a.score > 80).length }
                          ];

                          return (
                            <AccordionItem key={quiz.id} value={`quiz-${quiz.id}`} className="border-b">
                              <AccordionTrigger className="hover:bg-gray-50 px-6 py-4">
                                <div className="flex items-center justify-between w-full mr-4">
                                  <div className="flex items-center gap-4">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                      <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                                      <p className="text-sm text-gray-500">{quiz.questions?.length || 0} questions • {totalAttempts} attempts</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="font-bold text-blue-600 text-lg">{avgScore}%</span>
                                    <span className="text-gray-400">▼</span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6 bg-gray-50">
                                {/* Overall Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                    <p className="text-2xl font-bold text-blue-600">{totalAttempts}</p>
                                    <p className="text-sm text-gray-600">Total Attempts</p>
                                  </div>
                                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                                    <p className="text-2xl font-bold text-green-600">{passRate}%</p>
                                    <p className="text-sm text-gray-600">Pass Rate</p>
                                  </div>
                                  <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                                    <p className="text-2xl font-bold text-purple-600">{new Set(attempts.map(a => a.student_id)).size}</p>
                                    <p className="text-sm text-gray-600">Unique Students</p>
                                  </div>
                                </div>

                                {/* Score Distribution Chart */}
                                <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200">
                                  <h5 className="font-bold text-gray-900 mb-4 text-lg">Score Distribution</h5>
                                  <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={scoreRanges} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200"/>
                                        <XAxis 
                                          dataKey="range" 
                                          axisLine={false} 
                                          tickLine={false}
                                          tick={{ fontSize: 12, fill: '#6B7280' }}
                                        />
                                        <YAxis 
                                          axisLine={false} 
                                          tickLine={false}
                                          tick={{ fontSize: 12, fill: '#6B7280' }}
                                        />
                                        <Tooltip 
                                          cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} 
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                        <Bar dataKey="count" fill="#3B82F6" name="Students" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* Performance Pie Chart */}
                                <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200">
                                  <h5 className="font-bold text-gray-900 mb-4 text-lg">Pass/Fail Distribution</h5>
                                  <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={[
                                            { name: 'Passed', value: attempts.filter(a => a.score >= (quiz.passing_score || 60)).length },
                                            { name: 'Failed', value: attempts.filter(a => a.score < (quiz.passing_score || 60)).length }
                                          ]}
                                          cx="50%"
                                          cy="50%"
                                          labelLine={false}
                                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                          outerRadius={100}
                                          fill="#8884d8"
                                          dataKey="value"
                                        >
                                          <Cell fill="#10B981" />
                                          <Cell fill="#EF4444" />
                                        </Pie>
                                        <Tooltip />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                      <p className="text-xl font-bold text-green-600">{attempts.filter(a => a.score >= (quiz.passing_score || 60)).length}</p>
                                      <p className="text-sm text-gray-600">Students Passed</p>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                      <p className="text-xl font-bold text-red-600">{attempts.filter(a => a.score < (quiz.passing_score || 60)).length}</p>
                                      <p className="text-sm text-gray-600">Students Failed</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Question Performance */}
                                {questionAnalytics.length > 0 && (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h5 className="font-bold text-gray-900 mb-4 text-lg">Question-by-Question Analysis</h5>
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                      {questionAnalytics.map((qa, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                          <div className="flex items-start gap-3 mb-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-sm text-gray-700">
                                              {idx + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm text-gray-700 font-medium mb-2 break-words">{qa.question}</p>
                                              <div className="flex items-center flex-wrap gap-4 text-xs text-gray-600">
                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                  {qa.correctCount} correct
                                                </span>
                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                  {qa.wrongCount} wrong
                                                </span>
                                                <span className="font-bold text-gray-700 whitespace-nowrap">{qa.totalAttempts > 0 ? qa.correctPercentage : 0}% accuracy</span>
                                              </div>
                                            </div>
                                            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${
                                              qa.correctPercentage >= 70 ? 'bg-green-100 text-green-700' :
                                              qa.correctPercentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-red-100 text-red-700'
                                            }`}>
                                              {qa.totalAttempts > 0 ? qa.correctPercentage : 0}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full transition-all ${
                                                qa.correctPercentage >= 70 ? 'bg-green-500' :
                                                qa.correctPercentage >= 50 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                              }`}
                                              style={{ width: `${qa.correctPercentage}%` }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No quiz analytics available</p>
              </div>
            )}
          </div>
        </div>

        {/* My Courses with Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">My Courses & Lectures</h2>
            <Link to={createPageUrl("TeacherCourses")}>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </Link>
          </div>
          <div className="p-6">
            {courses.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {courses.map((course) => {
                  const details = courseDetails[course.id] || {};
                  const modules = details.modules || [];
                  const videos = details.videos || [];
                  const quizzes = details.quizzes || [];
                  const enrollmentCount = details.enrollmentCount || 0;

                  return (
                    <AccordionItem key={course.id} value={`course-${course.id}`} className="border-b border-gray-200">
                      <AccordionTrigger className="hover:bg-gray-50 px-4 py-4 rounded-lg">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">{course.title}</h3>
                              <p className="text-sm text-gray-500 capitalize">{course.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" /> {enrollmentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <PlayCircle className="w-4 h-4" /> {videos.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" /> {quizzes.length}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {modules.length > 0 ? (
                          <div className="space-y-4 mt-4">
                            {modules.map((module) => {
                              const moduleVideos = videos.filter(v => v.module_id === module.id);
                              return (
                                <div key={module.id} className="bg-gray-50 rounded-lg p-4">
                                  <h4 className="font-medium text-gray-900 mb-3">{module.title}</h4>
                                  {moduleVideos.length > 0 ? (
                                    <div className="space-y-2">
                                      {moduleVideos.slice(0, 5).map((video) => (
                                        <div key={video.id} className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded">
                                          <PlayCircle className="w-4 h-4 text-blue-500" />
                                          <span className="flex-1">{video.title}</span>
                                          <span className="text-gray-500 text-xs">{video.duration_minutes} min</span>
                                        </div>
                                      ))}
                                      {moduleVideos.length > 5 && (
                                        <p className="text-sm text-gray-500 pl-6">+ {moduleVideos.length - 5} more lectures</p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No lectures in this module yet</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : videos.length > 0 ? (
                          <div className="space-y-2 mt-4">
                            {videos.slice(0, 5).map((video) => (
                              <div key={video.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                <PlayCircle className="w-4 h-4 text-blue-500" />
                                <span className="flex-1">{video.title}</span>
                                <span className="text-gray-500 text-xs">{video.duration_minutes} min</span>
                              </div>
                            ))}
                            {videos.length > 5 && (
                              <p className="text-sm text-gray-500">+ {videos.length - 5} more lectures</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-4">No lectures in this course yet</p>
                        )}

                        <Link to={createPageUrl(`TeacherCourseDetail?id=${course.id}`)}>
                          <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                            Manage Course <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </Link>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No courses assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Recent Student Activity</h2>
          </div>
          <div className="p-6">
            {recentProgress.length > 0 ? (
              <div className="space-y-4">
                {recentProgress.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.progress_type.includes('video') ? (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <PlayCircle className="w-4 h-4 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Student {activity.progress_type.replace('_', ' ')}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Messages Button */}
      <Link 
        to={createPageUrl("Messages")} 
        className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-110"
        aria-label="Open messages"
      >
        <MessageCircle className="w-6 h-6" />
      </Link>
    </div>
  );
}