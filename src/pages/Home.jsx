import React, { useEffect, useState } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { getUserRole } from "../components/utils/getUserRole";

export default function Home() {
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          window.location.href = createPageUrl("LandingPage");
          return;
        }

        const user = await base44.auth.me();
        const userRole = getUserRole(user);
        
        // Direct redirect based on user type - no intermediate states
        if (userRole === 'admin') {
          window.location.href = createPageUrl("AdminDashboard");
        } else if (userRole === 'teacher') {
          window.location.href = createPageUrl("TeacherDashboard");
        } else if (userRole === 'student') {
          if (user.subscription_tier && user.subscription_status === 'active') {
            window.location.href = createPageUrl("StudentDashboard");
          } else {
            window.location.href = createPageUrl("LandingPage");
          }
        } else {
          // New user without classification - stay on landing page
          window.location.href = createPageUrl("LandingPage");
        }
      } catch (error) {
        console.error("Error in home redirect:", error);
        window.location.href = createPageUrl("LandingPage");
      }
    };

    checkAndRedirect();
  }, []);

  // Show minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-xl text-gray-700">Redirecting...</p>
      </div>
    </div>
  );
}