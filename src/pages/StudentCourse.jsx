
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Course } from "@/api/entities";
import { Video } from "@/api/entities";
import { Quiz } from "@/api/entities";
import { Module } from "@/api/entities";
import { Section } from "@/api/entities";
import { StudentProgress } from "@/api/entities";
import { Enrollment } from "@/api/entities";
import { PlayCircle, FileText, CheckCircle, Clock, ArrowLeft, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VideoPlayer from "../components/student/VideoPlayer";
import QuizTaker from "../components/student/QuizTaker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CommentsSection from "../components/course/CommentsSection";
import { Button } from "@/components/ui/button";
import LoadingScreen from "../components/shared/LoadingScreen";
import TicketWidget from '../components/student/TicketWidget';

export default function StudentCourse() {
  const [currentUser, setCurrentUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [sections, setSections] = useState([]);
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [activeContent, setActiveContent] = useState(null);
  const [contentType, setContentType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedVideos, setCompletedVideos] = useState(new Set());
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  const updateOverallProgress = useCallback(async (userId, courseId, videos, quizzes) => {
    const totalItems = videos.length + quizzes.length;
    if (totalItems === 0) return;

    const progressRecords = await StudentProgress.filter({
      student_id: userId,
      course_id: courseId
    });

    const completedVideoIds = new Set(progressRecords.filter(p => p.progress_type === 'video_completed').map(p => p.video_id));
    const completedQuizIds = new Set(progressRecords.filter(p => p.progress_type === 'quiz_completed').map(p => p.quiz_id));
    
    const completedItems = completedVideoIds.size + completedQuizIds.size;
    const progressPercentage = Math.round((completedItems / totalItems) * 100);

    const enrollments = await Enrollment.filter({ student_id: userId, course_id: courseId });
    if (enrollments.length > 0) {
      const enrollment = enrollments[0];
      if (enrollment.progress_percentage !== progressPercentage) {
        await Enrollment.update(enrollment.id, { progress_percentage: progressPercentage });
      }
    }
  }, []);

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);

      const enrollment = await Enrollment.filter({ 
        student_id: user.id, 
        course_id: courseId 
      });

      if (enrollment.length === 0) {
        setIsEnrolled(false);
        setLoading(false);
        return;
      }

      setIsEnrolled(true);

      const courseData = await Course.filter({ id: courseId });
      if (courseData[0]) {
        const fetchedCourse = courseData[0];
        
        // Check if student's phase matches course phase
        if (user.assigned_phase && fetchedCourse.phase && user.assigned_phase !== fetchedCourse.phase) {
          setIsEnrolled(false);
          setCourse(fetchedCourse); 
          setLoading(false);
          return;
        }
        
        setCourse(fetchedCourse);
      } else {
        setCourse(null);
        setLoading(false);
        return;
      }

      const [courseModules, courseSections, allVideos, courseQuizzes, progress] = await Promise.all([
        Module.filter({ course_id: courseId }), // Filter by course_id, then sort below
        Section.list(), // Fetch all sections, then filter below
        Video.filter({ course_id: courseId }), // Filter by course_id, then sort below
        Quiz.filter({ course_id: courseId }),
        StudentProgress.filter({ student_id: user.id, course_id: courseId })
      ]);

      // Sort modules by order_index
      const sortedModules = courseModules.sort((a, b) => {
        const orderA = a.order_index || 0;
        const orderB = b.order_index || 0;
        return orderA - orderB;
      });

      // Sort videos by order_index
      const sortedVideos = allVideos.sort((a, b) => {
        const orderA = a.order_index || 0;
        const orderB = b.order_index || 0;
        return orderA - orderB;
      });

      setModules(sortedModules);
      setSections(courseSections);
      setVideos(sortedVideos);
      setQuizzes(courseQuizzes);
      setStudentProgress(progress);
      
      const completedVideoIds = new Set(
        progress
          .filter(p => p.progress_type === 'video_completed' && p.video_id)
          .map(p => p.video_id)
      );
      setCompletedVideos(completedVideoIds);

      if (sortedModules.length > 0) {
        const firstModule = sortedModules[0];
        const firstModuleSections = courseSections.filter(s => s.module_id === firstModule.id);
        
        let firstVideo = null;
        if (firstModuleSections.length > 0) {
          const firstSection = firstModuleSections.find(s => s.module_id === firstModule.id); // Find the first section within the module
          if (firstSection) {
            const firstSectionVideos = sortedVideos.filter(v => v.section_id === firstSection.id);
            
            if (firstSectionVideos.length > 0) {
              firstVideo = firstSectionVideos[0];
            }
          }
        }
        
        if (!firstVideo) {
          const firstModuleVideos = sortedVideos.filter(v => v.module_id === firstModule.id && !v.section_id);
          if (firstModuleVideos.length > 0) {
            firstVideo = firstModuleVideos[0];
          }
        }

        if (firstVideo) {
          setActiveContent(firstVideo);
          setContentType('video');
          setExpandedModules(new Set([firstModule.id]));
        }
      }
      
      await updateOverallProgress(user.id, courseId, sortedVideos, courseQuizzes);

    } catch (error) {
      console.error("Error loading course data:", error);
      setCurrentUser(null);
      setCourse(null);
    }
    setLoading(false);
  }, [courseId, updateOverallProgress]);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, loadCourseData]);

  const isContentCompleted = (contentId, type) => {
    return studentProgress.some(p => 
      p[`${type}_id`] === contentId && 
      p.progress_type === `${type}_completed`
    );
  };

  const canAccessQuiz = (quiz) => {
    if (!quiz.requires_video_completion) {
      return { canAccess: true, missingVideos: [] };
    }
    
    const prerequisiteVideoIds = quiz.prerequisite_video_ids || [];
    const missingVideos = videos.filter(video => 
      prerequisiteVideoIds.includes(video.id) && !completedVideos.has(video.id)
    );
    
    return {
      canAccess: missingVideos.length === 0,
      missingVideos
    };
  };

  // Check if a video can be accessed (locked/unlocked)
  const canAccessVideo = (video, allModuleVideos) => {
    // If it's the very first video in the entire course or the very first video in a module, it's accessible.
    // This assumes `allModuleVideos` is sorted and the first element is the earliest.
    const courseHasVideos = videos.length > 0;
    const isFirstVideoInCourse = courseHasVideos && videos[0].id === video.id;
    const isFirstVideoInModule = allModuleVideos.length > 0 && allModuleVideos[0].id === video.id;

    if (isFirstVideoInCourse || isFirstVideoInModule) {
      return true;
    }
    
    // Get all videos *before* this one in the module's sorted list
    const videoIndex = allModuleVideos.findIndex(v => v.id === video.id);
    if (videoIndex === -1) return false; // Should not happen

    const previousVideosInModule = allModuleVideos.slice(0, videoIndex);
    
    // If there are no previous videos, it's accessible (covered by first video check, but good for robustness)
    if (previousVideosInModule.length === 0) return true;

    // Check if all previous videos in the module are completed
    return previousVideosInModule.every(v => completedVideos.has(v.id));
  };

  const handleContentSelect = (content, type, isLocked = false) => {
    if (isLocked) return; // Don't allow selection of locked videos
    
    if (type === 'video') {
      setActiveContent(content);
      setContentType(type);
      setTimeout(() => {
        const videoElement = document.getElementById('video-player-section');
        if (videoElement) {
          videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.clear();
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const getModuleProgress = (moduleId) => {
    const moduleSections = sections.filter(s => s.module_id === moduleId);
    const moduleVideos = videos.filter(v => {
      if (v.section_id) {
        return moduleSections.some(s => s.id === v.section_id);
      }
      return v.module_id === moduleId;
    });
    const moduleQuizzes = quizzes.filter(q => q.module_id === moduleId);
    const totalItems = moduleVideos.length + moduleQuizzes.length;
    
    if (totalItems === 0) return 0;
    
    const completedVideosCount = moduleVideos.filter(v => isContentCompleted(v.id, 'video')).length;
    const completedQuizzesCount = moduleQuizzes.filter(q => isContentCompleted(q.id, 'quiz')).length;
    
    return Math.round(((completedVideosCount + completedQuizzesCount) / totalItems) * 100);
  };

  if (loading) {
    return <LoadingScreen message="Loading course..." />;
  }

  if (!isEnrolled) {
    const isPhaseRestricted = currentUser?.assigned_phase && course?.phase && currentUser.assigned_phase !== course.phase;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6 text-justify">
            {isPhaseRestricted 
              ? `This course belongs to ${course.phase.replace('phase', 'Phase ')}, but you are currently assigned to ${currentUser.assigned_phase.replace('phase', 'Phase ')}. Please contact your instructor if you need access.`
              : 'You are not enrolled in this course. Please contact your instructor to get enrolled.'
            }
          </p>
          <Link to={createPageUrl("StudentCourses")} className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Course not found or user not authenticated.</p>
          <Link to={createPageUrl("StudentCourses")} className="text-blue-600 hover:underline mt-2">
            Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            to={createPageUrl("StudentCourses")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium transition-all duration-200 hover:gap-3 gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to My Courses
          </Link>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2 break-words">{course.title}</h1>
            <p className="text-lg text-gray-600 break-words text-justify">{course.description}</p>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit mb-6 bg-white shadow-md">
            <TabsTrigger value="content" className="text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <PlayCircle className="w-5 h-5 mr-2" />
              Course Content
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <FileText className="w-5 h-5 mr-2" />
              Quizzes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6">
              {/* Course Content Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 overflow-hidden h-[calc(100vh-280px)]">
                  <div className="p-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white sticky top-0 z-10">
                    <h2 className="font-bold text-xl">Course Content</h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200 overflow-y-auto h-[calc(100%-80px)]">
                    {modules.map((module) => {
                      const moduleSections = sections.filter(s => s.module_id === module.id);
                      
                      // Combine videos from sections and direct module videos, then sort by order_index
                      const allModuleVideos = videos.filter(v => {
                        if (v.section_id) {
                          return moduleSections.some(s => s.id === v.section_id);
                        }
                        return v.module_id === module.id;
                      }).sort((a, b) => a.order_index - b.order_index);
                      
                      const moduleProgress = getModuleProgress(module.id);
                      const isModuleExpanded = expandedModules.has(module.id);

                      return (
                        <div key={module.id} className="transition-colors duration-200">
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full p-5 text-left hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 mb-2 uppercase break-words">
                                  {module.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                    <div 
                                      className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500"
                                      style={{ width: `${moduleProgress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-bold text-green-600 whitespace-nowrap">{moduleProgress}%</span>
                                </div>
                              </div>
                              {isModuleExpanded ? (
                                <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                          </button>

                          {isModuleExpanded && (
                            <div className="bg-gradient-to-b from-gray-50 to-white">
                              {allModuleVideos.map((video) => {
                                const isLocked = !canAccessVideo(video, allModuleVideos);
                                const isActive = activeContent?.id === video.id;
                                const isCompleted = completedVideos.has(video.id);
                                
                                return (
                                  <button
                                    key={video.id}
                                    onClick={() => handleContentSelect(video, 'video', isLocked)}
                                    disabled={isLocked}
                                    className={`w-full text-left py-4 px-6 pl-10 transition-all duration-200 flex items-center gap-3 border-l-4 ${
                                      isActive
                                        ? 'bg-blue-50 border-l-blue-600'
                                        : 'border-l-transparent hover:bg-blue-50 hover:border-l-blue-300'
                                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {isLocked ? (
                                      <Lock className="w-5 h-5 flex-shrink-0 text-gray-400" />
                                    ) : (
                                      <PlayCircle className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    )}
                                    <span className={`text-sm flex-1 min-w-0 break-words ${isActive ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                      {video.title}
                                    </span>
                                    {isCompleted && !isLocked && (
                                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Video Player Section */}
              <div className="lg:col-span-1" id="video-player-section">
                {activeContent && contentType === 'video' ? (
                  <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100 h-[calc(100vh-280px)] overflow-y-auto">
                    <VideoPlayer 
                      video={activeContent} 
                      student={currentUser}
                      courseId={courseId}
                      onProgress={loadCourseData}
                    />
                    <div className="p-6 border-t-2 border-gray-200"> 
                      <CommentsSection 
                        contentId={activeContent.id} 
                        contentType="video"
                        currentUser={currentUser}
                        courseId={courseId}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl border-2 border-blue-100 p-16 text-center h-[calc(100vh-280px)] flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">Select a Video to Begin</h3>
                    <p className="text-gray-600 text-xl">Choose a lesson from the course modules to start learning</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Course Quizzes</h2>
              
              {quizzes.length > 0 ? (
                <div className="grid gap-6">
                  {quizzes.map((quiz) => {
                    const { canAccess, missingVideos } = canAccessQuiz(quiz);
                    const completed = isContentCompleted(quiz.id, 'quiz');
                    
                    return (
                      <div 
                        key={quiz.id}
                        className="border-2 rounded-xl p-6 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {completed ? (
                                <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0" />
                              ) : (
                                <FileText className={`w-7 h-7 flex-shrink-0 ${canAccess ? 'text-blue-600' : 'text-gray-400'}`} />
                              )}
                              <div className="flex items-center justify-between flex-1 gap-3">
                                <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                                {!canAccess && (
                                  <Lock className="w-6 h-6 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            
                            {quiz.description && (
                              <p className="text-gray-600 mb-4 ml-10 text-justify">{quiz.description}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 ml-10">
                              <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {quiz.questions?.length || 0} questions
                              </span>
                              {quiz.time_limit_minutes && (
                                <span className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {quiz.time_limit_minutes} minutes
                                </span>
                              )}
                            </div>

                            {!canAccess && missingVideos.length > 0 && (
                              <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg ml-10">
                                <p className="text-sm text-amber-900 font-semibold mb-2 flex items-center gap-2">
                                  <Lock className="w-4 h-4" />
                                  Complete these videos first:
                                </p>
                                <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                                  {missingVideos.map(v => (
                                    <li key={v.id}>{v.title}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {completed && (
                              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg ml-10">
                                <p className="text-sm text-green-900 font-semibold">
                                  <CheckCircle className="w-4 h-4 inline mr-2" />
                                  Quiz Completed
                                </p>
                              </div>
                            )}

                            <Button
                              onClick={() => {
                                if (canAccess) {
                                  setSelectedQuiz(quiz);
                                  setIsQuizModalOpen(true);
                                }
                              }}
                              disabled={!canAccess}
                              className={`ml-10 ${canAccess ? 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-lg hover:shadow-xl' : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                              {!canAccess && <Lock className="w-4 h-4 mr-2" />}
                              {completed ? 'Review Quiz' : 'Take Quiz'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Quizzes Available</h3>
                  <p className="text-gray-600">Quizzes will appear here as they become available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quiz Modal */}
      {isQuizModalOpen && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h2>
              <button
                onClick={() => {
                  setIsQuizModalOpen(false);
                  setSelectedQuiz(null);
                  loadCourseData();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <QuizTaker 
              quiz={selectedQuiz} 
              student={currentUser}
              onComplete={async () => {
                await loadCourseData();
                setIsQuizModalOpen(false);
                setSelectedQuiz(null);
              }}
              canTakeQuiz={canAccessQuiz(selectedQuiz).canAccess}
              missingVideos={canAccessQuiz(selectedQuiz).missingVideos}
              accessInfo={canAccessQuiz(selectedQuiz)}
            />
          </div>
        </div>
      )}
      
      {/* Add Ticket Widget */}
      {currentUser && <TicketWidget currentUser={currentUser} />}
    </div>
  );
}
