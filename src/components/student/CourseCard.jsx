import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, BookOpen, Award, PlayCircle } from "lucide-react";

export default function CourseCard({ course, enrollment, progress }) {
  return (
    <Link 
      to={createPageUrl(`StudentCourse?id=${course.id}`)}
      className="block group"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Course Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-teal-500 overflow-hidden">
          {course.cover_photo_url ? (
            <img 
              src={course.cover_photo_url} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white line-clamp-2">{course.title}</h3>
          </div>
        </div>

        {/* Course Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-blue-600">{enrollment?.progress_percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${enrollment?.progress_percentage || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <PlayCircle className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Videos</p>
              <p className="text-sm font-semibold text-gray-900">{progress?.videosCompleted || 0}/{progress?.totalVideos || 0}</p>
            </div>
            <div className="text-center">
              <Award className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Quizzes</p>
              <p className="text-sm font-semibold text-gray-900">{progress?.quizzesCompleted || 0}/{progress?.totalQuizzes || 0}</p>
            </div>
            <div className="text-center">
              <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Time</p>
              <p className="text-sm font-semibold text-gray-900">{course.duration_weeks || 0}w</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}