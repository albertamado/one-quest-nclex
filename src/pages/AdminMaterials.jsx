import React, { useState, useEffect } from 'react';
import { LearningMaterial } from '@/api/entities';
import { Course } from '@/api/entities';
import { Module } from '@/api/entities';
import { Section } from '@/api/entities';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Edit, Trash2, FileText, Upload, Loader2, Download, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUserRole } from '../components/utils/getUserRole';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const MaterialForm = ({ material, setMaterial, onFileSelect, uploadingFile, uploadedFileUrl }) => {
  const safeMaterial = material || {
    title: '',
    description: '',
    material_type: 'document',
    file_url: '',
    order_index: 0,
    is_downloadable: true,
    is_required: false
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Material Title"
        value={safeMaterial.title || ''}
        onChange={(e) => setMaterial({...safeMaterial, title: e.target.value})}
      />
      
      <Textarea
        placeholder="Description"
        value={safeMaterial.description || ''}
        onChange={(e) => setMaterial({...safeMaterial, description: e.target.value})}
      />

      <Select
        value={safeMaterial.material_type || 'document'}
        onValueChange={(value) => setMaterial({...safeMaterial, material_type: value})}
      >
        <SelectTrigger>
          <SelectValue placeholder="Material Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">PDF Document</SelectItem>
          <SelectItem value="document">Document</SelectItem>
          <SelectItem value="slide">Presentation/Slides</SelectItem>
          <SelectItem value="link">External Link</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload File or Enter URL
        </label>
        
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            onChange={onFileSelect}
            disabled={uploadingFile}
            className="flex-1"
          />
          {uploadingFile && (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <Input
          placeholder="File URL or External Link"
          value={safeMaterial.file_url || ''}
          onChange={(e) => setMaterial({...safeMaterial, file_url: e.target.value})}
        />
      </div>

      <Input
        type="number"
        placeholder="Order Index"
        value={safeMaterial.order_index === '' ? '' : safeMaterial.order_index}
        onChange={(e) => setMaterial({...safeMaterial, order_index: Number(e.target.value)})}
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_downloadable"
          checked={safeMaterial.is_downloadable || false}
          onCheckedChange={(checked) => setMaterial({...safeMaterial, is_downloadable: checked})}
        />
        <Label htmlFor="is_downloadable" className="text-sm font-medium cursor-pointer">
          Allow students to download this material
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_required"
          checked={safeMaterial.is_required || false}
          onCheckedChange={(checked) => setMaterial({...safeMaterial, is_required: checked})}
        />
        <Label htmlFor="is_required" className="text-sm font-medium cursor-pointer">
          Mark as required reading/material
        </Label>
      </div>
    </div>
  );
};

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [preselectedSectionId, setPreselectedSectionId] = useState(null);

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

      const [allMaterials, allCourses, allModules, allSections] = await Promise.all([
        LearningMaterial.list('order_index'),
        Course.list(),
        Module.list(),
        Section.list()
      ]);
      
      setMaterials(allMaterials);
      setCourses(allCourses);
      setModules(allModules);
      setSections(allSections);

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadedFileUrl(null);

    try {
      const result = await UploadFile({ file });
      const fileUrl = result.file_url;

      setUploadedFileUrl(fileUrl);
      setEditingMaterial(prev => ({
        ...(prev || {}),
        file_url: fileUrl
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!editingMaterial || !editingMaterial.file_url) {
      alert("Please provide a file URL or upload a file");
      return;
    }

    try {
      const materialData = {
        ...editingMaterial,
        order_index: editingMaterial.order_index === '' || editingMaterial.order_index === null ? 0 : Number(editingMaterial.order_index),
        section_id: editingMaterial.section_id === '' ? null : editingMaterial.section_id,
        module_id: editingMaterial.module_id === '' ? null : editingMaterial.module_id
      };

      if (editingMaterial.id) {
        await LearningMaterial.update(editingMaterial.id, materialData);
      } else {
        await LearningMaterial.create(materialData);
      }
      
      await loadData();
      setIsModalOpen(false);
      setEditingMaterial(null);
      setUploadedFileUrl(null);
      setPreselectedSectionId(null);
    } catch (error) {
      console.error("Error saving material:", error);
      alert("Failed to save material. Please check all required fields.");
    }
  };

  const handleDelete = async () => {
    if (!editingMaterial) return;
    
    try {
      await LearningMaterial.delete(editingMaterial.id);
      await loadData();
      setIsDeleteModalOpen(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  const openAddModal = () => {
    setEditingMaterial({
      title: '',
      description: '',
      material_type: 'document',
      file_url: '',
      course_id: '',
      section_id: preselectedSectionId || null,
      order_index: 0,
      is_downloadable: true,
      is_required: false
    });
    setUploadedFileUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (material) => {
    setEditingMaterial({...material});
    setUploadedFileUrl(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (material) => {
    setEditingMaterial({...material});
    setIsDeleteModalOpen(true);
  };

  const getCourseTitle = (courseId) => courses.find(c => c.id === courseId)?.title || 'N/A';
  const getSectionTitle = (sectionId) => sections.find(s => s.id === sectionId)?.title || 'None';

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'link': return <ExternalLink className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Materials</h1>
            <p className="text-gray-600 mt-1">Manage course documents, PDFs, and learning resources</p>
          </div>
          <Button onClick={openAddModal}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add Material
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading materials...</TableCell>
                </TableRow>
              ) : materials.length > 0 ? (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMaterialIcon(material.material_type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{material.title}</TableCell>
                    <TableCell>{getCourseTitle(material.course_id)}</TableCell>
                    <TableCell>{getSectionTitle(material.section_id)}</TableCell>
                    <TableCell>{material.order_index}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(material.file_url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(material)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => openDeleteModal(material)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">No materials found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaterial?.id ? 'Edit' : 'Add'} Learning Material</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Select
              value={editingMaterial?.course_id || ''}
              onValueChange={(value) => setEditingMaterial({...editingMaterial, course_id: value})}
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

            <Select
              value={editingMaterial?.section_id || ''}
              onValueChange={(value) => setEditingMaterial({...editingMaterial, section_id: value === 'null' ? null : value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Section (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Section</SelectItem>
                {sections
                  .filter(s => s.section_type === 'materials' || s.section_type === 'other')
                  .map(section => (
                    <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <MaterialForm
              material={editingMaterial}
              setMaterial={setEditingMaterial}
              onFileSelect={handleFileSelect}
              uploadingFile={uploadingFile}
              uploadedFileUrl={uploadedFileUrl}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              setEditingMaterial(null);
              setUploadedFileUrl(null);
              setPreselectedSectionId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={uploadingFile}>
              {uploadingFile ? 'Uploading...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Learning Material</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete "{editingMaterial?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}