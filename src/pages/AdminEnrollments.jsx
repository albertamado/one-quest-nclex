import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Course } from '@/api/entities';
import { Enrollment } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getUserRole } from '../components/utils/getUserRole';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Users, BookOpen, Calendar, Layers, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import LoadingScreen from '../components/shared/LoadingScreen';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      
      if (getUserRole(user) !== 'admin') {
        window.location.href = createPageUrl("LandingPage");
        return;
      }

      const [allEnrollments, allUsers, allCourses] = await Promise.all([
        Enrollment.list('-created_date'),
        User.list(),
        Course.list()
      ]);

      setEnrollments(allEnrollments);
      setCourses(allCourses);

      // Get only student users
      const studentUsers = allUsers.filter(u => getUserRole(u) === 'student');
      setStudents(studentUsers);

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const getStudent = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const getCourse = (courseId) => {
    return courses.find(c => c.id === courseId);
  };

  const getPhaseColor = (phase) => {
    const colors = {
      'phase1': 'bg-blue-100 text-blue-700',
      'phase2': 'bg-purple-100 text-purple-700',
      'phase3': 'bg-teal-100 text-teal-700'
    };
    return colors[phase] || 'bg-gray-100 text-gray-700';
  };

  const getPhaseName = (phase) => {
    const names = {
      'phase1': 'Phase 1',
      'phase2': 'Phase 2',
      'phase3': 'Phase 3'
    };
    return names[phase] || 'Not Assigned';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-700',
      'completed': 'bg-blue-100 text-blue-700',
      'dropped': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Combine enrollment data with student and course info
  const enrichedEnrollments = enrollments.map(enrollment => {
    const student = getStudent(enrollment.student_id);
    const course = getCourse(enrollment.course_id);
    return {
      ...enrollment,
      student,
      course
    };
  }).filter(e => e.student && e.course); // Filter out enrollments with missing data

  // Apply filters
  const filteredEnrollments = enrichedEnrollments.filter(enrollment => {
    const student = enrollment.student;
    const course = enrollment.course;

    // Search filter
    const matchesSearch = 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id_number?.includes(searchTerm);

    // Phase filter
    const matchesPhase = phaseFilter === 'all' || student.assigned_phase === phaseFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;

    // Course filter
    const matchesCourse = courseFilter === 'all' || enrollment.course_id === courseFilter;

    return matchesSearch && matchesPhase && matchesStatus && matchesCourse;
  });

  // Calculate statistics
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    dropped: enrollments.filter(e => e.status === 'dropped').length,
    phase1: enrichedEnrollments.filter(e => e.student?.assigned_phase === 'phase1').length,
    phase2: enrichedEnrollments.filter(e => e.student?.assigned_phase === 'phase2').length,
    phase3: enrichedEnrollments.filter(e => e.student?.assigned_phase === 'phase3').length,
  };

  if (loading) {
    return <LoadingScreen message="Loading enrollments..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={createPageUrl("AdminDashboard")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Student Enrollments
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              View and manage all student course enrollments
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Enrollments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-green-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-red-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Dropped</p>
                <p className="text-3xl font-bold text-gray-900">{stats.dropped}</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Enrollment by Phase</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.phase1}</p>
              <p className="text-sm text-gray-600">Phase 1 Students</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.phase2}</p>
              <p className="text-sm text-gray-600">Phase 2 Students</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{stats.phase3}</p>
              <p className="text-sm text-gray-600">Phase 3 Students</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="Search students or courses..."
                  className="pl-10 border-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Filter by Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  <SelectItem value="phase1">Phase 1</SelectItem>
                  <SelectItem value="phase2">Phase 2</SelectItem>
                  <SelectItem value="phase3">Phase 3</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>

              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Filter by Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-50 to-teal-50 border-b-2 border-blue-200">
                  <TableHead className="font-bold text-gray-900">Student</TableHead>
                  <TableHead className="font-bold text-gray-900">ID Number</TableHead>
                  <TableHead className="font-bold text-gray-900">Course</TableHead>
                  <TableHead className="font-bold text-gray-900">Phase</TableHead>
                  <TableHead className="font-bold text-gray-900">Status</TableHead>
                  <TableHead className="font-bold text-gray-900">Progress</TableHead>
                  <TableHead className="font-bold text-gray-900">Enrolled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length > 0 ? (
                  filteredEnrollments.map((enrollment) => {
                    const student = enrollment.student;
                    const course = enrollment.course;
                    const progress = enrollment.progress_percentage || 0;

                    return (
                      <TableRow key={enrollment.id} className="hover:bg-blue-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {student.profile_photo_url ? (
                              <img 
                                src={student.profile_photo_url} 
                                alt={student.full_name} 
                                className="w-10 h-10 rounded-full object-cover" 
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                                <span className="font-medium text-white">
                                  {student.full_name?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{student.full_name || 'Unnamed'}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.student_id_number || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{course.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.assigned_phase ? (
                            <Badge className={getPhaseColor(student.assigned_phase)}>
                              {getPhaseName(student.assigned_phase)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(enrollment.status)}>
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(enrollment.enrollment_date || enrollment.created_date), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                      No enrollments found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}