import React from "react";
import { Clock, Calendar } from "lucide-react";

export default function WelcomeCard({ user }) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl shadow-lg text-white mb-8">
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {greeting}, {user?.full_name || 'Student'}! 👋
            </h1>
            <p className="text-blue-100 mb-4">
              Ready to continue your NCLEX preparation journey?
            </p>
            <div className="flex items-center text-blue-100">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">{currentDate}</span>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">98%</div>
              <div className="text-sm text-blue-100">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}