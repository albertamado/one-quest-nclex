

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { getUserRole } from "./components/utils/getUserRole";
import NotificationBell from "./components/layout/NotificationBell";
import {
  BookOpen,
  Users,
  Phone,
  Menu,
  X,
  GraduationCap,
  PlayCircle,
  FileText,
  BarChart3,
  LogOut,
  Calendar as CalendarIcon,
  MessageSquare,
  Folder,
  MessageCircle,
  Award,
  Shield,
  Crown,
  Tag
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasEnrollments, setHasEnrollments] = useState(false);
  
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolData, setSchoolData] = useState({
    school_graduated: "",
    has_att_permit: false
  });
  const [schoolError, setSchoolError] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Only show school modal for students without school info
      if (user && !user.school_graduated && getUserRole(user) === 'student') {
        setShowSchoolModal(true);
        setSchoolData({
          school_graduated: user.school_graduated || "",
          has_att_permit: user.has_att_permit || false
        });
        setLoading(false);
        return;
      }
      
      if (getUserRole(user) === 'student') {
        const enrollments = await base44.entities.Enrollment.filter({ student_id: user.id });
        setHasEnrollments(enrollments.length > 0);
      } else {
        setHasEnrollments(true);
      }
    } catch (error) {
      setCurrentUser(null);
      setHasEnrollments(false);
    }
    setLoading(false);
  };

  const handleSaveSchoolInfo = async () => {
    if (!schoolData.school_graduated.trim()) {
      setSchoolError("Please enter your school/university");
      return;
    }

    setSchoolError("");
    try {
      await base44.auth.updateMe({
        school_graduated: schoolData.school_graduated,
        has_att_permit: schoolData.has_att_permit,
        att_permit_date: schoolData.has_att_permit ? new Date().toISOString().split('T')[0] : null
      });
      
      // Close modal and reload
      setShowSchoolModal(false);
      window.location.reload(); 
    } catch (error) {
      console.error("Error saving school info:", error);
      setSchoolError("Failed to save information. Please try again.");
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout(createPageUrl("LandingPage"));
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    base44.auth.redirectToLogin(window.location.href);
  };

  const getNavigationItems = () => {
    const userRole = getUserRole(currentUser);
    
    if (!currentUser || !userRole || (userRole === 'student' && !hasEnrollments)) {
      return [
        { name: "Home", url: createPageUrl("LandingPage"), icon: GraduationCap },
        { name: "About Us", url: createPageUrl("About"), icon: Users },
        { name: "Courses Offered", url: createPageUrl("Programs"), icon: BookOpen },
        { name: "Instructors", url: createPageUrl("Instructors"), icon: Users },
        { name: "Testimonials", url: createPageUrl("Testimonials"), icon: MessageCircle },
        { name: "Contact", url: createPageUrl("Contact"), icon: Phone },
      ];
    }

    if (userRole === 'student' && !currentUser?.subscription_tier) {
      return [
        { name: "Home", url: createPageUrl("LandingPage"), icon: GraduationCap },
        { name: "About Us", url: createPageUrl("About"), icon: Users },
        { name: "Courses Offered", url: createPageUrl("Programs"), icon: BookOpen },
        { name: "Instructors", url: createPageUrl("Instructors"), icon: Users },
        { name: "Testimonials", url: createPageUrl("Testimonials"), icon: MessageCircle },
        { name: "Contact", url: createPageUrl("Contact"), icon: Phone },
      ];
    }

    switch (userRole) {
      case 'admin':
        return [
          { name: "Dashboard", url: createPageUrl("AdminDashboard"), icon: BarChart3 },
          { name: "Courses", url: createPageUrl("AdminCourses"), icon: BookOpen },
          { name: "Modules", url: createPageUrl("AdminModules"), icon: Folder },
          { name: "Videos", url: createPageUrl("AdminVideos"), icon: PlayCircle },
          { name: "Quizzes", url: createPageUrl("AdminQuizzes"), icon: FileText },
          { name: "Materials", url: createPageUrl("AdminMaterials"), icon: FileText },
          { name: "Users", url: createPageUrl("AdminUsers"), icon: Users },
          { name: "Instructors", url: createPageUrl("AdminInstructors"), icon: Users },
          { name: "Enrollment Requests", url: createPageUrl("AdminEnrollmentRequests"), icon: Award },
          { name: "Assessments", url: createPageUrl("AdminAssessments"), icon: FileText },
          { name: "Categories", url: createPageUrl("AdminCategories"), icon: Tag },
          { name: "Performance", url: createPageUrl("StudentPerformance"), icon: BarChart3 },
          { name: "Calendar", url: createPageUrl("Calendar"), icon: CalendarIcon },
          { name: "Messages", url: createPageUrl("Messages"), icon: MessageSquare },
        ];
      case 'teacher':
        return [
          { name: "Dashboard", url: createPageUrl("TeacherDashboard"), icon: BarChart3 },
          { name: "My Courses", url: createPageUrl("TeacherCourses"), icon: BookOpen },
          { name: "Instructors", url: createPageUrl("Instructors"), icon: Users },
          { name: "Performance", url: createPageUrl("StudentPerformance"), icon: BarChart3 },
          { name: "Calendar", url: createPageUrl("Calendar"), icon: CalendarIcon },
          { name: "Messages", url: createPageUrl("Messages"), icon: MessageSquare },
        ];
      default:
        return [
          { name: "Dashboard", url: createPageUrl("StudentDashboard"), icon: BarChart3 },
          { name: "My Courses", url: createPageUrl("StudentCourses"), icon: BookOpen },
          { name: "Instructors", url: createPageUrl("Instructors"), icon: Users },
          { name: "Performance", url: createPageUrl("StudentPerformance"), icon: BarChart3 },
          { name: "Calendar", url: createPageUrl("Calendar"), icon: CalendarIcon },
          { name: "Messages", url: createPageUrl("Messages"), icon: MessageSquare },
        ];
    }
  };

  const isActiveRoute = (url) => {
    if (url === createPageUrl("AdminDashboard") && (location.pathname === '/' || location.pathname === createPageUrl("AdminDashboard"))) {
      return true;
    }
    if (url === createPageUrl("TeacherDashboard") && (location.pathname === '/' || location.pathname === createPageUrl("TeacherDashboard"))) {
      return true;
    }
    if (url === createPageUrl("StudentDashboard") && (location.pathname === '/' || location.pathname === createPageUrl("StudentDashboard"))) {
      return true;
    }
    if (url === createPageUrl("LandingPage") && (location.pathname === '/' || location.pathname === createPageUrl("LandingPage"))) {
      return true;
    }
    return location.pathname === url;
  };

  const getSubscriptionIcon = (tier) => {
    switch (tier) {
      case 'premium': return Crown;
      case 'standard': return Shield;
      case 'basic': return Award;
      default: return null;
    }
  };

  const SubscriptionIcon = getSubscriptionIcon(currentUser?.subscription_tier);
  const userRole = getUserRole(currentUser);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Only show school modal for students without school info */}
      <Dialog open={showSchoolModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Complete Your Profile</DialogTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Please provide the following information to continue
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {schoolError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {schoolError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school" className="text-base font-semibold">
                  School/University Graduated *
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="school"
                    type="text"
                    placeholder="e.g., University of California"
                    value={schoolData.school_graduated}
                    onChange={(e) => setSchoolData({...schoolData, school_graduated: e.target.value})}
                    className="pl-10 text-base"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter the name of the school or university where you graduated
                </p>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="att-permit-modal"
                  checked={schoolData.has_att_permit}
                  onCheckedChange={(checked) => setSchoolData({...schoolData, has_att_permit: checked})}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="att-permit-modal"
                    className="text-sm font-medium leading-none cursor-pointer flex items-center"
                  >
                    <Award className="w-4 h-4 mr-2 text-blue-600" />
                    I have authorization to take the ATT (Authorization to Test)
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Check this if you already have your Authorization to Test permit for NCLEX
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This information is required to access the platform. You can update it later in your profile settings.
              </p>
            </div>

            <Button 
              onClick={handleSaveSchoolInfo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 mt-6"
              size="lg"
            >
              Save & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <Link 
              to={userRole === 'teacher' ? createPageUrl("LandingPage") : createPageUrl("LandingPage")} 
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">One Quest</h1>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-2">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.url}
                  className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 border-b-2 ${
                    isActiveRoute(item.url)
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 border-transparent'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {currentUser && (
                <NotificationBell currentUser={currentUser} />
              )}
              
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium text-gray-900">{currentUser.full_name || currentUser.email}</p>
                        {getUserRole(currentUser) === 'teacher' && (
                          <div className="px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md flex items-center gap-1">
                            <Shield className="w-3 h-3 text-white" />
                            <span className="text-xs font-bold text-white">TEACHER</span>
                          </div>
                        )}
                        {SubscriptionIcon && getUserRole(currentUser) === 'student' && (
                          <SubscriptionIcon className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{currentUser.email}</p>
                    </div>
                  </div>
                  <Link to={createPageUrl("StudentProfile")}>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors">
                      <span className="text-base font-medium text-blue-600">
                        {(currentUser.full_name || currentUser.email)?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden md:block p-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-md text-base"
                >
                  Log In
                </button>
              )}

              <button
                className="md:hidden p-2.5 rounded-lg text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {currentUser && (
                <div className="pb-4 mb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-900">{currentUser.full_name || currentUser.email}</p>
                    {getUserRole(currentUser) === 'teacher' && (
                      <div className="px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md flex items-center gap-1">
                        <Shield className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">TEACHER</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                </div>
              )}
              
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.url}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActiveRoute(item.url)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              {!currentUser && (
                <button
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleLoginClick(e);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50 w-full text-left"
                >
                  <GraduationCap className="w-5 h-5" />
                  Log In
                </button>
              )}
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

