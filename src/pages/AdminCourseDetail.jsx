
import React, { useState, useEffect, useCallback } from 'react';
import { Course } from '@/api/entities';
import { User } from '@/api/entities';
import { Enrollment } from '@/api/entities';
import { Video } from '@/api/entities';
import { Quiz } from '@/api/entities';
import { StudentProgress } from '@/api/entities';
import { QuizAttempt } from '@/api/entities';
import { Module } from '@/api/entities';
import { Section } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Users, BookOpen, PlayCircle, FileText, PlusCircle, BarChart3, CheckCircle, X, MessageSquare, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AnnouncementsTab from '../components/course/AnnouncementsTab';
import { getUserRole } from '../components/utils/getUserRole';

export default function AdminCourseDetail() {
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [sections, setSections] = useState([]);

  // Modal states
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  
  // Form states
  const [newVideo, setNewVideo] = useState({ title: '', description: '', video_url: '', duration_minutes: '', order_index: '' });
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', questions: [], time_limit_minutes: '', passing_score: '' });

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  const loadAnalytics = useCallback(async (courseId, enrollments, videos, quizzes) => {
    try {
      const totalStudents = enrollments.length;
      const completedStudents = enrollments.filter(e => e.progress_percentage >= 100).length;
      
      // Get progress data
      const progressData = await StudentProgress.filter({ course_id: courseId });
      const quizAttempts = await QuizAttempt.list();
      
      // Video completion stats
      const videoCompletions = {};
      videos.forEach(video => {
        const completions = progressData.filter(p => 
          p.video_id === video.id && p.progress_type === 'video_completed'
        );
        videoCompletions[video.id] = completions.length;
      });

      // Quiz completion stats
      const quizCompletions = {};
      quizzes.forEach(quiz => {
        const attempts = quizAttempts.filter(a => a.quiz_id === quiz.id && a.status === 'completed');
        const uniqueStudents = new Set(attempts.map(a => a.student_id));
        quizCompletions[quiz.id] = uniqueStudents.size;
      });

      setAnalytics({
        totalStudents,
        completedStudents,
        completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
        videoCompletions,
        quizCompletions
      });

    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }, []);

  const loadCourseData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Verify user is an admin
      if (getUserRole(user) !== 'admin') {
        window.location.href = '/';
        return;
      }
      
      // Load course details
      const courseData = await Course.filter({ id: courseId });
      if (courseData[0]) {
        setCourse(courseData[0]);
      } else {
        console.error("Course not found");
        setLoading(false);
        return;
      }

      // Load enrollments
      const courseEnrollments = await Enrollment.filter({ course_id: courseId });
      setEnrollments(courseEnrollments);

      // Load ALL users first, then match to enrollments
      let allUsersData = [];
      try {
        allUsersData = await User.list();
        setAllUsers(allUsersData.filter(u => u && u.id && getUserRole(u) === 'student'));
      } catch (error) {
        console.error("Error loading all users:", error);
        setAllUsers([]);
      }

      // Match enrolled students from the list of all users
      const studentIds = [...new Set(courseEnrollments.map(e => e.student_id).filter(Boolean))];
      const enrolledStudents = studentIds
        .map(studentId => allUsersData.find(u => u.id === studentId))
        .filter(Boolean); // Remove undefined entries
      
      setStudents(enrolledStudents);

      // Clean up orphaned enrollments (students that no longer exist)
      const orphanedEnrollments = courseEnrollments.filter(e => 
        e.student_id && !allUsersData.some(u => u.id === e.student_id)
      );
      
      for (const orphaned of orphanedEnrollments) {
        try {
          await Enrollment.delete(orphaned.id);
          console.log(`Cleaned up orphaned enrollment for deleted user ${orphaned.student_id}`);
        } catch (deleteError) {
          console.warn(`Could not clean up enrollment:`, deleteError);
        }
      }

      // Load course content (Modules, Sections, Videos, Quizzes)
      const modules = await Module.filter({ course_id: courseId }, 'order_index');
      setCourseModules(modules);

      const courseSections = await Section.filter({ course_id: courseId }, 'order_index');
      setSections(courseSections);

      const courseVideos = await Video.filter({ course_id: courseId }, 'order_index');
      const courseQuizzes = await Quiz.filter({ course_id: courseId });
      setVideos(courseVideos);
      setQuizzes(courseQuizzes);

      // Load analytics
      await loadAnalytics(courseId, courseEnrollments, courseVideos, courseQuizzes);

    } catch (error) {
      console.error("Error loading course data:", error);
    }
    setLoading(false);
  }, [courseId, loadAnalytics]);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, loadCourseData]);

  const handleAddStudent = async () => {
    if (!selectedUser) return;
    try {
      // Check if already enrolled
      const existingEnrollment = await Enrollment.filter({ 
        student_id: selectedUser, 
        course_id: courseId 
      });
      
      if (existingEnrollment.length === 0) {
        await Enrollment.create({
          student_id: selectedUser,
          course_id: courseId,
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'active',
          progress_percentage: 0
        });
        await loadCourseData();
      }
      
      setIsAddStudentModalOpen(false);
      setSelectedUser('');
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again.");
    }
  };

  const handleAddVideo = async () => {
    try {
      await Video.create({
        ...newVideo,
        course_id: courseId,
        duration_minutes: Number(newVideo.duration_minutes),
        order_index: Number(newVideo.order_index)
      });
      
      setNewVideo({ title: '', description: '', video_url: '', duration_minutes: '', order_index: '' });
      setIsAddVideoModalOpen(false);
      await loadCourseData();
    } catch (error) {
      console.error("Error adding video:", error);
      alert("Failed to add video. Please try again.");
    }
  };

  const handleAddQuiz = async () => {
    try {
      await Quiz.create({
        ...newQuiz,
        course_id: courseId,
        time_limit_minutes: Number(newQuiz.time_limit_minutes),
        passing_score: Number(newQuiz.passing_score)
      });
      
      setNewQuiz({ title: '', description: '', questions: [], time_limit_minutes: '', passing_score: '' });
      setIsAddQuizModalOpen(false);
      await loadCourseData();
    } catch (error) {
      console.error("Error adding quiz:", error);
      alert("Failed to add quiz. Please try again.");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm("Are you sure you want to remove this student from the course? This action cannot be undone.")) {
      return;
    }
    
    try {
      const enrollment = enrollments.find(e => e.student_id === studentId);
      if (enrollment) {
        await Enrollment.delete(enrollment.id);
        await loadCourseData();
      }
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Failed to remove student. Please try again.");
    }
  };

  const availableStudents = allUsers.filter(user => !students.some(s => s.id === user.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Course not found or user not authenticated.</p>
          <Link to={createPageUrl("AdminCourses")} className="text-blue-600 hover:underline mt-2">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={createPageUrl("AdminCourses")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600 mt-2 text-justify">{course.description}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setIsAddStudentModalOpen(true)}>
                <Users className="w-4 h-4 mr-2" />
                Add Student
              </Button>
              <Button onClick={() => setIsAddVideoModalOpen(true)}>
                <PlayCircle className="w-4 h-4 mr-2" />
                Add Video
              </Button>
              <Button onClick={() => setIsAddQuizModalOpen(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Add Quiz
              </Button>
            </div>
          </div>
        </div>

        {/* Course Modules Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Modules</h2>
          {courseModules.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {courseModules
                .sort((a, b) => a.order_index - b.order_index)
                .map((module) => {
                  const moduleSections = sections
                    .filter(s => s.module_id === module.id)
                    .sort((a, b) => a.order_index - b.order_index);

                  const moduleVideos = videos.filter(v =>
                    v.module_id === module.id || moduleSections.some(s => s.id === v.section_id)
                  );
                  const moduleQuizzes = quizzes.filter(q =>
                    q.module_id === module.id || moduleSections.some(s => s.id === q.section_id)
                  );

                  return (
                    <AccordionItem key={module.id} value={`module-${module.id}`} className="border-b border-gray-200 last:border-b-0">
                      <AccordionTrigger className="flex justify-between items-center py-4 px-6 hover:bg-gray-50 transition-colors data-[state=open]:bg-gray-50 rounded-t-xl data-[state=closed]:rounded-xl">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                            {module.description && (
                              <p className="text-sm text-gray-600 line-clamp-1">{module.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 flex-shrink-0 ml-auto pl-4">
                          {module.duration_weeks && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {module.duration_weeks} Wk
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <PlayCircle className="w-4 h-4" /> {moduleVideos.length} Vids
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" /> {moduleQuizzes.length} Quizzes
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                        {moduleSections.length > 0 ? (
                          <div className="space-y-6">
                            {moduleSections.map((section) => (
                              <div key={section.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                <h4 className="font-semibold text-gray-800 mb-2">{section.title}</h4>
                                {section.description && (
                                  <p className="text-sm text-gray-600 mb-4 text-justify">{section.description}</p>
                                )}

                                {/* Videos for this section */}
                                <div className="space-y-2">
                                  {videos
                                    .filter(v => v.section_id === section.id)
                                    .sort((a, b) => a.order_index - b.order_index)
                                    .map((video) => (
                                      <div key={video.id} className="flex items-center gap-2 text-sm text-gray-700 p-2 rounded-md hover:bg-gray-100">
                                        <PlayCircle className="w-4 h-4 text-blue-500" />
                                        <span>{video.title} ({video.duration_minutes} min)</span>
                                        <span className="ml-auto text-gray-500">Order: {video.order_index}</span>
                                      </div>
                                    ))}
                                </div>

                                {/* Quizzes for this section */}
                                <div className="space-y-2 mt-2">
                                  {quizzes
                                    .filter(q => q.section_id === section.id)
                                    .map((quiz) => (
                                      <div key={quiz.id} className="flex items-center gap-2 text-sm text-gray-700 p-2 rounded-md hover:bg-gray-100">
                                        <FileText className="w-4 h-4 text-green-500" />
                                        <span>{quiz.title} (Quiz)</span>
                                        <span className="ml-auto text-gray-500">Passing: {quiz.passing_score}%</span>
                                      </div>
                                    ))}
                                </div>

                                {(videos.filter(v => v.section_id === section.id).length === 0 &&
                                  quizzes.filter(q => q.section_id === section.id).length === 0) && (
                                  <p className="text-sm text-gray-500 text-center py-2">No content in this section yet.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">No sections or content in this module yet.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No modules in this course yet. You can add them from the Modules Management page.</p>
              <Link to={createPageUrl("AdminModules")}>
                <Button className="mt-4">Go to Modules Management</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalStudents || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.completedStudents || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.completionRate || 0}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Content Items</p>
                <p className="text-3xl font-bold text-gray-900">{videos.length + quizzes.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="announcements">
                <MessageSquare className="w-4 h-4 mr-2" />
                Announcements
            </TabsTrigger>
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {/* Announcements Tab */}
          <TabsContent value="announcements">
              <AnnouncementsTab course={course} currentUser={currentUser} />
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Enrolled Students</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length > 0 ? students.map((student) => {
                    const enrollment = enrollments.find(e => e.student_id === student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name || 'N/A'}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${enrollment?.progress_percentage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{enrollment?.progress_percentage || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment?.enrollment_date || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveStudent(student.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No students enrolled yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Course Videos</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.length > 0 ? videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">{video.title}</TableCell>
                      <TableCell>{video.duration_minutes} min</TableCell>
                      <TableCell>{video.order_index}</TableCell>
                      <TableCell>{analytics.videoCompletions?.[video.id] || 0} views</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No videos added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Course Quizzes</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Time Limit</TableHead>
                    <TableHead>Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.length > 0 ? quizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell className="font-medium">{quiz.title}</TableCell>
                      <TableCell>{quiz.questions?.length || 0}</TableCell>
                      <TableCell>{quiz.time_limit_minutes} min</TableCell>
                      <TableCell>{analytics.quizCompletions?.[quiz.id] || 0} attempts</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No quizzes added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4">Video Completion Rates</h3>
                {videos.length > 0 ? (
                  <div className="space-y-3">
                    {videos.map((video) => {
                      const completions = analytics.videoCompletions?.[video.id] || 0;
                      const rate = analytics.totalStudents > 0 ? Math.round((completions / analytics.totalStudents) * 100) : 0;
                      return (
                        <div key={video.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{video.title}</span>
                            <span>{rate}% ({completions}/{analytics.totalStudents})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${rate}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No videos to analyze</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4">Quiz Completion Rates</h3>
                {quizzes.length > 0 ? (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => {
                      const completions = analytics.quizCompletions?.[quiz.id] || 0;
                      const rate = analytics.totalStudents > 0 ? Math.round((completions / analytics.totalStudents) * 100) : 0;
                      return (
                        <div key={quiz.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{quiz.title}</span>
                            <span>{rate}% ({completions}/{analytics.totalStudents})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${rate}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No quizzes to analyze</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Student Modal */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Course</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {availableStudents.length > 0 ? (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                      {user.student_id_number && ` - ID: ${user.student_id_number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-gray-500 text-center py-4">
                All students are already enrolled in this course.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStudentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} disabled={!selectedUser || availableStudents.length === 0}>
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Video Modal */}
      <Dialog open={isAddVideoModalOpen} onOpenChange={setIsAddVideoModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Video</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Video Title"
              value={newVideo.title}
              onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
            />
            <Textarea
              placeholder="Description"
              value={newVideo.description}
              onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
            />
            <Input
              placeholder="Video URL"
              value={newVideo.video_url}
              onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Duration (minutes)"
              value={newVideo.duration_minutes}
              onChange={(e) => setNewVideo({...newVideo, duration_minutes: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Order Index"
              value={newVideo.order_index}
              onChange={(e) => setNewVideo({...newVideo, order_index: e.target.value})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVideoModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVideo}>Add Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Quiz Modal */}
      <Dialog open={isAddQuizModalOpen} onOpenChange={setIsAddQuizModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Quiz</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Quiz Title"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
            />
            <Textarea
              placeholder="Description"
              value={newQuiz.description}
              onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Time Limit (minutes)"
              value={newQuiz.time_limit_minutes}
              onChange={(e) => setNewQuiz({...newQuiz, time_limit_minutes: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Passing Score (%)"
              value={newQuiz.passing_score}
              onChange={(e) => setNewQuiz({...newQuiz, passing_score: e.target.value})}
            />
            <p className="text-sm text-gray-500">
              Note: Questions can be added after creating the quiz.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddQuizModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddQuiz}>Add Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
