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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, BookOpen, PlayCircle, FileText, PlusCircle, BarChart3, CheckCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AnnouncementsTab from '../components/course/AnnouncementsTab';
import { getUserRole } from '../components/utils/getUserRole';
import { base44 } from '@/api/base44Client';

export default function TeacherCourseDetail() {
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [courseModules, setCourseModules] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal states
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false);
  
  // Form states
  const [newVideo, setNewVideo] = useState({ title: '', description: '', video_url: '', duration_minutes: '', order_index: '' });
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', questions: [], time_limit_minutes: '', passing_score: '' });

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  const loadAnalytics = useCallback(async (courseId, enrollments, videos, quizzes) => {
    try {
      const totalStudents = enrollments.length;
      const completedStudents = enrollments.filter(e => e.progress_percentage >= 100).length;
      
      const progressData = await base44.entities.StudentProgress.filter({ course_id: courseId });
      const quizAttempts = await base44.entities.QuizAttempt.list();

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
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Verify user is a teacher
      if (getUserRole(user) !== 'teacher') {
        window.location.href = '/';
        return;
      }
      
      // Load course details and verify ownership
      const courseData = await base44.entities.Course.filter({ id: courseId });
      if (courseData[0] && courseData[0].instructor_id === user.id) {
        setCourse(courseData[0]);
      } else {
        // Redirect if not the instructor or course not found
        window.location.href = createPageUrl("TeacherCourses");
        return;
      }

      // Load enrollments and students
      const courseEnrollments = await base44.entities.Enrollment.filter({ course_id: courseId });
      setEnrollments(courseEnrollments);

      const studentIds = courseEnrollments.map(e => e.student_id);
      const enrolledStudents = [];
      
      for (const studentId of studentIds) {
        try {
          const student = await base44.entities.User.filter({ id: studentId });
          if (student[0]) {
            enrolledStudents.push(student[0]);
          }
        } catch (error) {
          console.warn(`Could not load student with ID ${studentId}:`, error);
          // Skip this student if they don't exist or there's an error
          continue;
        }
      }
      setStudents(enrolledStudents);

      // Load course content
      const modules = await base44.entities.Module.filter({ course_id: courseId }, 'order_index');
      setCourseModules(modules);

      const courseSections = await base44.entities.Section.filter({ course_id: courseId }, 'order_index');
      setSections(courseSections);

      const courseVideos = await base44.entities.Video.filter({ course_id: courseId }, 'order_index');
      const courseQuizzes = await base44.entities.Quiz.filter({ course_id: courseId });
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

  const handleAddVideo = async () => {
    try {
      await base44.entities.Video.create({
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
    }
  };

  const handleAddQuiz = async () => {
    try {
      await base44.entities.Quiz.create({
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
    }
  };

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
          <p className="text-gray-500">Course not found or access denied</p>
          <Link to={createPageUrl("TeacherCourses")} className="text-blue-600 hover:underline mt-2">
            Back to My Courses
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
            to={createPageUrl("TeacherCourses")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Courses
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600 mt-2">{course.description}</p>
            </div>
            <div className="flex space-x-3">
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
                <h2 className="text-xl font-bold text-gray-900">My Students</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length > 0 ? students.map((student) => {
                    const enrollment = enrollments.find(e => e.student_id === student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
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
                        <TableCell>{enrollment?.enrollment_date}</TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
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