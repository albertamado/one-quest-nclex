import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Course } from '@/api/entities';
import { Enrollment } from '@/api/entities';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Users, BookOpen, TrendingUp, BarChart3 } from 'lucide-react';
import { subDays, format } from 'date-fns';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0 });
  const [userGrowth, setUserGrowth] = useState([]);
  const [coursePopularity, setCoursePopularity] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [allUsers, allCourses, allEnrollments] = await Promise.all([
        User.list(),
        Course.list(),
        Enrollment.list(),
      ]);

      // Basic Stats
      setStats({
        totalUsers: allUsers.length,
        totalCourses: allCourses.length,
        totalEnrollments: allEnrollments.length,
      });

      // User Growth (last 30 days) - Mocked for now
      const growthData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return {
          date: format(date, 'MMM d'),
          users: Math.floor(Math.random() * 10) + i * 2, // Mocked data
        };
      });
      setUserGrowth(growthData);

      // Course Popularity
      const popularityData = allCourses.map(course => {
        const enrollments = allEnrollments.filter(e => e.course_id === course.id).length;
        return { name: course.title, students: enrollments };
      }).sort((a, b) => b.students - a.students).slice(0, 5);
      setCoursePopularity(popularityData);

      // Role Distribution
      const roles = allUsers.reduce((acc, user) => {
        const role = user.role || 'student';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      setRoleDistribution([
        { name: 'Students', value: roles.student || 0 },
        { name: 'Teachers', value: roles.teacher || 0 },
        { name: 'Admins', value: roles.admin || 0 },
      ]);

    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setLoading(false);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading analytics...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Analytics</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={Users} title="Total Users" value={stats.totalUsers} color="blue" />
          <StatCard icon={BookOpen} title="Total Courses" value={stats.totalCourses} color="orange" />
          <StatCard icon={TrendingUp} title="Total Enrollments" value={stats.totalEnrollments} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Growth Chart */}
          <ChartContainer title="User Registrations (Last 30 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Course Popularity Chart */}
          <ChartContainer title="Top 5 Most Popular Courses">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePopularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Role Distribution Chart */}
          <ChartContainer title="User Role Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const ChartContainer = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
    {children}
  </div>
);