
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, UserPlus, Users, Search, Trash2, Edit, AlertCircle, ExternalLink, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import LoadingScreen from '../components/shared/LoadingScreen';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await User.list('-created_date');
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    try {
      await User.delete(editingUser.id);
      await loadUsers();
      setIsDeleteModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleAssignPhase = async () => {
    if (!editingUser) return;
    
    try {
      await User.update(editingUser.id, {
        assigned_phase: selectedPhase || null
      });
      await loadUsers();
      setIsPhaseModalOpen(false);
      setEditingUser(null);
      setSelectedPhase('');
    } catch (error) {
      console.error("Error assigning phase:", error);
      alert("Failed to assign phase. Please try again.");
    }
  };

  const getUserRole = (user) => {
    return user.user_type || user.role || 'student';
  };

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const userRole = getUserRole(user);
      const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.student_id_number?.includes(searchTerm);
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;
      return matchesSearch && matchesRole;
    });

    if (activeTab !== 'all') {
      filtered = filtered.filter(user => getUserRole(user) === activeTab);
    }

    return filtered;
  }, [users, searchTerm, roleFilter, activeTab]);

  const openDeleteModal = (user) => {
    setEditingUser(user);
    setIsDeleteModalOpen(true);
  };

  const openPhaseModal = (user) => {
    setEditingUser(user);
    setSelectedPhase(user.assigned_phase || '');
    setIsPhaseModalOpen(true);
  };

  const getUsersByRole = (role) => users.filter(u => getUserRole(u) === role);

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

  if (loading) {
    return <LoadingScreen message="Loading users..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">User Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage all users and assign learning phases</p>
          </div>
        </div>

        <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
          <AlertCircle className="h-4 w-4 !text-blue-800" />
          <AlertTitle>Phase Assignment</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Assign students to phases to control which courses they can access:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Phase 1:</strong> Beginner level courses</li>
              <li><strong>Phase 2:</strong> Intermediate level courses</li>
              <li><strong>Phase 3:</strong> Advanced level courses</li>
              <li>Students can only view and access courses from their assigned phase</li>
              <li>Use the "Assign Phase" button next to each student to set their phase</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{getUsersByRole('student').length}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-900">{getUsersByRole('teacher').length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Admins</p>
                <p className="text-3xl font-bold text-gray-900">{getUsersByRole('admin').length}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4 bg-white/20 backdrop-blur-sm">
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  All Users ({users.length})
                </TabsTrigger>
                <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Students ({getUsersByRole('student').length})
                </TabsTrigger>
                <TabsTrigger value="teacher" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Teachers ({getUsersByRole('teacher').length})
                </TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Admins ({getUsersByRole('admin').length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 flex items-center space-x-4 border-b border-gray-200">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="Search by name, email, or ID number..."
                  className="pl-10 border-2 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] border-2">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <TabsContent value={activeTab} className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-teal-50 border-b-2 border-blue-200">
                      <TableHead className="font-bold text-gray-900">User</TableHead>
                      <TableHead className="font-bold text-gray-900">ID Number</TableHead>
                      <TableHead className="font-bold text-gray-900">Email</TableHead>
                      <TableHead className="font-bold text-gray-900">Role</TableHead>
                      <TableHead className="font-bold text-gray-900">Assigned Phase</TableHead>
                      <TableHead className="font-bold text-gray-900">Joined</TableHead>
                      <TableHead className="text-right font-bold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10">Loading users...</TableCell></TableRow>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => {
                        const userRole = getUserRole(user);
                        return (
                          <TableRow key={user.id} className="hover:bg-blue-50 transition-colors">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                {user.profile_photo_url ? (
                                  <img src={user.profile_photo_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                                    <span className="font-medium text-white">{user.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{user.full_name || 'Unnamed User'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.student_id_number || '-'}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                userRole === 'admin' ? 'bg-purple-100 text-purple-700' :
                                userRole === 'teacher' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {userRole}
                              </span>
                            </TableCell>
                            <TableCell>
                              {userRole === 'student' ? (
                                user.assigned_phase ? (
                                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPhaseColor(user.assigned_phase)}`}>
                                    {getPhaseName(user.assigned_phase)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">Not assigned</span>
                                )
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>{format(new Date(user.created_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  {userRole === 'student' && (
                                    <>
                                      <DropdownMenuItem onClick={() => openPhaseModal(user)}>
                                        <Layers className="w-4 h-4 mr-2" /> Assign Phase
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem disabled className="text-gray-400">
                                    <Edit className="w-4 h-4 mr-2" /> Edit Role (Use Dashboard)
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => openDeleteModal(user)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow><TableCell colSpan={7} className="text-center py-10">No users found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Assign Phase Modal */}
      <Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Assign Learning Phase</DialogTitle>
            <DialogDescription>
              Assign {editingUser?.full_name} to a specific learning phase. Students will only see courses from their assigned phase.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="phase-select" className="text-base font-semibold mb-3 block">
              Select Phase
            </Label>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger id="phase-select" className="border-2">
                <SelectValue placeholder="Choose a phase..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    No Phase (Remove Assignment)
                  </div>
                </SelectItem>
                <SelectItem value="phase1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Phase 1 - Beginner Level
                  </div>
                </SelectItem>
                <SelectItem value="phase2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Phase 2 - Intermediate Level
                  </div>
                </SelectItem>
                <SelectItem value="phase3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    Phase 3 - Advanced Level
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-3">
              This determines which courses the student can access. Only courses matching their assigned phase will be visible.
            </p>
            
            {editingUser?.assigned_phase && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Current Phase:</strong> {getPhaseName(editingUser.assigned_phase)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhaseModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAssignPhase}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              Assign Phase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {editingUser?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
