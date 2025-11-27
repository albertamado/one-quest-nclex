import React from "react";
import { TrendingUp, Target, Award } from "lucide-react";

export default function ProgressOverview({ enrollments }) {
  const totalProgress = enrollments.length > 0 
    ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length
    : 0;

  const completedCourses = enrollments.filter(e => e.progress_percentage >= 100).length;
  const inProgressCourses = enrollments.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Progress Overview</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(totalProgress)}%
            </div>
            <div className="text-sm text-gray-500">Overall Progress</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {completedCourses}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {inProgressCourses}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
        </div>

        {/* Progress Bars for Active Courses */}
        {inProgressCourses > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Active Courses</h3>
            <div className="space-y-3">
              {enrollments
                .filter(e => e.progress_percentage > 0 && e.progress_percentage < 100)
                .slice(0, 3)
                .map((enrollment, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Course {index + 1}</span>
                      <span className="text-gray-500">{enrollment.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}