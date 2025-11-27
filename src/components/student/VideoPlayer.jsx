import React, { useState, useEffect, useRef } from "react";
import { base44 } from '@/api/base44Client';
import { CheckCircle, PlayCircle, AlertCircle, Lock } from "lucide-react";

export default function VideoPlayer({ video, student, courseId, onProgress }) {
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const lastSavedTimeRef = useRef(0);

  useEffect(() => {
    checkCompletion();
    loadProgress();
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [video.id, student.id]);

  const checkCompletion = async () => {
    try {
      const progress = await base44.entities.StudentProgress.filter({
        student_id: student.id,
        video_id: video.id,
        progress_type: 'video_completed'
      });
      setHasCompleted(progress.length > 0);
    } catch (error) {
      console.error("Error checking completion:", error);
      setHasCompleted(false);
    }
  };

  const loadProgress = async () => {
    try {
      const progress = await base44.entities.StudentProgress.filter({
        student_id: student.id,
        video_id: video.id
      });
      
      if (progress.length > 0) {
        const latestProgress = progress[progress.length - 1];
        if (latestProgress.watch_time_seconds) {
          setCurrentTime(latestProgress.watch_time_seconds);
          if (videoRef.current && !hasCompleted) {
            videoRef.current.currentTime = latestProgress.watch_time_seconds;
          }
        }
        if (latestProgress.completion_percentage) {
          setWatchProgress(latestProgress.completion_percentage);
        }
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const saveProgress = async (currentTime, duration) => {
    if (hasCompleted || !duration) return;
    
    const progress = Math.min(Math.round((currentTime / duration) * 100), 100);
    
    try {
      const existingProgress = await base44.entities.StudentProgress.filter({
        student_id: student.id,
        video_id: video.id,
        progress_type: 'video_watched'
      });

      const progressData = {
        student_id: student.id,
        course_id: courseId,
        video_id: video.id,
        progress_type: 'video_watched',
        completion_percentage: progress,
        watch_time_seconds: Math.floor(currentTime),
        video_duration_seconds: Math.floor(duration)
      };

      if (existingProgress.length > 0) {
        await base44.entities.StudentProgress.update(existingProgress[0].id, progressData);
      } else {
        await base44.entities.StudentProgress.create(progressData);
      }
      
      setWatchProgress(progress);
      lastSavedTimeRef.current = currentTime;
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const markAsCompleted = async () => {
    if (hasCompleted) return;
    
    try {
      await base44.entities.StudentProgress.create({
        student_id: student.id,
        course_id: courseId,
        video_id: video.id,
        progress_type: 'video_completed',
        completion_percentage: 100,
        completed_at: new Date().toISOString()
      });
      
      setHasCompleted(true);
      setWatchProgress(100);
      if (onProgress) {
        await onProgress();
      }
    } catch (error) {
      console.error("Error marking video as completed:", error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    setCurrentTime(current);
    
    // Save progress every 5 seconds
    if (Math.abs(current - lastSavedTimeRef.current) >= 5) {
      saveProgress(current, duration);
    }
    
    // Check if video is near completion (95% watched)
    if (duration && current / duration >= 0.95 && !hasCompleted) {
      markAsCompleted();
    }
  };

  const handleSeeking = (e) => {
    if (hasCompleted) return; // Allow seeking if video is completed
    
    const video = videoRef.current;
    if (!video) return;
    
    // Prevent seeking beyond current progress
    const maxAllowedTime = (watchProgress / 100) * video.duration + 5; // Allow 5 seconds ahead
    
    if (video.currentTime > maxAllowedTime) {
      video.currentTime = Math.min(maxAllowedTime, currentTime);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&cc_load_policy=1`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&cc_load_policy=1`;
    }

    // Google Drive
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/[-\w]{25,}/)?.[0];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url;
    }

    return url;
  };

  const embedUrl = getEmbedUrl(video.video_url);
  const isDirect = video.video_url?.match(/\.(mp4|webm|ogg)$/i);
  const progressDegrees = (watchProgress / 100) * 360;

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
        {isDirect ? (
          <video
            ref={videoRef}
            src={embedUrl}
            controls
            controlsList="nodownload"
            className="w-full h-full"
            onEnded={markAsCompleted}
            onLoadedData={() => setIsLoading(false)}
            onTimeUpdate={handleTimeUpdate}
            onSeeking={handleSeeking}
            onError={() => {
              setVideoError(true);
              setIsLoading(false);
            }}
          >
            {video.caption_url && (
              <track
                label="English"
                kind="subtitles"
                srcLang="en"
                src={video.caption_url}
                default
              />
            )}
          </video>
        ) : (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-presentation allow-forms"
            onLoad={() => {
              setIsLoading(false);
              // Auto mark as completed after reasonable watch time for embedded videos
              setTimeout(() => {
                if (!hasCompleted) {
                  markAsCompleted();
                }
              }, 30000); // 30 seconds
            }}
            onError={() => {
              setVideoError(true);
              setIsLoading(false);
            }}
          />
        )}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 bg-black">
            <AlertCircle className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Video</h3>
            <p className="text-gray-300 text-center mb-4">
              The video could not be loaded. This might be due to privacy settings or an invalid link.
            </p>
            <a 
              href={video.video_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Open video in new tab
            </a>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{video.title}</h2>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            {/* Circular progress indicator */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke={hasCompleted ? "#10b981" : "#3b82f6"}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(progressDegrees / 360) * 176} 176`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {hasCompleted ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <span className="text-sm font-bold text-blue-600">{Math.round(watchProgress)}%</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {video.description && (
          <div className="prose max-w-none">
            <p className="text-gray-700">{video.description}</p>
          </div>
        )}
        
        {!hasCompleted && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Watch the entire video to unlock the next lesson. Fast forwarding is disabled to ensure complete learning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}