import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserRole } from '../components/utils/getUserRole';
import { Award, TrendingUp, Target, Clock, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingScreen from '../components/shared/LoadingScreen';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StudentPerformance() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);
      
      let allAttempts = [];
      let allProgress = [];
      
      if (userRole === 'admin' || userRole === 'teacher') {
        allAttempts = await base44.entities.QuizAttempt.list('-created_date');
        allProgress = await base44.entities.StudentProgress.list('-created_date');
      } else {
        allAttempts = await base44.entities.QuizAttempt.filter({ student_id: user.id }, '-created_date');
        allProgress = await base44.entities.StudentProgress.filter({ student_id: user.id }, '-created_date');
      }

      const allQuizzes = await base44.entities.Quiz.list();

      setAttempts(allAttempts);
      setQuizzes(allQuizzes);
      setProgress(allProgress);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingScreen message="Loading performance data..." />;
  }

  // Calculate statistics
  const totalQuizzesTaken = new Set(attempts.map(a => a.quiz_id)).size;
  const averageScore = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
    : 0;
  const passRate = attempts.length > 0
    ? Math.round((attempts.filter(a => a.score >= 60).length / attempts.length) * 100)
    : 0;
  
  // Videos watched
  const videosWatched = progress.filter(p => p.progress_type === 'video_completed').length;

  // Score trend data (last 10 attempts)
  const scoreTrendData = attempts
    .slice(0, 10)
    .reverse()
    .map((attempt, idx) => ({
      attempt: `#${idx + 1}`,
      score: attempt.score || 0,
      passingScore: 60
    }));

  // Quiz performance data
  const quizPerformanceData = quizzes
    .filter(quiz => attempts.some(a => a.quiz_id === quiz.id))
    .map(quiz => {
      const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
      const avgScore = Math.round(quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.length);
      return {
        name: quiz.title.length > 20 ? quiz.title.substring(0, 20) + '...' : quiz.title,
        score: avgScore,
        attempts: quizAttempts.length
      };
    })
    .slice(0, 8);

  // Score distribution
  const scoreRanges = [
    { range: '0-39%', count: 0, fill: '#ef4444' },
    { range: '40-59%', count: 0, fill: '#f59e0b' },
    { range: '60-79%', count: 0, fill: '#3b82f6' },
    { range: '80-89%', count: 0, fill: '#10b981' },
    { range: '90-100%', count: 0, fill: '#8b5cf6' }
  ];

  attempts.forEach(attempt => {
    const score = attempt.score || 0;
    if (score < 40) scoreRanges[0].count++;
    else if (score < 60) scoreRanges[1].count++;
    else if (score < 80) scoreRanges[2].count++;
    else if (score < 90) scoreRanges[3].count++;
    else scoreRanges[4].count++;
  });

  // Performance radar data
  const radarData = [
    { subject: 'Quizzes', value: Math.min((totalQuizzesTaken / 10) * 100, 100), fullMark: 100 },
    { subject: 'Avg Score', value: averageScore, fullMark: 100 },
    { subject: 'Pass Rate', value: passRate, fullMark: 100 },
    { subject: 'Videos', value: Math.min((videosWatched / 20) * 100, 100), fullMark: 100 },
    { subject: 'Consistency', value: Math.min((attempts.length / 30) * 100, 100), fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Performance Analytics
          </h1>
          <p className="text-gray-600 text-lg">Track your progress and improve your performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-xl transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Quizzes Taken</p>
                  <p className="text-4xl font-bold">{totalQuizzesTaken}</p>
                </div>
                <Award className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-xl transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Average Score</p>
                  <p className="text-4xl font-bold">{averageScore}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-xl transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Pass Rate</p>
                  <p className="text-4xl font-bold">{passRate}%</p>
                </div>
                <Target className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-xl transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Videos Watched</p>
                  <p className="text-4xl font-bold">{videosWatched}</p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 3D Area Chart - Score Trend */}
          <Card className="shadow-xl border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Score Trend (Last 10 Attempts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={scoreTrendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#colorScore)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="passingScore" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="none" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3D Bar Chart - Quiz Performance */}
          <Card className="shadow-xl border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Quiz Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quizPerformanceData}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    fill="url(#colorBar)" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3D Radar Chart - Performance Metrics */}
          <Card className="shadow-xl border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                  <Radar 
                    name="Performance" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '2px solid #8b5cf6',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3D Pie Chart - Score Distribution */}
          <Card className="shadow-xl border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-orange-600" />
                Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={scoreRanges}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percent }) => percent > 0 ? `${range}: ${(percent * 100).toFixed(0)}%` : null}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                    animationDuration={1000}
                  >
                    {scoreRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '2px solid #f59e0b',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attempts Table */}
        <Card className="shadow-xl border-2 border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Recent Quiz Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">Quiz</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Score</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(0, 10).map((attempt, idx) => {
                    const quiz = quizzes.find(q => q.id === attempt.quiz_id);
                    const passed = attempt.score >= 60;
                    
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="p-3 text-gray-900">{quiz?.title || 'Unknown Quiz'}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            attempt.score >= 90 ? 'bg-purple-100 text-purple-700' :
                            attempt.score >= 80 ? 'bg-green-100 text-green-700' :
                            attempt.score >= 60 ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {attempt.score}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </td>
                        <td className="p-3 text-right text-gray-600 text-sm">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}