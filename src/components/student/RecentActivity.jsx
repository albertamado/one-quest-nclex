import React from "react";
import { PlayCircle, FileText, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity({ progress }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'video_watched':
      case 'video_completed':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'quiz_started':
      case 'quiz_completed':
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityText = (activity) => {
    switch (activity.progress_type) {
      case 'video_watched':
        return 'Started watching video';
      case 'video_completed':
        return 'Completed video';
      case 'quiz_started':
        return 'Started quiz';
      case 'quiz_completed':
        return 'Completed quiz';
      default:
        return 'Activity';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
      </div>
      <div className="p-6">
        {progress.length > 0 ? (
          <div className="space-y-4">
            {progress.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.progress_type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getActivityText(activity)}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  {activity.time_spent_minutes && (
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.time_spent_minutes} minutes
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Start a course to see your progress here</p>
          </div>
        )}
      </div>
    </div>
  );
}