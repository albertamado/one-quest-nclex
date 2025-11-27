
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Folder, FolderPlus, PlayCircle, FileText, BookOpen, ChevronDown, ChevronRight, FolderOpen, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUserRole } from '../components/utils/getUserRole';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminModules() {
  const [modules, setModules] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState(new Set());
  const [expandedModules, setExpandedModules] = useState(new Set());

  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [contentTypeToAdd, setContentTypeToAdd] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check authentication first
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        window.location.href = createPageUrl("Home");
        return;
      }

      const user = await base44.auth.me();
      setCurrentUser(user);

      if (getUserRole(user) !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      // Load courses first
      let allCourses = [];
      try {
        allCourses = await base44.entities.Course.list('order_index');
        setCourses(allCourses || []);
        
        if (allCourses && allCourses.length > 0) {
          setExpandedCourses(new Set([allCourses[0].id]));
        }
      } catch (err) {
        console.error("Error loading courses:", err);
        setCourses([]);
      }

      // Get valid course IDs
      const validCourseIds = allCourses.map(c => c.id);

      // Load modules and filter out orphaned ones
      let currentModules = [];
      try {
        const allModules = await base44.entities.Module.list('order_index');
        // Filter modules to only include those with valid courses
        const validModules = allModules.filter(m => validCourseIds.includes(m.course_id));
        currentModules = validModules; // Store for next step

        // Clean up orphaned modules
        const orphanedModules = allModules.filter(m => !validCourseIds.includes(m.course_id));
        for (const orphaned of orphanedModules) {
          try {
            console.log(`Cleaning up orphaned module: ${orphaned.title} (ID: ${orphaned.id})`);
            await base44.entities.Module.delete(orphaned.id);
          } catch (deleteError) {
            console.warn(`Could not delete orphaned module ${orphaned.id}:`, deleteError);
          }
        }
        
        setModules(validModules || []);
      } catch (err) {
        console.error("Error loading modules:", err);
        setModules([]);
      }

      // Get valid module IDs from the *current* modules list after potential deletions
      const validModuleIds = currentModules.map(m => m.id);

      // Load sections and filter out orphaned ones
      try {
        const allSections = await base44.entities.Section.list('order_index');
        // Filter sections to only include those with valid modules
        const validSections = allSections.filter(s => validModuleIds.includes(s.module_id));
        
        // Clean up orphaned sections
        const orphanedSections = allSections.filter(s => !validModuleIds.includes(s.module_id));
        for (const orphaned of orphanedSections) {
          try {
            console.log(`Cleaning up orphaned section: ${orphaned.title} (ID: ${orphaned.id})`);
            await base44.entities.Section.delete(orphaned.id);
          } catch (deleteError) {
            console.warn(`Could not delete orphaned section ${orphaned.id}:`, deleteError);
          }
        }
        
        setSections(validSections || []);
      } catch (err) {
        console.error("Error loading sections:", err);
        setSections([]);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      setError(error.message || "Failed to load data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModule = async () => {
    if (!editingModule || !editingModule.course_id || !editingModule.title) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (editingModule.id) {
        await base44.entities.Module.update(editingModule.id, editingModule);
      } else {
        await base44.entities.Module.create(editingModule);
      }
      await loadData();
      setIsModuleModalOpen(false);
      setEditingModule(null);
    } catch (error) {
      console.error("Error saving module:", error);
      alert("Failed to save module");
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection || !editingSection.module_id || !editingSection.title) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      let savedSection;
      if (editingSection.id) {
        savedSection = await base44.entities.Section.update(editingSection.id, editingSection);
      } else {
        savedSection = await base44.entities.Section.create(editingSection);
        
        if (savedSection && (editingSection.section_type === 'videos' || editingSection.section_type === 'quiz' || editingSection.section_type === 'materials')) {
          setSelectedSection(savedSection);
          let typeToConfirm = '';
          if (editingSection.section_type === 'videos') {
            typeToConfirm = 'video';
          } else if (editingSection.section_type === 'quiz') {
            typeToConfirm = 'quiz';
          } else if (editingSection.section_type === 'materials') {
            typeToConfirm = 'material';
          }
          setContentTypeToAdd(typeToConfirm);
          setIsAddContentModalOpen(true);
        }
      }
      await loadData();
      setIsSectionModalOpen(false);
      setEditingSection(null);
    } catch (error) {
      console.error("Error saving section:", error);
      alert("Failed to save section");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    
    try {
      if (deleteType === 'module') {
        // Delete all sections in this module first
        const moduleSections = sections.filter(s => s.module_id === deleteItem.id);
        for (const section of moduleSections) {
          try {
            await base44.entities.Section.delete(section.id);
          } catch (error) {
            console.warn(`Section ${section.id} not found or already deleted:`, error);
          }
        }
        // Then delete the module
        await base44.entities.Module.delete(deleteItem.id);
      } else if (deleteType === 'section') {
        try {
          await base44.entities.Section.delete(deleteItem.id);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.warn('Section not found, it may have been already deleted');
          } else {
            throw error;
          }
        }
      }
      
      await loadData();
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
      setDeleteType(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete. The item may have already been removed.");
      await loadData();
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
      setDeleteType(null);
    }
  };

  const openAddModuleModal = () => {
    setEditingModule({
      title: '',
      description: '',
      course_id: '',
      order_index: modules.length + 1,
      is_active: true
    });
    setIsModuleModalOpen(true);
  };

  const openEditModuleModal = (module) => {
    setEditingModule({...module});
    setIsModuleModalOpen(true);
  };

  const openAddSectionModal = (moduleId = null) => {
    setEditingSection({
      title: '',
      module_id: moduleId || '',
      section_type: 'other',
      order_index: sections.length + 1,
      is_active: true
    });
    setIsSectionModalOpen(true);
  };

  const openEditSectionModal = (section) => {
    setEditingSection({...section});
    setIsSectionModalOpen(true);
  };

  const openDeleteModal = (item, type) => {
    setDeleteItem(item);
    setDeleteType(type);
    setIsDeleteModalOpen(true);
  };

  const handleAddContentToSection = (section, contentType) => {
    if (contentType === 'video') {
      window.location.href = createPageUrl(`AdminVideos?section_id=${section.id}`);
    } else if (contentType === 'quiz') {
      window.location.href = createPageUrl(`AdminQuizzes?section_id=${section.id}`);
    } else if (contentType === 'material') {
      window.location.href = createPageUrl(`AdminMaterials?section_id=${section.id}`);
    }
  };

  const getCourseTitle = (courseId) => {
    return courses.find(c => c.id === courseId)?.title || 'N/A';
  };

  const getModuleTitle = (moduleId) => {
    return modules.find(m => m.id === moduleId)?.title || 'N/A';
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
        setExpandedModules(new Set());
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course structure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <Button 
              onClick={loadData} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = createPageUrl("AdminDashboard")} 
              variant="outline"
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getContentTypeName = (type) => {
    switch (type) {
      case 'video': return 'Video';
      case 'quiz': return 'Quiz';
      case 'material': return 'Material';
      default: return '';
    }
  };

  const getContentPageName = (type) => {
    switch (type) {
      case 'video': return 'Videos';
      case 'quiz': return 'Quizzes';
      case 'material': return 'Learning Materials';
      default: return '';
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video': return <PlayCircle className="w-4 h-4 mr-2" />;
      case 'quiz': return <FileText className="w-4 h-4 mr-2" />;
      case 'material': return <BookOpen className="w-4 h-4 mr-2" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Structure Management</h1>
            <p className="text-gray-600 mt-2">Organize courses into modules and sections</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={openAddModuleModal} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
              <Folder className="w-4 h-4 mr-2" /> Add Module
            </Button>
            <Button onClick={() => openAddSectionModal()} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <FolderPlus className="w-4 h-4 mr-2" /> Add Section
            </Button>
          </div>
        </div>

        {/* Modules Grouped by Course */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-xl font-bold text-gray-900">Modules by Course</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {courses.map((course) => {
              const courseModules = modules.filter(m => m.course_id === course.id);
              const isExpanded = expandedCourses.has(course.id);
              
              return (
                <div key={course.id}>
                  <button
                    onClick={() => toggleCourse(course.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">{courseModules.length} modules</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-gray-50 px-6 pb-6">
                      {courseModules.length > 0 ? (
                        <div className="space-y-3">
                          {courseModules.map((module) => {
                            const moduleSections = sections.filter(s => s.module_id === module.id);
                            const isModuleExpanded = expandedModules.has(module.id);
                            
                            return (
                              <div key={module.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                                <div className="p-4 flex items-center justify-between group">
                                  {/* Left side - Module info with expand button */}
                                  <button
                                    onClick={() => toggleModule(module.id)}
                                    className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                                  >
                                    {isModuleExpanded ? (
                                      <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    ) : (
                                      <Folder className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900">{module.title}</h4>
                                      <p className="text-sm text-gray-500">{moduleSections.length} sections</p>
                                    </div>
                                  </button>

                                  {/* Right side - Action buttons */}
                                  <div className="flex items-center gap-2 ml-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${module.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                      {module.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    
                                    {/* Edit Button */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModuleModal(module);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    {/* Delete Button - Always Visible */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(module, 'module');
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete Module"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>

                                    {/* Expand/Collapse Icon */}
                                    <button
                                      onClick={() => toggleModule(module.id)}
                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      {isModuleExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {isModuleExpanded && (
                                  <div className="border-t border-gray-200 bg-gray-50">
                                    {/* Module Action Bar */}
                                    <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700">Module Actions:</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openAddSectionModal(module.id);
                                          }}
                                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                                        >
                                          <FolderPlus className="h-4 w-4 mr-1" />
                                          Add Section
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModuleModal(module);
                                          }}
                                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit Module
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Sections List */}
                                    {moduleSections.length > 0 ? (
                                      <div className="p-4">
                                        <div className="space-y-2">
                                          {moduleSections.map((section) => (
                                            <div key={section.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                              <div className="flex items-center gap-3">
                                                <Folder className="w-4 h-4 text-purple-600" />
                                                <div>
                                                  <p className="font-medium text-sm text-gray-900">{section.title}</p>
                                                  <span className={`capitalize px-2 py-0.5 rounded-full text-xs ${
                                                    section.section_type === 'videos' ? 'bg-blue-100 text-blue-800' :
                                                    section.section_type === 'quiz' ? 'bg-purple-100 text-purple-800' :
                                                    section.section_type === 'materials' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>
                                                    {section.section_type}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteModal(section, 'section');
                                                  }}
                                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                                
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                      <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    {section.section_type === 'videos' && (
                                                      <DropdownMenuItem onClick={() => handleAddContentToSection(section, 'video')}>
                                                        <PlayCircle className="w-4 h-4 mr-2" /> Add Video
                                                      </DropdownMenuItem>
                                                    )}
                                                    {section.section_type === 'quiz' && (
                                                      <DropdownMenuItem onClick={() => handleAddContentToSection(section, 'quiz')}>
                                                        <FileText className="w-4 h-4 mr-2" /> Add Quiz
                                                      </DropdownMenuItem>
                                                    )}
                                                    {section.section_type === 'materials' && (
                                                      <DropdownMenuItem onClick={() => handleAddContentToSection(section, 'material')}>
                                                        <BookOpen className="w-4 h-4 mr-2" /> Add Material
                                                      </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => openEditSectionModal(section)}>
                                                      <Edit className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-8 text-center text-gray-500">
                                        No sections in this module yet.
                                        <Button
                                          variant="link"
                                          size="sm"
                                          onClick={() => openAddSectionModal(module.id)}
                                          className="text-purple-600 hover:text-purple-700 ml-2"
                                        >
                                          Add one now
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
                          No modules in this course yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Module Modal */}
      <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingModule?.id ? 'Edit' : 'Add'} Module</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Course <span className="text-red-500">*</span>
              </label>
              <Select
                value={editingModule?.course_id || ''}
                onValueChange={(value) => setEditingModule({...editingModule, course_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Module Title *"
              value={editingModule?.title || ''}
              onChange={(e) => setEditingModule({...editingModule, title: e.target.value})}
            />
            <Textarea
              placeholder="Description"
              value={editingModule?.description || ''}
              onChange={(e) => setEditingModule({...editingModule, description: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Order Index"
              value={editingModule?.order_index || ''}
              onChange={(e) => setEditingModule({...editingModule, order_index: Number(e.target.value)})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveModule}>Save Module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Modal */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingSection?.id ? 'Edit' : 'Add'} Section</DialogTitle>
            <DialogDescription>
              Sections help organize your content. Choose a type to specify what kind of content this section will contain.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Module <span className="text-red-500">*</span>
              </label>
              <Select
                value={editingSection?.module_id || ''}
                onValueChange={(value) => setEditingSection({...editingSection, module_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(module => (
                    <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Section Title *"
              value={editingSection?.title || ''}
              onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
            />
            <div>
              <label className="text-sm font-medium mb-2 block">
                Content Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={editingSection?.section_type || 'other'}
                onValueChange={(value) => setEditingSection({...editingSection, section_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Section Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="videos">
                    <div className="flex items-center">
                      <PlayCircle className="w-4 h-4 mr-2 text-blue-500" />
                      Videos - For video lessons
                    </div>
                  </SelectItem>
                  <SelectItem value="quiz">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      Quiz - For assessments
                    </div>
                  </SelectItem>
                  <SelectItem value="materials">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-green-500" />
                      Learning Materials - For documents and resources
                    </div>
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                This determines what type of content can be added to this section
              </p>
            </div>
            <Input
              type="number"
              placeholder="Order Index"
              value={editingSection?.order_index || ''}
              onChange={(e) => setEditingSection({...editingSection, order_index: Number(e.target.value)})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection}>
              {editingSection?.id ? 'Update Section' : 'Create Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Content Confirmation Modal */}
      <Dialog open={isAddContentModalOpen} onOpenChange={setIsAddContentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Section Created Successfully!</DialogTitle>
            <DialogDescription>
              Would you like to add content to this {getContentTypeName(contentTypeToAdd).toLowerCase()} section now?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              You created a <span className="font-semibold capitalize">{getContentTypeName(contentTypeToAdd).toLowerCase()}</span> section. 
              You can add content now or do it later from the {getContentPageName(contentTypeToAdd)} management page.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContentModalOpen(false)}>
              Add Later
            </Button>
            <Button onClick={() => {
              if (selectedSection && contentTypeToAdd) {
                handleAddContentToSection(selectedSection, contentTypeToAdd);
              }
            }}>
              {getContentTypeIcon(contentTypeToAdd)} Add {getContentTypeName(contentTypeToAdd)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === 'module' ? 'Module' : 'Section'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteItem?.title}"?
              {deleteType === 'module' && " This will also delete all sections within this module."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
