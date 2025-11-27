
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Course } from "@/api/entities";
import { Video } from "@/api/entities";
import { Quiz } from "@/api/entities";
import { Enrollment } from "@/api/entities";
import { 
  Users, 
  BookOpen, 
  PlayCircle, 
  FileText, 
  TrendingUp, 
  Shield,
  Calendar,
  BarChart3,
  RefreshCw,
  Zap
} from "lucide-react";
import { getUserRole } from "../components/utils/getUserRole";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalVideos: 0,
    totalQuizzes: 0,
    totalEnrollments: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (getUserRole(user) !== 'admin') {
        window.location.href = createPageUrl("LandingPage");
        return;
      }

      const [allUsers, courses, videos, quizzes, enrollments] = await Promise.all([
        base44.entities.User.list('-created_date'),
        Course.list(),
        Video.list(),
        Quiz.list(),
        Enrollment.list()
      ]);

      const students = allUsers.filter(u => {
        const role = getUserRole(u);
        return role === 'student' || !role;
      });
      const teachers = allUsers.filter(u => getUserRole(u) === 'teacher');

      setStats({
        totalUsers: allUsers.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalCourses: courses.length,
        totalVideos: videos.length,
        totalQuizzes: quizzes.length,
        totalEnrollments: enrollments.length
      });

      setRecentUsers(allUsers.slice(0, 10));
      setLastUpdate(new Date());

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      window.location.href = createPageUrl("LandingPage");
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"
        />
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-blue-500",
      iconColor: "text-white",
      link: createPageUrl("AdminUsers")
    },
    { 
      title: "Students", 
      value: stats.totalStudents, 
      icon: Users, 
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-500",
      iconColor: "text-white",
      link: createPageUrl("AdminUsers")
    },
    { 
      title: "Teachers", 
      value: stats.totalTeachers, 
      icon: Users, 
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-500",
      iconColor: "text-white",
      link: createPageUrl("AdminUsers")
    },
    { 
      title: "Courses", 
      value: stats.totalCourses, 
      icon: BookOpen, 
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      iconBg: "bg-orange-500",
      iconColor: "text-white",
      link: createPageUrl("AdminCourses")
    },
    { 
      title: "Videos", 
      value: stats.totalVideos, 
      icon: PlayCircle, 
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-500",
      iconColor: "text-white",
      link: createPageUrl("AdminVideos")
    },
    { 
      title: "Quizzes", 
      value: stats.totalQuizzes, 
      icon: FileText, 
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50",
      iconBg: "bg-teal-500",
      iconColor: "text-white",
      link: createPageUrl("AdminQuizzes")
    },
    { 
      title: "Enrollments", 
      value: stats.totalEnrollments, 
      icon: TrendingUp, 
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50",
      iconBg: "bg-violet-500",
      iconColor: "text-white",
      link: createPageUrl("AdminEnrollments")
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-3xl shadow-2xl text-white mb-8 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          <div className="relative p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Shield className="w-8 h-8" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold mb-1">
                    Admin Dashboard
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Welcome back, {currentUser?.full_name}
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-all shadow-lg"
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="w-5 h-5" />
                </motion.div>
                <span className="font-medium">Refresh</span>
              </motion.button>
            </div>
            
            <div className="flex items-center gap-4 text-blue-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-green-400 rounded-full"
                />
                <span className="text-sm">
                  Live • Updated {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatePresence>
            {statCards.map((stat, index) => (
              <Link key={stat.title} to={stat.link}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                          {stat.title}
                        </p>
                        <motion.p
                          key={stat.value}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-14 h-14 ${stat.iconBg} rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}
                      >
                        <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                      </motion.div>
                    </div>
                    
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
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
          </AnimatePresence>
        </div>

        {/* Recent Users Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Recent Users
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Live Updates</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-teal-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md"
                      >
                        <span className="text-lg font-bold text-white">
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-gray-900">{user.full_name || 'Unnamed User'}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg capitalize shadow-sm">
                        {getUserRole(user) || 'student'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No users found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
