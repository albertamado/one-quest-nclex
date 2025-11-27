import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { UserCircle, Mail, Calendar, Edit3, Save, X, Upload, Camera, AlertCircle, School, Award, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function StudentProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setEditedUser(user);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_photo_url: file_url });
      setCurrentUser({ ...currentUser, profile_photo_url: file_url });
      setEditedUser({ ...editedUser, profile_photo_url: file_url });
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: editedUser.full_name,
        phone: editedUser.phone,
        bio: editedUser.bio,
        address: editedUser.address,
        school_graduated: editedUser.school_graduated,
        has_att_permit: editedUser.has_att_permit,
        att_permit_date: editedUser.has_att_permit && !editedUser.att_permit_date 
          ? new Date().toISOString().split('T')[0] 
          : editedUser.att_permit_date
      });
      setCurrentUser(editedUser);
      setIsEditing(false);
      await loadUserData(); // Reload to get updated data
    } catch (error) {
      console.error("Error updating profile:", error);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditedUser(currentUser);
    setIsEditing(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {currentUser?.profile_photo_url ? (
                    <img 
                      src={currentUser.profile_photo_url} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {currentUser?.full_name?.[0]?.toUpperCase() || 'S'}
                      </span>
                    </div>
                  )}
                  <label 
                    htmlFor="photo-upload" 
                    className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    {uploadingPhoto ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentUser?.full_name || 'Student'}
                  </h2>
                  <p className="text-gray-500 capitalize">{currentUser?.role}</p>
                  {currentUser?.student_id_number && (
                    <p className="text-sm text-gray-400">ID: {currentUser.student_id_number}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-400">
                      Joined {format(new Date(currentUser?.created_date), 'MMMM yyyy')}
                    </p>
                    {currentUser?.has_att_permit && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <Award className="w-3 h-3" />
                        ATT Eligible
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* ATT Permit Badge */}
          {currentUser?.has_att_permit && (
            <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      ATT Authorization Eligible
                    </h3>
                    <p className="text-sm text-green-700">
                      You are authorized to take the NCLEX examination
                    </p>
                    {currentUser.att_permit_date && (
                      <p className="text-xs text-green-600 mt-1">
                        Verified on: {format(new Date(currentUser.att_permit_date), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editedUser.full_name || ''}
                      onChange={(e) => setEditedUser({...editedUser, full_name: e.target.value})}
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser?.full_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{currentUser?.email}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editedUser.phone || ''}
                      onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser?.phone || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <School className="w-4 h-4" />
                    School/University Graduated
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editedUser.school_graduated || ''}
                      onChange={(e) => setEditedUser({...editedUser, school_graduated: e.target.value})}
                      placeholder="Enter your school"
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser?.school_graduated || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <Textarea
                      rows={4}
                      value={editedUser.bio || ''}
                      onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser?.bio || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {isEditing ? (
                    <Textarea
                      rows={3}
                      value={editedUser.address || ''}
                      onChange={(e) => setEditedUser({...editedUser, address: e.target.value})}
                      placeholder="Enter your address..."
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser?.address || 'Not set'}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                    <Checkbox
                      id="att-permit-edit"
                      checked={editedUser.has_att_permit || false}
                      onCheckedChange={(checked) => setEditedUser({...editedUser, has_att_permit: checked})}
                    />
                    <Label htmlFor="att-permit-edit" className="cursor-pointer flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>I have ATT authorization</span>
                    </Label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">
                      {format(new Date(currentUser?.created_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Password Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Password Management</h4>
              <p className="text-sm text-blue-700">
                Authentication and password management are handled securely by One Quest Developer. 
                To change your password or reset it, please use the authentication options provided during login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}