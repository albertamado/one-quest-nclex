
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, PlusCircle, Edit, Trash2, MoreVertical, Award, GraduationCap, Mail, Phone, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getUserRole } from '../components/utils/getUserRole';

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (getUserRole(user) !== 'admin') {
        window.location.href = '/';
        return;
      }

      const allProfiles = await base44.entities.InstructorProfile.list('-created_date');
      setInstructors(allProfiles);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingInstructor || !editingInstructor.full_name || !editingInstructor.bio) {
      alert("Please fill in all required fields (Name and Bio)");
      return;
    }

    try {
      if (editingInstructor.id) {
        await base44.entities.InstructorProfile.update(editingInstructor.id, editingInstructor);
      } else {
        await base44.entities.InstructorProfile.create(editingInstructor);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingInstructor(null);
    } catch (error) {
      console.error("Error saving instructor:", error);
      alert("Failed to save instructor profile");
    }
  };

  const handleDelete = async () => {
    if (!instructorToDelete) return;
    
    try {
      await base44.entities.InstructorProfile.delete(instructorToDelete.id);
      await loadData();
      setIsDeleteModalOpen(false);
      setInstructorToDelete(null);
    } catch (error) {
      console.error("Error deleting instructor:", error);
      alert("Failed to delete instructor");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditingInstructor({ ...editingInstructor, profile_photo_url: file_url });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
    setUploadingImage(false);
  };

  const openAddModal = () => {
    setEditingInstructor({
      full_name: '',
      email: '',
      phone: '',
      bio: '',
      specialization: '',
      years_of_experience: 0,
      education: '',
      profile_photo_url: '',
      is_active: true,
      achievements: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (instructor) => {
    setEditingInstructor({...instructor});
    setIsModalOpen(true);
  };

  const openDeleteModal = (instructor) => {
    setInstructorToDelete(instructor);
    setIsDeleteModalOpen(true);
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructor Management</h1>
            <p className="text-gray-600 mt-2">Manage instructor profiles and information</p>
          </div>
          <Button onClick={openAddModal} className="bg-gradient-to-r from-[#0077B6] to-[#0096C7] hover:from-[#005f8f] hover:to-[#007ba3]">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Instructor
          </Button>
        </div>

        {instructors.length > 0 ? (
          <div className="space-y-6">
            {instructors.map((instructor) => (
              <div key={instructor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Instructor Photo */}
                  <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
                    <img
                      src={instructor.profile_photo_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face'}
                      alt={instructor.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Instructor Details */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{instructor.full_name}</h3>
                        <p className="text-lg text-blue-600 mb-3">{instructor.specialization || 'NCLEX Instructor'}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(instructor)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteModal(instructor)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-700 mb-4 text-justify leading-relaxed">
                      {instructor.bio}
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {instructor.education && (
                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Education</p>
                            <p className="text-sm text-gray-600">{instructor.education}</p>
                          </div>
                        </div>
                      )}
                      {instructor.years_of_experience > 0 && (
                        <div className="flex items-start gap-2">
                          <Briefcase className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Experience</p>
                            <p className="text-sm text-gray-600">{instructor.years_of_experience}+ years</p>
                          </div>
                        </div>
                      )}
                      {instructor.email && (
                        <div className="flex items-start gap-2">
                          <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Email</p>
                            <p className="text-sm text-gray-600">{instructor.email}</p>
                          </div>
                        </div>
                      )}
                      {instructor.phone && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Phone</p>
                            <p className="text-sm text-gray-600">{instructor.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Achievements */}
                    {instructor.achievements && instructor.achievements.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <p className="font-semibold text-gray-900">Achievements & Certifications</p>
                        </div>
                        <ul className="space-y-2">
                          {instructor.achievements.map((achievement, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-600 mt-1">✓</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mt-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        instructor.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {instructor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-gray-100">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No instructors found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first instructor profile</p>
            <Button onClick={openAddModal} className="bg-gradient-to-r from-[#0077B6] to-[#0096C7]">
              <PlusCircle className="w-4 h-4 mr-2" /> Add First Instructor
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInstructor?.id ? 'Edit Instructor' : 'Add New Instructor'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile_photo">Profile Photo</Label>
              <div className="flex items-center gap-4">
                {editingInstructor?.profile_photo_url && (
                  <img
                    src={editingInstructor.profile_photo_url}
                    alt="Preview"
                    className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="profile_photo_file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={editingInstructor?.full_name || ''}
                  onChange={(e) => setEditingInstructor({...editingInstructor, full_name: e.target.value})}
                  placeholder="Dr. John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={editingInstructor?.specialization || ''}
                  onChange={(e) => setEditingInstructor({...editingInstructor, specialization: e.target.value})}
                  placeholder="Medical-Surgical Nursing"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingInstructor?.email || ''}
                  onChange={(e) => setEditingInstructor({...editingInstructor, email: e.target.value})}
                  placeholder="instructor@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingInstructor?.phone || ''}
                  onChange={(e) => setEditingInstructor({...editingInstructor, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={editingInstructor?.bio || ''}
                onChange={(e) => setEditingInstructor({...editingInstructor, bio: e.target.value})}
                placeholder="Brief biography and teaching philosophy..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={editingInstructor?.education || ''}
                  onChange={(e) => setEditingInstructor({...editingInstructor, education: e.target.value})}
                  placeholder="MSN, RN, CCRN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  value={editingInstructor?.years_of_experience || 0}
                  onChange={(e) => setEditingInstructor({...editingInstructor, years_of_experience: parseInt(e.target.value) || 0})}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Achievements (one per line)</Label>
              <Textarea
                id="achievements"
                value={editingInstructor?.achievements?.join('\n') || ''}
                onChange={(e) => setEditingInstructor({
                  ...editingInstructor, 
                  achievements: e.target.value.split('\n').filter(a => a.trim())
                })}
                placeholder="NCLEX Expert - 98% pass rate&#10;Published author&#10;Former test item writer"
                rows={4}
              />
            </div>

            {/* Retaining is_active checkbox as it was present in the original code,
                even if not explicitly in the outline for the modal form. 
                It's a useful feature to control profile visibility. */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editingInstructor?.is_active !== false}
                onChange={(e) => setEditingInstructor({...editingInstructor, is_active: e.target.checked})}
                className="w-4 h-4 text-[#0077B6] border-gray-300 rounded focus:ring-[#0077B6]"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active Profile</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editingInstructor?.full_name || !editingInstructor?.bio} className="bg-gradient-to-r from-[#0077B6] to-[#0096C7]">
              {editingInstructor?.id ? 'Update' : 'Create'} Instructor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{instructorToDelete?.full_name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
