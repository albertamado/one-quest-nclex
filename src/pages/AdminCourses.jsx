
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserRole } from '../components/utils/getUserRole';
import { BookOpen, Users, PlusCircle, Edit, Trash2, MoreVertical, PlayCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const initialCourseForm = {
  title: '',
  description: '',
  instructor_id: '',
  category: 'nclex-rn',
  phase: 'phase1',
  duration_weeks: 4,
  order_index: 0,
  difficulty_level: 'BEGINNER',
  is_active: true,
  cover_photo_url: ''
};

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courseStats, setCourseStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState(new Set(['phase1', 'phase2', 'phase3']));
  const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);

      if (userRole !== 'admin') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const [allCourses, allUsers, allVideos, allEnrollments] = await Promise.all([
        base44.entities.Course.list('order_index'),
        base44.entities.User.list(),
        base44.entities.Video.list(),
        base44.entities.Enrollment.list()
      ]);

      // Sort courses by order_index
      const sortedCourses = allCourses.sort((a, b) => {
        const orderA = a.order_index || 0;
        const orderB = b.order_index || 0;
        return orderA - orderB;
      });

      setCourses(sortedCourses);

      const teacherUsers = allUsers.filter(u => getUserRole(u) === 'teacher');
      setTeachers(teacherUsers);

      const studentUsers = allUsers.filter(u => getUserRole(u) === 'student');
      setAllStudents(studentUsers);

      const stats = {};
      allCourses.forEach(course => {
        const videoCount = allVideos.filter(v => v.course_id === course.id).length;
        const enrollmentCount = allEnrollments.filter(e => e.course_id === course.id).length;
        stats[course.id] = { videos: videoCount, students: enrollmentCount };
      });
      setCourseStats(stats);

    } catch (error) {
      console.error("Error loading data:", error);
      setAccessDenied(true);
    }
    setLoading(false);
  };

  const openModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title || '',
        description: course.description || '',
        instructor_id: course.instructor_id || '',
        category: course.category || 'nclex-rn',
        phase: course.phase || 'phase1',
        duration_weeks: course.duration_weeks || 4,
        order_index: course.order_index || 0,
        difficulty_level: course.difficulty_level || 'BEGINNER',
        is_active: course.is_active !== false,
        cover_photo_url: course.cover_photo_url || ''
      });
    } else {
      setEditingCourse(null);
      setCourseForm(initialCourseForm);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCourse) {
        await base44.entities.Course.update(editingCourse.id, courseForm);
      } else {
        await base44.entities.Course.create(courseForm);
      }
      await loadData();
      setIsModalOpen(false);
      setCourseForm(initialCourseForm);
      setEditingCourse(null);
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Failed to save course");
    }
  };

  const openDeleteModal = (course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      // First verify the course still exists
      try {
        const courseCheck = await base44.entities.Course.filter({ id: courseToDelete.id });
        if (!courseCheck || courseCheck.length === 0) {
          console.warn('Course already deleted');
          await loadData();
          setIsDeleteModalOpen(false);
          setCourseToDelete(null);
          return;
        }
      } catch (error) {
        console.warn('Course not found, may have been already deleted:', error);
        await loadData();
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
        return;
      }

      // Delete all modules and sections associated with this course
      try {
        const courseModules = await base44.entities.Module.filter({ course_id: courseToDelete.id });
        
        for (const module of courseModules) {
          // Delete all sections in this module
          try {
            const moduleSections = await base44.entities.Section.filter({ module_id: module.id });
            for (const section of moduleSections) {
              try {
                // Delete videos in this section
                const sectionVideos = await base44.entities.Video.filter({ section_id: section.id });
                for (const video of sectionVideos) {
                  try {
                    await base44.entities.Video.delete(video.id);
                  } catch (err) {
                    console.warn(`Video ${video.id} already deleted`);
                  }
                }
                
                // Delete quizzes in this section
                const sectionQuizzes = await base44.entities.Quiz.filter({ section_id: section.id });
                for (const quiz of sectionQuizzes) {
                  try {
                    await base44.entities.Quiz.delete(quiz.id);
                  } catch (err) {
                    console.warn(`Quiz ${quiz.id} already deleted`);
                  }
                }
                
                // Delete materials in this section
                const sectionMaterials = await base44.entities.LearningMaterial.filter({ section_id: section.id });
                for (const material of sectionMaterials) {
                  try {
                    await base44.entities.LearningMaterial.delete(material.id);
                  } catch (err) {
                    console.warn(`Material ${material.id} already deleted`);
                  }
                }
                
                // Delete the section
                await base44.entities.Section.delete(section.id);
              } catch (error) {
                console.warn(`Could not delete section ${section.id}:`, error);
              }
            }
          } catch (error) {
            console.warn(`Could not load sections for module ${module.id}:`, error);
          }
          
          // Delete videos directly under this module
          try {
            const moduleVideos = await base44.entities.Video.filter({ module_id: module.id });
            for (const video of moduleVideos) {
              try {
                await base44.entities.Video.delete(video.id);
              } catch (err) {
                console.warn(`Video ${video.id} already deleted`);
              }
            }
          } catch (error) {
            console.warn(`Could not delete videos for module ${module.id}:`, error);
          }
          
          // Delete quizzes directly under this module
          try {
            const moduleQuizzes = await base44.entities.Quiz.filter({ module_id: module.id });
            for (const quiz of moduleQuizzes) {
              try {
                await base44.entities.Quiz.delete(quiz.id);
              } catch (err) {
                console.warn(`Quiz ${quiz.id} already deleted`);
              }
            }
          } catch (error) {
            console.warn(`Could not delete quizzes for module ${module.id}:`, error);
          }
          
          // Delete materials directly under this module
          try {
            const moduleMaterials = await base44.entities.LearningMaterial.filter({ module_id: module.id });
            for (const material of moduleMaterials) {
              try {
                await base44.entities.LearningMaterial.delete(material.id);
              } catch (err) {
                console.warn(`Material ${material.id} already deleted`);
              }
            }
          } catch (error) {
            console.warn(`Could not delete materials for module ${module.id}:`, error);
          }
          
          // Delete the module
          try {
            await base44.entities.Module.delete(module.id);
          } catch (error) {
            console.warn(`Could not delete module ${module.id}:`, error);
          }
        }
      } catch (error) {
        console.warn('Error loading modules:', error);
      }
      
      // Delete videos directly under this course
      try {
        const courseVideos = await base44.entities.Video.filter({ course_id: courseToDelete.id });
        for (const video of courseVideos) {
          try {
            await base44.entities.Video.delete(video.id);
          } catch (err) {
            console.warn(`Video ${video.id} already deleted`);
          }
        }
      } catch (error) {
        console.warn(`Could not delete course videos:`, error);
      }
      
      // Delete quizzes directly under this course
      try {
        const courseQuizzes = await base44.entities.Quiz.filter({ course_id: courseToDelete.id });
        for (const quiz of courseQuizzes) {
          try {
            await base44.entities.Quiz.delete(quiz.id);
          } catch (err) {
            console.warn(`Quiz ${quiz.id} already deleted`);
          }
        }
      } catch (error) {
        console.warn(`Could not delete course quizzes:`, error);
      }
      
      // Delete materials directly under this course
      try {
        const courseMaterials = await base44.entities.LearningMaterial.filter({ course_id: courseToDelete.id });
        for (const material of courseMaterials) {
          try {
            await base44.entities.LearningMaterial.delete(material.id);
          } catch (err) {
            console.warn(`Material ${material.id} already deleted`);
          }
        }
      } catch (error) {
        console.warn(`Could not delete course materials:`, error);
      }
      
      // Delete enrollments for this course
      try {
        const courseEnrollments = await base44.entities.Enrollment.filter({ course_id: courseToDelete.id });
        for (const enrollment of courseEnrollments) {
          try {
            await base44.entities.Enrollment.delete(enrollment.id);
          } catch (err) {
            console.warn(`Enrollment ${enrollment.id} already deleted`);
          }
        }
      } catch (error) {
        console.warn(`Could not delete course enrollments:`, error);
      }
      
      // Finally, delete the course itself
      try {
        await base44.entities.Course.delete(courseToDelete.id);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn('Course already deleted');
        } else {
          throw error;
        }
      }
      
      await loadData();
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error("Error deleting course:", error);
      
      // Still reload data to refresh the UI
      await loadData();
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      
      // Only show alert if it's not a "not found" error
      if (!error.message || !error.message.includes('not found')) {
        alert("An error occurred during deletion. Please refresh and try again.");
      }
    }
  };

  const togglePhase = (phase) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phase)) {
        newSet.delete(phase);
      } else {
        newSet.add(phase);
      }
      return newSet;
    });
  };

  const openAssignStudentModal = (phase) => {
    setSelectedPhase(phase);
    setSelectedStudentIds([]);
    setIsAssignStudentModalOpen(true);
  };

  const handleAssignStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student");
      return;
    }

    try {
      await Promise.all(
        selectedStudentIds.map(studentId => 
          base44.entities.User.update(studentId, { assigned_phase: selectedPhase })
        )
      );

      alert(`Successfully assigned ${selectedStudentIds.length} student(s) to ${selectedPhase.replace('phase', 'Phase ')}`);
      setIsAssignStudentModalOpen(false);
      setSelectedStudentIds([]);
      await loadData();
    } catch (error) {
      console.error("Error assigning students to phase:", error);
      alert("Failed to assign students. Please try again.");
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCourseForm({ ...courseForm, cover_photo_url: file_url });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
    setUploadingImage(false);
  };

  const getTeacherName = (instructorId) => {
    const teacher = teachers.find(t => t.id === instructorId);
    return teacher ? teacher.full_name || teacher.email : 'Not assigned';
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const coursesByPhase = courses.reduce((acc, course) => {
    const phase = course.phase || 'unassigned';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(course);
    return acc;
  }, {});

  // Sort courses within each phase by order_index
  Object.keys(coursesByPhase).forEach(phase => {
    coursesByPhase[phase].sort((a, b) => {
      const orderA = a.order_index || 0;
      const orderB = b.order_index || 0;
      return orderA - orderB;
    });
  });

  const phaseInfo = {
    phase1: { name: 'Phase 1', icon: '📚', color: 'from-blue-500 to-blue-600' },
    phase2: { name: 'Phase 2', icon: '🎯', color: 'from-purple-500 to-purple-600' },
    phase3: { name: 'Phase 3', icon: '🏆', color: 'from-green-500 to-green-600' },
    unassigned: { name: 'Unassigned', icon: '📦', color: 'from-gray-500 to-gray-600' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
          <Button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Course
          </Button>
        </div>

        {courses.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(coursesByPhase).map(([phase, phaseCourses]) => {
              if (phaseCourses.length === 0 && phase !== 'unassigned') return null;
              
              const info = phaseInfo[phase];
              const isExpanded = expandedPhases.has(phase);

              return (
                <div key={phase} className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase)}
                    className={`w-full p-6 bg-gradient-to-r ${info.color} text-white hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{info.icon}</span>
                        <div className="text-left">
                          <h2 className="text-2xl font-bold">{info.name}</h2>
                          <p className="text-white/90 text-sm">{phaseCourses.length} course{phaseCourses.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {phase !== 'unassigned' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignStudentModal(phase);
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/50"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Assign Students
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-8 h-8" />
                        ) : (
                          <ChevronRight className="w-8 h-8" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {phaseCourses.map(course => {
                          const stats = courseStats[course.id] || { videos: 0, students: 0 };
                          
                          return (
                            <div key={course.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <Link to={createPageUrl(`AdminCourseDetail?id=${course.id}`)}>
                                      <h3 className="font-bold text-lg text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 mb-2">
                                        {course.title}
                                      </h3>
                                    </Link>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{course.description}</p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openModal(course)}>
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openDeleteModal(course)} className="text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center text-gray-600">
                                    <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                                    <span className="capitalize">{course.category?.replace('-', ' ')}</span>
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <Users className="w-4 h-4 mr-2 text-green-500" />
                                    <span>{getTeacherName(course.instructor_id)}</span>
                                  </div>
                                  <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                                    <div className="flex items-center text-gray-600">
                                      <PlayCircle className="w-4 h-4 mr-1 text-purple-500" />
                                      <span>{stats.videos} videos</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <Users className="w-4 h-4 mr-1 text-teal-500" />
                                      <span>{stats.students} students</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
                                <Link to={createPageUrl(`AdminCourseDetail?id=${course.id}`)}>
                                  <Button variant="outline" size="sm" className="w-full">
                                    Manage Course
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center bg-white rounded-xl p-12 shadow-sm border border-gray-100">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first course</p>
            <Button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-teal-600">
              <PlusCircle className="w-4 h-4 mr-2" /> Add Course
            </Button>
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={courseForm.title}
                onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                placeholder="e.g., Introduction to Nursing"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Course description..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cover_photo">Cover Photo</Label>
              <div className="space-y-2">
                <Input
                  id="cover_photo_url"
                  type="text"
                  value={courseForm.cover_photo_url}
                  onChange={(e) => setCourseForm({...courseForm, cover_photo_url: e.target.value})}
                  placeholder="Enter image URL or upload below"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="cover_photo_file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="cursor-pointer"
                  />
                  {uploadingImage && (
                    <span className="text-sm text-gray-500">Uploading...</span>
                  )}
                </div>
                {courseForm.cover_photo_url && (
                  <div className="mt-2">
                    <img 
                      src={courseForm.cover_photo_url} 
                      alt="Cover preview" 
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={courseForm.category} onValueChange={(value) => setCourseForm({...courseForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nclex-rn">NCLEX-RN</SelectItem>
                    <SelectItem value="nclex-pn">NCLEX-PN</SelectItem>
                    <SelectItem value="fundamentals">Fundamentals</SelectItem>
                    <SelectItem value="pharmacology">Pharmacology</SelectItem>
                    <SelectItem value="pathophysiology">Pathophysiology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phase">Phase</Label>
                <Select value={courseForm.phase} onValueChange={(value) => setCourseForm({...courseForm, phase: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phase1">Phase 1</SelectItem>
                    <SelectItem value="phase2">Phase 2</SelectItem>
                    <SelectItem value="phase3">Phase 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instructor">Instructor</Label>
                <Select value={courseForm.instructor_id} onValueChange={(value) => setCourseForm({...courseForm, instructor_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name || teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={courseForm.difficulty_level} onValueChange={(value) => setCourseForm({...courseForm, difficulty_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (weeks)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={courseForm.duration_weeks}
                  onChange={(e) => setCourseForm({...courseForm, duration_weeks: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label htmlFor="order">Order Index</Label>
                <Input
                  id="order"
                  type="number"
                  value={courseForm.order_index}
                  onChange={(e) => setCourseForm({...courseForm, order_index: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={courseForm.is_active}
                onCheckedChange={(checked) => setCourseForm({...courseForm, is_active: checked})}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active Course</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!courseForm.title}>
              {editingCourse ? 'Update' : 'Create'} Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone and will delete all associated modules, sections, videos, quizzes, learning materials, and enrollments.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Students to Phase Modal */}
      <Dialog open={isAssignStudentModalOpen} onOpenChange={setIsAssignStudentModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Assign Students to {selectedPhase?.replace('phase', 'Phase ')}
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Select students to assign to this phase. Students will only see courses from their assigned phase.
            </p>
          </DialogHeader>

          <div className="py-4">
            {selectedStudentIds.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  {selectedStudentIds.length} student(s) selected
                </p>
              </div>
            )}

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {allStudents.length > 0 ? (
                allStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const currentPhase = student.assigned_phase;
                  
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {}}
                          className="pointer-events-none"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{student.full_name || 'Unnamed Student'}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          {currentPhase && (
                            <p className="text-xs text-gray-400 mt-1">
                              Current Phase: {currentPhase.replace('phase', 'Phase ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No students found</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignStudentModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignStudents}
              disabled={selectedStudentIds.length === 0}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              Assign to {selectedPhase?.replace('phase', 'Phase ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
