
import React, { useState, useEffect } from 'react';
import { Video } from '@/api/entities';
import { Course } from '@/api/entities';
import { StudentProgress } from '@/api/entities';
import { User } from '@/api/entities';
import { Section } from '@/api/entities';
import { Module } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Users, Upload, Loader2, PlayCircle, AlertCircle, Folder } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUserRole } from '../components/utils/getUserRole';
import { Alert, AlertDescription } from "@/components/ui/alert";

const VideoForm = ({ video, setVideo, onFileSelect, uploadingFile, uploadedFileUrl, uploadError }) => {
  const safeVideo = video || {
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    order_index: '',
    course_id: '',
    section_id: null,
    caption_url: ''
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Video Title"
        value={safeVideo.title || ''}
        onChange={(e) => setVideo({ ...safeVideo, title: e.target.value })} />

      <Textarea
        placeholder="Description"
        value={safeVideo.description || ''}
        onChange={(e) => setVideo({ ...safeVideo, description: e.target.value })} />

      
      {/* Video Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload Video File or Enter URL
        </label>
        
        {uploadError &&
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        }
        
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="video/*"
            onChange={onFileSelect}
            disabled={uploadingFile}
            className="flex-1" />

          {uploadingFile &&
          <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          }
        </div>
        
        {uploadedFileUrl &&
        <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 text-sm">
              ✓ File uploaded successfully
            </AlertDescription>
          </Alert>
        }
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>
        
        <Input
          placeholder="Video URL (YouTube, Google Drive, or direct link)"
          value={safeVideo.video_url || ''}
          onChange={(e) => setVideo({ ...safeVideo, video_url: e.target.value })} />

        <p className="text-xs text-gray-500">
          Supports YouTube, Google Drive links, or direct video URLs. Max file size: 100MB. Captions will be auto-generated for YouTube videos.
        </p>
      </div>

      <Input
        placeholder="Thumbnail URL (optional)"
        value={safeVideo.thumbnail_url || ''}
        onChange={(e) => setVideo({ ...safeVideo, thumbnail_url: e.target.value })} />

      
      <Input
        placeholder="Caption/Subtitle URL (.vtt file) - Optional"
        value={safeVideo.caption_url || ''}
        onChange={(e) => setVideo({ ...safeVideo, caption_url: e.target.value })} />

      <p className="text-xs text-gray-500">
        You can upload a .vtt (WebVTT) subtitle file for better accessibility
      </p>
      
      <Input
        type="number"
        placeholder="Order Index"
        value={safeVideo.order_index === '' ? '' : safeVideo.order_index}
        onChange={(e) => setVideo({ ...safeVideo, order_index: Number(e.target.value) })} />

    </div>);

};

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [sections, setSections] = useState([]);
  const [videoStats, setVideoStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [preselectedSectionId, setPreselectedSectionId] = useState(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionId = urlParams.get('section_id');
    if (sectionId) {
      setPreselectedSectionId(sectionId);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (getUserRole(user) !== 'admin') {
        window.location.href = '/';
        return;
      }

      const [allVideos, allCourses, allProgress, allSections, allModules] = await Promise.all([
      Video.list('order_index'),
      Course.list(),
      StudentProgress.list(),
      Section.list(),
      Module.list()]
      );

      setVideos(allVideos);
      setCourses(allCourses);
      setSections(allSections);
      setModules(allModules);

      const stats = allProgress.reduce((acc, progress) => {
        if (progress.video_id) {
          if (!acc[progress.video_id]) acc[progress.video_id] = new Set();
          acc[progress.video_id].add(progress.student_id);
        }
        return acc;
      }, {});
      setVideoStats(stats);

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Video file size must be less than 100MB");
      return;
    }

    setUploadingFile(true);
    setUploadedFileUrl(null);
    setUploadError(null);

    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const { UploadFile: uploadFn } = await import('@/api/integrations');
        const result = await uploadFn({ file });
        const fileUrl = result.file_url;

        setUploadedFileUrl(fileUrl);
        setEditingVideo((prev) => ({
          ...(prev || {}),
          video_url: fileUrl
        }));
        setUploadingFile(false);
        setUploadError(null);
        return;
      } catch (error) {
        attempt++;
        console.error(`Upload attempt ${attempt} failed:`, error);

        if (attempt > maxRetries) {
          setUploadingFile(false);

          if (error.message?.includes('timeout') || error.message?.includes('DatabaseTimeout')) {
            setUploadError("Upload timed out. Please try a smaller file or use a video URL instead.");
          } else if (error.response?.status === 500) {
            setUploadError("Server error occurred. Please try again in a moment or use a video URL.");
          } else {
            setUploadError("Failed to upload video. Please try again or use a video URL.");
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
  };

  const handleSave = async () => {
    if (!editingVideo || !editingVideo.video_url) {
      setUploadError("Please provide a video URL or upload a file");
      return;
    }

    // Validate Google Drive links
    if (editingVideo.video_url.includes('drive.google.com/drive/folders/')) {
      setUploadError("Please use a direct video file link, not a folder link. Right-click on the video file in Google Drive and select 'Get link' to share the specific video.");
      return;
    }

    try {
      // Prepare video data - only include fields that have values
      const videoData = {
        title: editingVideo.title,
        course_id: editingVideo.course_id,
        video_url: editingVideo.video_url,
        order_index: editingVideo.order_index === '' || editingVideo.order_index === null ? 0 : Number(editingVideo.order_index)
      };

      // Add optional fields only if they have values
      if (editingVideo.description && editingVideo.description.trim() !== '') {
        videoData.description = editingVideo.description;
      }

      if (editingVideo.thumbnail_url && editingVideo.thumbnail_url.trim() !== '') {
        videoData.thumbnail_url = editingVideo.thumbnail_url;
      }

      if (editingVideo.caption_url && editingVideo.caption_url.trim() !== '') {
        videoData.caption_url = editingVideo.caption_url;
      }

      // Ensure section_id and module_id are not empty strings if provided
      if (editingVideo.section_id && editingVideo.section_id !== '') {
        videoData.section_id = editingVideo.section_id;
      } else {
        videoData.section_id = null; // Explicitly set to null if empty
      }

      if (editingVideo.module_id && editingVideo.module_id !== '') {
        videoData.module_id = editingVideo.module_id;
      } else {
        videoData.module_id = null; // Explicitly set to null if empty
      }

      // Save the video
      if (editingVideo.id) {
        await Video.update(editingVideo.id, videoData);
      } else {
        await Video.create(videoData);
      }

      await loadData();
      setIsModalOpen(false);
      setEditingVideo(null);
      setUploadedFileUrl(null);
      setUploadError(null);
      setPreselectedSectionId(null);
    } catch (error) {
      console.error("Error saving video:", error);

      // Provide more helpful error messages
      if (error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        setUploadError("Connection error. Please check your internet connection and try again.");
      } else if (error.response?.status === 400) {
        setUploadError("Invalid data. Please check all fields and try again.");
      } else if (error.response?.status === 500) {
        setUploadError("Server error. Please try again in a moment.");
      } else {
        setUploadError("Failed to save video. Please check all required fields and try again.");
      }
    }
  };

  const handleDelete = async () => {
    if (!editingVideo) return;
    try {
      await Video.delete(editingVideo.id);
      await loadData();
      setIsDeleteModalOpen(false);
      setEditingVideo(null);
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const openAddModal = () => {
    setEditingVideo({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      caption_url: '',
      order_index: '',
      course_id: '',
      module_id: '', // Initialize to empty string for consistency
      section_id: preselectedSectionId || '' // Initialize to empty string for consistency
    });
    setUploadedFileUrl(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (video) => {
    // Ensure module_id and section_id are empty string if null, for Select component
    setEditingVideo({
      ...video,
      module_id: video.module_id || '',
      section_id: video.section_id || ''
    });
    setUploadedFileUrl(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (video) => {
    setEditingVideo({ ...video });
    setIsDeleteModalOpen(true);
  };

  const openPreviewModal = (video) => {
    setPreviewVideo({ ...video });
    setIsPreviewModalOpen(true);
  };

  const getCourseTitle = (courseId) => courses.find((c) => c.id === courseId)?.title || 'N/A';
  const getModuleTitle = (moduleId) => modules.find((m) => m.id === moduleId)?.title || 'N/A';
  const getSectionTitle = (sectionId) => sections.find((s) => s.id === sectionId)?.title || 'N/A';

  const getVideoThumbnail = (video) => {
    if (video.thumbnail_url) return video.thumbnail_url;

    if (video.video_url?.includes('youtube.com') || video.video_url?.includes('youtu.be')) {
      const videoIdMatch = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
      }
    }

    return null;
  };

  // Filter videos by course and module
  const filteredVideos = videos.filter((video) => {
    if (selectedCourseFilter !== 'all' && video.course_id !== selectedCourseFilter) return false;
    if (selectedModuleFilter !== 'all' && video.module_id !== selectedModuleFilter && selectedModuleFilter !== 'null') return false;

    // Handle case where module_id is null/undefined and filter is 'null'
    if (selectedModuleFilter === 'null' && video.module_id !== null && video.module_id !== undefined) return false;

    return true;
  });

  // Get modules for selected course
  const filteredModules = selectedCourseFilter === 'all' ?
  modules :
  modules.filter((m) => m.course_id === selectedCourseFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Video Management</h1>
            <p className="text-gray-600 mt-2">Organize videos by courses and modules</p>
          </div>
          <Button onClick={openAddModal} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-lg">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Video
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Course</label>
              <Select value={selectedCourseFilter} onValueChange={(value) => {
                setSelectedCourseFilter(value);
                setSelectedModuleFilter('all');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) =>
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Module</label>
              <Select value={selectedModuleFilter} onValueChange={setSelectedModuleFilter} disabled={selectedCourseFilter === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="null">No Module Assigned</SelectItem> {/* Added for filtering unassigned videos */}
                  {filteredModules.map((module) =>
                  <SelectItem key={module.id} value={module.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        {module.title}
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-teal-50">
                <TableHead className="text-slate-900 px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Thumbnail</TableHead>
                <TableHead className="text-slate-900 px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Title</TableHead>
                <TableHead className="text-slate-900 px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Course</TableHead>
                <TableHead className="text-slate-900 px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Module</TableHead>
                <TableHead className="text-slate-900 px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Section</TableHead>
                <TableHead className="text-slate-900 px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Views</TableHead>
                <TableHead className="text-slate-900 px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Order</TableHead>
                <TableHead className="text-slate-900 px-4 font-medium text-right h-12 align-middle [&:has([role=checkbox])]:pr-0">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ?
              <TableRow><TableCell colSpan={8} className="text-center py-10">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell></TableRow> :
              filteredVideos.length > 0 ?
              filteredVideos.map((video) => {
                const thumbnail = getVideoThumbnail(video);
                return (
                  <TableRow key={video.id} className="hover:bg-blue-50 transition-colors">
                      <TableCell>
                        <div className="w-20 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-shadow" onClick={() => openPreviewModal(video)}>
                          {thumbnail ?
                        <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" /> :

                        <PlayCircle className="w-6 h-6 text-gray-400" />
                        }
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">{video.title}</TableCell>
                      <TableCell className="text-gray-600">{getCourseTitle(video.course_id)}</TableCell>
                      <TableCell className="text-gray-600">{video.module_id ? getModuleTitle(video.module_id) : '-'}</TableCell>
                      <TableCell className="text-gray-600">{video.section_id ? getSectionTitle(video.section_id) : '-'}</TableCell>
                      <TableCell className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-blue-500" /> {videoStats[video.id]?.size || 0}
                      </TableCell>
                      <TableCell className="text-gray-600">{video.order_index}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-100"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="shadow-xl">
                            <DropdownMenuItem onClick={() => openPreviewModal(video)} className="hover:bg-blue-50">
                              <PlayCircle className="w-4 h-4 mr-2 text-blue-600" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(video)} className="hover:bg-blue-50">
                              <Edit className="w-4 h-4 mr-2 text-blue-600" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 hover:bg-red-50" onClick={() => openDeleteModal(video)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>);

              }) :

              <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-500">No videos found with current filters.</TableCell></TableRow>
              }
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {editingVideo?.id ? 'Edit' : 'Add'} Video
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Select
              value={editingVideo?.course_id || ''}
              onValueChange={(value) => setEditingVideo({ ...editingVideo, course_id: value, module_id: '', section_id: '' })}>
              <SelectTrigger><SelectValue placeholder="Select Course *" /></SelectTrigger>
              <SelectContent>
                {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
              </SelectContent>
            </Select>

            {editingVideo?.course_id &&
            <Select
              value={editingVideo?.module_id || ''}
              onValueChange={(value) => setEditingVideo({ ...editingVideo, module_id: value === 'null' ? '' : value, section_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Select Module (Optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">No Module</SelectItem>
                  {modules.filter((m) => m.course_id === editingVideo.course_id).map((module) =>
                <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                )}
                </SelectContent>
              </Select>
            }

            {editingVideo?.module_id &&
            <Select
              value={editingVideo?.section_id || ''}
              onValueChange={(value) => setEditingVideo({ ...editingVideo, section_id: value === 'null' ? '' : value })}>
                <SelectTrigger><SelectValue placeholder="Select Section (Optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">No Section</SelectItem>
                  {sections.filter((s) => s.module_id === editingVideo.module_id).map((section) =>
                <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>
                )}
                </SelectContent>
              </Select>
            }

            <VideoForm
              video={editingVideo}
              setVideo={setEditingVideo}
              onFileSelect={handleFileSelect}
              uploadingFile={uploadingFile}
              uploadedFileUrl={uploadedFileUrl}
              uploadError={uploadError} />

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              setEditingVideo(null);
              setUploadedFileUrl(null);
              setUploadError(null);
              setPreselectedSectionId(null);
            }}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploadingFile} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
              {uploadingFile ?
              <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</span> :
              'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Video</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{editingVideo?.title}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{previewVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewVideo &&
            <div className="bg-black rounded-lg overflow-hidden">
                {previewVideo.video_url?.includes('youtube.com') || previewVideo.video_url?.includes('youtu.be') ?
              <iframe
                src={previewVideo.video_url.replace('watch?v=', 'embed/')}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video Player" /> :

              previewVideo.video_url?.includes('drive.google.com') ?
              <iframe
                src={previewVideo.video_url.replace('/view', '/preview')}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video Player" /> :


              <video
                src={previewVideo.video_url}
                controls
                className="w-full aspect-video">

                    {previewVideo.caption_url &&
                <track
                  label="English"
                  kind="subtitles"
                  srcLang="en"
                  src={previewVideo.caption_url}
                  default />

                }
                  </video>
              }
              </div>
            }
            {previewVideo?.description &&
            <p className="mt-4 text-gray-600">{previewVideo.description}</p>
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}