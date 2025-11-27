
import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Play, Lock, Trophy, Award, TrendingUp, Eye, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function QuizTaker({ quiz, student, onComplete, canTakeQuiz, missingVideos, accessInfo }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [showRationaleVideo, setShowRationaleVideo] = useState(false);
  const [hasExhaustedAttempts, setHasExhaustedAttempts] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [showPreviousAttempts, setShowPreviousAttempts] = useState(false);

  useEffect(() => {
    loadAttempts();
  }, [quiz.id, student.id]);

  useEffect(() => {
    if (quizStarted && !reviewMode && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, reviewMode, timeRemaining]);

  const loadAttempts = async () => {
    try {
      const allAttempts = await base44.entities.QuizAttempt.filter({
        student_id: student.id,
        quiz_id: quiz.id
      });
      
      // Sort by attempt number descending
      const sortedAttempts = allAttempts.sort((a, b) => b.attempt_number - a.attempt_number);
      setAttempts(sortedAttempts);
      
      const maxAttempts = quiz.max_attempts || 0;
      if (maxAttempts > 0 && allAttempts.length >= maxAttempts) {
        setHasExhaustedAttempts(true);
      }
    } catch (error) {
      console.error("Error loading attempts:", error);
    }
  };

  const startQuiz = () => {
    setAnswers(new Array(quiz.questions.length).fill(""));
    setTimeRemaining((quiz.time_limit_minutes || 30) * 60);
    setQuizStarted(true);
    setReviewMode(false);
    setCurrentQuestionIndex(0);
  };

  const startReviewMode = () => {
    // Load the last attempt's answers
    if (attempts.length > 0) {
      const lastAttempt = attempts[0];
      try {
        const parsedAnswers = lastAttempt.answers || [];
        setAnswers(parsedAnswers);
      } catch {
        setAnswers(new Array(quiz.questions.length).fill(""));
      }
    }
    setReviewMode(true);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
  };

  const getRemarks = (score) => {
    if (score >= 95) return { text: "Outstanding! 🌟", color: "text-purple-600", emoji: "🎉" };
    if (score >= 85) return { text: "Excellent Work! 👏", color: "text-green-600", emoji: "🎯" };
    if (score >= 75) return { text: "Great Job! 💪", color: "text-blue-600", emoji: "👍" };
    if (score >= quiz.passing_score) return { text: "Well Done! ✓", color: "text-teal-600", emoji: "✅" };
    if (score >= 50) return { text: "Keep Practicing 📚", color: "text-yellow-600", emoji: "💡" };
    return { text: "Need More Study 📖", color: "text-red-600", emoji: "📝" };
  };

  const handleAnswerSelect = (value) => {
    if (reviewMode) return; // Don't allow changes in review mode
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    
    setAnswers(prev => {
      const newAnswers = [...prev];
      
      if (currentQuestion.question_type === 'multiple_choice') {
        const currentAnswers = newAnswers[currentQuestionIndex] 
          ? JSON.parse(newAnswers[currentQuestionIndex]) 
          : [];
        
        if (currentQuestion.required_answers_count && currentQuestion.required_answers_count > 1) {
          const index = currentAnswers.indexOf(value);
          if (index > -1) {
            currentAnswers.splice(index, 1);
          } else {
            if (currentAnswers.length < currentQuestion.required_answers_count) {
              currentAnswers.push(value);
            }
          }
          newAnswers[currentQuestionIndex] = JSON.stringify(currentAnswers);
        } else {
          newAnswers[currentQuestionIndex] = JSON.stringify([value]);
        }
      } else if (currentQuestion.question_type === 'matrix') {
        const currentMatrix = newAnswers[currentQuestionIndex] 
          ? JSON.parse(newAnswers[currentQuestionIndex]) 
          : {};
        currentMatrix[value] = !currentMatrix[value];
        newAnswers[currentQuestionIndex] = JSON.stringify(currentMatrix);
      } else if (currentQuestion.question_type === 'ranking') {
        newAnswers[currentQuestionIndex] = JSON.stringify(value);
      }
      
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert all answers to strings
      const answersArray = answers.map(answer => {
        if (answer === null || answer === undefined || answer === '') {
          return "";
        }
        return String(answer);
      });
      
      let totalScore = 0;
      let earnedPoints = 0;
      
      quiz.questions.forEach((question, idx) => {
        const points = question.points || 1;
        totalScore += points;
        
        const userAnswerString = answersArray[idx];
        let userAnswer;
        
        try {
          userAnswer = userAnswerString && userAnswerString !== "" ? JSON.parse(userAnswerString) : null;
        } catch {
          userAnswer = null;
        }
        
        if (question.question_type === 'multiple_choice') {
          const correctAnswers = Array.isArray(question.correct_answer) ? question.correct_answer : [];
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
          
          if (correctAnswers.length === userAnswers.length && correctAnswers.every(ans => userAnswers.includes(ans))) {
            earnedPoints += points;
          }
        } else if (question.question_type === 'matrix') {
          const matrixCorrect = question.matrix_correct_answers || {};
          const userMatrixAnswers = userAnswer || {};
          let allRowsCorrect = true;
          
          for (let rowIdx = 0; rowIdx < (question.matrix_rows || []).length; rowIdx++) {
            const correctCols = Array.isArray(matrixCorrect[rowIdx]) 
              ? matrixCorrect[rowIdx] 
              : (matrixCorrect[rowIdx] !== undefined ? [matrixCorrect[rowIdx]] : []);
            
            const userCols = [];
            for (let colIdx = 0; colIdx < (question.matrix_columns || []).length; colIdx++) {
              const key = `${rowIdx}-${colIdx}`;
              if (userMatrixAnswers[key]) {
                userCols.push(colIdx);
              }
            }
            
            if (correctCols.length !== userCols.length || !correctCols.every(col => userCols.includes(col))) {
              allRowsCorrect = false;
              break;
            }
          }
          
          if (allRowsCorrect) earnedPoints += points;
        } else if (question.question_type === 'ranking') {
          const correctOrder = question.ranking_correct_order || question.options.map((_, i) => i);
          const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
          
          if (JSON.stringify(correctOrder) === JSON.stringify(userOrder)) {
            earnedPoints += points;
          }
        }
      });
      
      const scorePercentage = totalScore > 0 ? Math.round((earnedPoints / totalScore) * 100) : 0;
      
      const attemptData = {
        student_id: student.id,
        quiz_id: quiz.id,
        answers: answersArray,
        score: scorePercentage,
        time_taken_minutes: Math.round(((quiz.time_limit_minutes || 30) * 60 - timeRemaining) / 60),
        attempt_number: attempts.length + 1,
        status: 'completed',
        started_at: new Date(Date.now() - ((quiz.time_limit_minutes || 30) * 60 - timeRemaining) * 1000).toISOString(),
        completed_at: new Date().toISOString()
      };

      await base44.entities.QuizAttempt.create(attemptData);

      await base44.entities.StudentProgress.create({
        student_id: student.id,
        course_id: quiz.course_id,
        quiz_id: quiz.id,
        progress_type: 'quiz_completed',
        completion_percentage: 100,
        completed_at: new Date().toISOString()
      });

      const remarks = getRemarks(scorePercentage);

      setQuizResults({
        score: scorePercentage,
        passed: scorePercentage >= (quiz.passing_score || 60),
        earnedPoints,
        totalScore,
        attemptNumber: attempts.length + 1,
        remarks: remarks
      });

      await loadAttempts();
      setShowResults(true);
      setQuizStarted(false); // Quiz is no longer "started" after submission
      
      // DO NOT call onComplete() here - let user close modal manually

    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert(`Failed to submit quiz: ${error.message || 'Please try again'}`);
    }
    
    setIsSubmitting(false);
  };

  const handleCloseResults = async () => {
    setShowResults(false);
    setQuizResults(null);
    setAnswers([]);
    
    // Only call onComplete when user explicitly closes the results
    if (onComplete) {
      await onComplete();
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRationaleVideoEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('drive.google.com')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };

  const isAnswerCorrect = (questionIndex) => {
    const question = quiz.questions[questionIndex];
    const userAnswerString = answers[questionIndex];
    
    let userAnswer;
    try {
      userAnswer = userAnswerString && userAnswerString !== "" ? JSON.parse(userAnswerString) : null;
    } catch {
      return false;
    }

    if (question.question_type === 'multiple_choice') {
      const correctAnswers = Array.isArray(question.correct_answer) ? question.correct_answer : [];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
      return correctAnswers.length === userAnswers.length && correctAnswers.every(ans => userAnswers.includes(ans));
    } else if (question.question_type === 'matrix') {
      const matrixCorrect = question.matrix_correct_answers || {};
      const userMatrixAnswers = userAnswer || {};
      
      for (let rowIdx = 0; rowIdx < (question.matrix_rows || []).length; rowIdx++) {
        const correctCols = Array.isArray(matrixCorrect[rowIdx]) 
          ? matrixCorrect[rowIdx] 
          : (matrixCorrect[rowIdx] !== undefined ? [matrixCorrect[rowIdx]] : []);
        
        const userCols = [];
        for (let colIdx = 0; colIdx < (question.matrix_columns || []).length; colIdx++) {
          const key = `${rowIdx}-${colIdx}`;
          if (userMatrixAnswers[key]) {
            userCols.push(colIdx);
          }
        }
        
        if (correctCols.length !== userCols.length || !correctCols.every(col => userCols.includes(col))) {
          return false;
        }
      }
      return true;
    } else if (question.question_type === 'ranking') {
      const correctOrder = question.ranking_correct_order || question.options.map((_, i) => i);
      const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
      return JSON.stringify(correctOrder) === JSON.stringify(userOrder);
    }
    
    return false;
  };

  const getHighestScore = () => {
    if (attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.score));
  };

  // Check if user can access quiz
  if (!canTakeQuiz) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
        <Lock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Required Videos First</h3>
        <p className="text-gray-700 mb-6">You must watch these videos before taking this quiz:</p>
        <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
          <ul className="text-left space-y-2">
            {missingVideos.map((video, idx) => (
              <li key={idx} className="flex items-center gap-2 text-gray-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                {video.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!accessInfo.canAccess) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
        <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Available Yet</h3>
        <p className="text-gray-700 mb-2">This quiz will be available on:</p>
        <p className="text-2xl font-bold text-blue-600">{accessInfo.formattedDate}</p>
      </div>
    );
  }

  if (hasExhaustedAttempts && !quizStarted) {
    const highestScore = getHighestScore();
    const remarks = getRemarks(highestScore);
    
    return (
      <div className="space-y-6">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
          <div className="text-center mb-6">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed</h3>
            <p className="text-gray-700">
              You have used all {quiz.max_attempts} attempts for this quiz.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Highest Score</p>
              <p className="text-4xl font-bold text-gray-900">{highestScore}%</p>
              <p className={`text-sm font-semibold mt-2 ${remarks.color}`}>{remarks.text}</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
              <p className="text-4xl font-bold text-gray-900">{attempts.length}</p>
              <p className="text-sm text-gray-500 mt-2">Completed</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={startReviewMode}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Eye className="w-5 h-5 mr-2" />
              Review Quiz & Answers
            </Button>
            <Button
              onClick={() => setShowPreviousAttempts(true)}
              variant="outline"
              className="flex-1"
            >
              View All Attempts
            </Button>
          </div>
        </div>

        {/* Rationale Video */}
        {quiz.rationale_video_url && (
          <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-md">
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Play className="w-6 h-6 text-purple-600" />
              Quiz Rationale Video
            </h4>
            <p className="text-gray-600 mb-4">
              Watch a comprehensive explanation of all questions and answers:
            </p>
            <Button
              onClick={() => setShowRationaleVideo(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Rationale Video
            </Button>
          </div>
        )}

        {/* Previous Attempts Modal */}
        <Dialog open={showPreviousAttempts} onOpenChange={setShowPreviousAttempts}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Your Quiz Attempts</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {attempts.map((attempt, idx) => {
                const attemptRemarks = getRemarks(attempt.score);
                return (
                  <div key={idx} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          Attempt #{attempt.attempt_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(attempt.completed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">{attempt.score}%</p>
                        <p className={`text-sm font-semibold ${attemptRemarks.color}`}>
                          {attemptRemarks.text}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-sm text-gray-600">
                      <span>Time: {attempt.time_taken_minutes} min</span>
                      <span className={attempt.score >= (quiz.passing_score || 60) ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {attempt.score >= (quiz.passing_score || 60) ? '✓ Passed' : '✗ Did not pass'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Rationale Video Modal */}
        <Dialog open={showRationaleVideo} onOpenChange={setShowRationaleVideo}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Quiz Rationale Video</DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full">
              {getRationaleVideoEmbedUrl(quiz.rationale_video_url) ? (
                quiz.rationale_video_url.includes('drive.google.com') ? (
                  <iframe
                    src={getRationaleVideoEmbedUrl(quiz.rationale_video_url)}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    src={getRationaleVideoEmbedUrl(quiz.rationale_video_url)}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : (
                <video
                  src={quiz.rationale_video_url}
                  controls
                  className="w-full h-full rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!quizStarted) {
    const attemptsRemaining = quiz.max_attempts ? quiz.max_attempts - attempts.length : "Unlimited";
    const highestScore = getHighestScore();
    
    return (
      <div className="space-y-6">
        {/* Previous Attempts Summary */}
        {attempts.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Your Progress
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-md">
                <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-gray-900">{highestScore}%</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-md">
                <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Attempts</p>
                <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-md">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">{attemptsRemaining}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowPreviousAttempts(true)}
              variant="outline"
              className="w-full"
            >
              View All Attempts
            </Button>
          </div>
        )}

        {/* Start Quiz Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to Start Quiz?</h2>
            <p className="text-gray-600">You have {attemptsRemaining} attempt{attemptsRemaining !== 1 && attemptsRemaining !== "Unlimited" ? 's' : ''} remaining</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 text-center shadow-md">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Time Limit</p>
              <p className="text-xl font-bold text-gray-900">{quiz.time_limit_minutes || 30} minutes</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Passing Score</p>
              <p className="text-xl font-bold text-gray-900">{quiz.passing_score || 60}%</p>
            </div>
          </div>

          <Button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
          >
            Start Quiz
          </Button>
        </div>

        {/* Previous Attempts Modal */}
        <Dialog open={showPreviousAttempts} onOpenChange={setShowPreviousAttempts}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Your Quiz Attempts</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {attempts.map((attempt, idx) => {
                const attemptRemarks = getRemarks(attempt.score);
                return (
                  <div key={idx} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          Attempt #{attempt.attempt_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(attempt.completed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">{attempt.score}%</p>
                        <p className={`text-sm font-semibold ${attemptRemarks.color}`}>
                          {attemptRemarks.text}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-sm text-gray-600">
                      <span>Time: {attempt.time_taken_minutes} min</span>
                      <span className={attempt.score >= (quiz.passing_score || 60) ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {attempt.score >= (quiz.passing_score || 60) ? '✓ Passed' : '✗ Did not pass'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  let currentAnswer;
  try {
    currentAnswer = answers[currentQuestionIndex] && answers[currentQuestionIndex] !== "" 
      ? JSON.parse(answers[currentQuestionIndex]) 
      : (currentQuestion.question_type === 'multiple_choice' ? [] : (currentQuestion.question_type === 'matrix' ? {} : []));
  } catch {
    currentAnswer = currentQuestion.question_type === 'multiple_choice' ? [] : (currentQuestion.question_type === 'matrix' ? {} : []);
  }

  const questionIsCorrect = reviewMode ? isAnswerCorrect(currentQuestionIndex) : null;

  return (
    <div className="space-y-6">
      {/* Timer and Progress - FIXED HEIGHT */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
              {reviewMode && (
                <span className={`ml-3 text-sm ${questionIsCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {questionIsCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600">
              {reviewMode ? 'Review Mode' : `${answers.filter(a => a && a !== "").length} answered`}
            </p>
          </div>
          {!reviewMode && (
            <div className="flex items-center gap-2 text-lg font-bold text-blue-600">
              <Clock className="w-6 h-6" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card - FIXED HEIGHT WITH SCROLL */}
      <div className="bg-white rounded-xl shadow-md p-8 h-[600px] overflow-y-auto">
        <div 
          className="text-lg text-gray-900 mb-6 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
        />

        {currentQuestion.image_url && (
          <div className="mb-6">
            <img 
              src={currentQuestion.image_url} 
              alt="Question diagram" 
              className="max-w-full h-auto rounded-lg border-2 border-gray-200 shadow-md"
            />
          </div>
        )}

        {currentQuestion.required_answers_count && currentQuestion.required_answers_count > 1 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">
              Select {currentQuestion.required_answers_count} answers for this question
            </p>
          </div>
        )}

        {/* Multiple Choice */}
        {currentQuestion.question_type === 'multiple_choice' && (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, idx) => {
              const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(idx);
              const isCorrect = reviewMode && currentQuestion.correct_answer?.includes(idx);
              
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={reviewMode}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    reviewMode
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isSelected && !isCorrect
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                      : isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${reviewMode ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      reviewMode
                        ? isCorrect
                          ? 'border-green-600 bg-green-600'
                          : isSelected
                          ? 'border-red-600 bg-red-600'
                          : 'border-gray-300'
                        : isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {(isSelected || (reviewMode && isCorrect)) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                    {reviewMode && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {reviewMode && isSelected && !isCorrect && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Matrix/Grid */}
        {currentQuestion.question_type === 'matrix' && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-2 border-gray-300 p-3 text-left font-semibold"></th>
                  {currentQuestion.matrix_columns?.map((col, cIndex) => (
                    <th key={cIndex} className="border-2 border-gray-300 p-3 text-center font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentQuestion.matrix_rows?.map((row, rIndex) => (
                  <tr key={rIndex} className="hover:bg-blue-50">
                    <td className="border-2 border-gray-300 p-3 font-medium bg-gray-50">{row}</td>
                    {currentQuestion.matrix_columns?.map((col, cIndex) => {
                      const key = `${rIndex}-${cIndex}`;
                      const isChecked = currentAnswer[key] || false;
                      const isCorrect = reviewMode && (
                        Array.isArray(currentQuestion.matrix_correct_answers?.[rIndex])
                          ? currentQuestion.matrix_correct_answers[rIndex].includes(cIndex)
                          : currentQuestion.matrix_correct_answers?.[rIndex] === cIndex
                      );
                      
                      return (
                        <td key={cIndex} className={`border-2 border-gray-300 p-3 text-center ${
                          reviewMode
                            ? isCorrect
                              ? 'bg-green-50'
                              : isChecked && !isCorrect
                              ? 'bg-red-50'
                              : ''
                            : ''
                        }`}>
                          <Checkbox
                            checked={isChecked || (reviewMode && isCorrect)}
                            onCheckedChange={() => handleAnswerSelect(key)}
                            disabled={reviewMode}
                            className="w-6 h-6"
                          />
                          {reviewMode && isCorrect && !isChecked && (
                            <div className="text-xs text-green-600 mt-1">✓ Correct</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Ranking */}
        {currentQuestion.question_type === 'ranking' && (
          <RankingQuestion
            options={currentQuestion.options || []}
            currentOrder={Array.isArray(currentAnswer) ? currentAnswer : []}
            onOrderChange={(newOrder) => handleAnswerSelect(newOrder)}
            reviewMode={reviewMode}
            correctOrder={currentQuestion.ranking_correct_order || currentQuestion.options.map((_, i) => i)}
          />
        )}

        {/* Explanation in Review Mode */}
        {reviewMode && currentQuestion.explanation && (
          <div className={`mt-6 p-4 rounded-lg border-2 ${
            questionIsCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className="font-semibold text-gray-900 mb-2">Explanation:</p>
            <p className="text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          className="px-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {reviewMode ? (
          currentQuestionIndex === quiz.questions.length - 1 ? (
            <div className="flex gap-3">
              {quiz.rationale_video_url && (
                <Button
                  onClick={() => setShowRationaleVideo(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-8"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Rationale Video
                </Button>
              )}
              <Button
                onClick={() => {
                  setQuizStarted(false);
                  setReviewMode(false);
                  setAnswers([]);
                }}
                className="bg-gradient-to-r from-gray-600 to-gray-700 px-8"
              >
                Close Review
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-6"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )
        ) : (
          currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-6"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )
        )}
      </div>

      {/* Enhanced Results Modal - Matching Image Design */}
      <Dialog open={showResults} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
          <button
            onClick={handleCloseResults}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          
          <div className="text-center pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
          </div>

          {quizResults && (
            <div className="py-6">
              {/* Trophy and Title */}
              <div className="text-center mb-8">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Trophy className="w-14 h-14 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed</h3>
                <p className="text-gray-600">
                  You have used {quizResults.attemptNumber} of {quiz.max_attempts || '∞'} attempts for this quiz.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Highest Score Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 text-center">
                  <Award className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Highest Score</p>
                  <p className="text-5xl font-bold text-gray-900 mb-2">{quizResults.score}%</p>
                  <p className={`text-base font-semibold ${quizResults.remarks.color}`}>
                    {quizResults.remarks.text}
                  </p>
                </div>

                {/* Total Attempts Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Total Attempts</p>
                  <p className="text-5xl font-bold text-gray-900 mb-2">{quizResults.attemptNumber}</p>
                  <p className="text-base text-gray-600">Completed</p>
                </div>
              </div>

              {/* Pass/Fail Status */}
              <div className={`rounded-xl p-4 mb-6 ${
                quizResults.passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}>
                <p className={`text-center text-lg font-semibold ${
                  quizResults.passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  {quizResults.passed ? '✓ Passed!' : '✗ Did not pass'}
                </p>
                <p className="text-center text-sm text-gray-600 mt-1">
                  {quizResults.earnedPoints} out of {quizResults.totalScore} points • Passing score: {quiz.passing_score || 60}%
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleCloseResults}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
                >
                  Close
                </Button>
                
                {quizResults.attemptNumber < (quiz.max_attempts || Infinity) && !quizResults.passed && (
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      startQuiz();
                    }}
                    variant="outline"
                    className="w-full text-lg py-6"
                  >
                    Try Again
                  </Button>
                )}

                {quiz.rationale_video_url && (
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      setShowRationaleVideo(true);
                    }}
                    variant="outline"
                    className="w-full text-lg py-6"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Rationale Video
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rationale Video Modal */}
      <Dialog open={showRationaleVideo} onOpenChange={setShowRationaleVideo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Quiz Rationale Video</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {getRationaleVideoEmbedUrl(quiz.rationale_video_url) ? (
              quiz.rationale_video_url.includes('drive.google.com') ? (
                <iframe
                  src={getRationaleVideoEmbedUrl(quiz.rationale_video_url)}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={getRationaleVideoEmbedUrl(quiz.rationale_video_url)}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <video
                src={quiz.rationale_video_url}
                controls
                className="w-full h-full rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ranking Question Component - Enhanced for Review Mode
function RankingQuestion({ options, currentOrder, onOrderChange, reviewMode, correctOrder }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (currentOrder.length > 0) {
      setItems(currentOrder.map(idx => options[idx]));
    } else {
      setItems([...options]);
    }
  }, [options, currentOrder]);

  const moveItem = (fromIndex, toIndex) => {
    if (reviewMode) return;
    
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    setItems(newItems);
    
    const newOrder = newItems.map(item => options.indexOf(item));
    onOrderChange(newOrder);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-4">
        {reviewMode ? 'Your answer vs. Correct order:' : 'Drag to reorder items from first to last:'}
      </p>
      {items.map((item, index) => {
        const correctIndex = reviewMode ? correctOrder?.indexOf(options.indexOf(item)) : -1;
        const isCorrectPosition = reviewMode && correctIndex === index;
        
        return (
          <div
            key={index}
            className={`flex items-center gap-3 p-4 border-2 rounded-lg ${
              reviewMode
                ? isCorrectPosition
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
                : 'bg-white border-gray-200'
            }`}
          >
            {!reviewMode && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => index > 0 && moveItem(index, index - 1)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
                  disabled={index === items.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            )}
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              reviewMode
                ? isCorrectPosition
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {index + 1}
            </span>
            <span className="flex-1">{item}</span>
            {reviewMode && (
              <>
                {isCorrectPosition ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="text-sm text-gray-600">
                    Correct: #{correctIndex + 1}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
