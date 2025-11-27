import Layout from "./Layout.jsx";

import Home from "./Home";

import Programs from "./Programs";

import About from "./About";

import Contact from "./Contact";

import StudentDashboard from "./StudentDashboard";

import StudentCourse from "./StudentCourse";

import StudentCourses from "./StudentCourses";

import StudentProgress from "./StudentProgress";

import StudentProfile from "./StudentProfile";

import TeacherDashboard from "./TeacherDashboard";

import AdminDashboard from "./AdminDashboard";

import AdminUsers from "./AdminUsers";

import AdminAnalytics from "./AdminAnalytics";

import AdminVideos from "./AdminVideos";

import AdminCourses from "./AdminCourses";

import AdminQuizzes from "./AdminQuizzes";

import TeacherCourses from "./TeacherCourses";

import TeacherQuizzes from "./TeacherQuizzes";

import TeacherAnalytics from "./TeacherAnalytics";

import AdminCourseDetail from "./AdminCourseDetail";

import TeacherCourseDetail from "./TeacherCourseDetail";

import Instructors from "./Instructors";

import Calendar from "./Calendar";

import Messages from "./Messages";

import QuizPreview from "./QuizPreview";

import StudentPerformance from "./StudentPerformance";

import AdminModules from "./AdminModules";

import AdminMaterials from "./AdminMaterials";

import LandingPage from "./LandingPage";

import Testimonials from "./Testimonials";

import AdminEnrollments from "./AdminEnrollments";

import AdminEnrollmentRequests from "./AdminEnrollmentRequests";

import AdminInstructors from "./AdminInstructors";

import AdminAssessments from "./AdminAssessments";

import AssessmentSummary from "./AssessmentSummary";

import AssessmentExam from "./AssessmentExam";

import AdminCategories from "./AdminCategories";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Programs: Programs,
    
    About: About,
    
    Contact: Contact,
    
    StudentDashboard: StudentDashboard,
    
    StudentCourse: StudentCourse,
    
    StudentCourses: StudentCourses,
    
    StudentProgress: StudentProgress,
    
    StudentProfile: StudentProfile,
    
    TeacherDashboard: TeacherDashboard,
    
    AdminDashboard: AdminDashboard,
    
    AdminUsers: AdminUsers,
    
    AdminAnalytics: AdminAnalytics,
    
    AdminVideos: AdminVideos,
    
    AdminCourses: AdminCourses,
    
    AdminQuizzes: AdminQuizzes,
    
    TeacherCourses: TeacherCourses,
    
    TeacherQuizzes: TeacherQuizzes,
    
    TeacherAnalytics: TeacherAnalytics,
    
    AdminCourseDetail: AdminCourseDetail,
    
    TeacherCourseDetail: TeacherCourseDetail,
    
    Instructors: Instructors,
    
    Calendar: Calendar,
    
    Messages: Messages,
    
    QuizPreview: QuizPreview,
    
    StudentPerformance: StudentPerformance,
    
    AdminModules: AdminModules,
    
    AdminMaterials: AdminMaterials,
    
    LandingPage: LandingPage,
    
    Testimonials: Testimonials,
    
    AdminEnrollments: AdminEnrollments,
    
    AdminEnrollmentRequests: AdminEnrollmentRequests,
    
    AdminInstructors: AdminInstructors,
    
    AdminAssessments: AdminAssessments,
    
    AssessmentSummary: AssessmentSummary,
    
    AssessmentExam: AssessmentExam,
    
    AdminCategories: AdminCategories,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Programs" element={<Programs />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/StudentDashboard" element={<StudentDashboard />} />
                
                <Route path="/StudentCourse" element={<StudentCourse />} />
                
                <Route path="/StudentCourses" element={<StudentCourses />} />
                
                <Route path="/StudentProgress" element={<StudentProgress />} />
                
                <Route path="/StudentProfile" element={<StudentProfile />} />
                
                <Route path="/TeacherDashboard" element={<TeacherDashboard />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/AdminAnalytics" element={<AdminAnalytics />} />
                
                <Route path="/AdminVideos" element={<AdminVideos />} />
                
                <Route path="/AdminCourses" element={<AdminCourses />} />
                
                <Route path="/AdminQuizzes" element={<AdminQuizzes />} />
                
                <Route path="/TeacherCourses" element={<TeacherCourses />} />
                
                <Route path="/TeacherQuizzes" element={<TeacherQuizzes />} />
                
                <Route path="/TeacherAnalytics" element={<TeacherAnalytics />} />
                
                <Route path="/AdminCourseDetail" element={<AdminCourseDetail />} />
                
                <Route path="/TeacherCourseDetail" element={<TeacherCourseDetail />} />
                
                <Route path="/Instructors" element={<Instructors />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/QuizPreview" element={<QuizPreview />} />
                
                <Route path="/StudentPerformance" element={<StudentPerformance />} />
                
                <Route path="/AdminModules" element={<AdminModules />} />
                
                <Route path="/AdminMaterials" element={<AdminMaterials />} />
                
                <Route path="/LandingPage" element={<LandingPage />} />
                
                <Route path="/Testimonials" element={<Testimonials />} />
                
                <Route path="/AdminEnrollments" element={<AdminEnrollments />} />
                
                <Route path="/AdminEnrollmentRequests" element={<AdminEnrollmentRequests />} />
                
                <Route path="/AdminInstructors" element={<AdminInstructors />} />
                
                <Route path="/AdminAssessments" element={<AdminAssessments />} />
                
                <Route path="/AssessmentSummary" element={<AssessmentSummary />} />
                
                <Route path="/AssessmentExam" element={<AssessmentExam />} />
                
                <Route path="/AdminCategories" element={<AdminCategories />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}