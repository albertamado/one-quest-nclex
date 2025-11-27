import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserRole } from '../components/utils/getUserRole';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Award, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/shared/LoadingScreen';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AssessmentExam() {
  const [currentUser, setCurrentUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadAssessment();
  }, []);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);
      
      // Check if user can take assessment
      if (userRole === 'student') {
        if (user.subscription_tier === 'basic' || user.subscription_tier === 'standard') {
          alert('Assessment exam is only available for Premium tier students');
          navigate(createPageUrl("StudentDashboard"));
          return;
        }
      }

      const assessments = await base44.entities.AssessmentExam.filter({ is_active: true });
      
      if (assessments.length === 0) {
        alert('No active assessment available');
        navigate(createPageUrl("StudentDashboard"));
        return;
      }

      const assessmentData = assessments[0];
      setAssessment(assessmentData);
      setAnswers(new Array(assessmentData.questions.length).fill(null));
      setTimeRemaining(assessmentData.time_limit_minutes * 60);

    } catch (error) {
      console.error("Error loading assessment:", error);
      navigate(createPageUrl("StudentDashboard"));
    }
    setLoading(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...answers];
    const currentQuestion = assessment.questions[currentQuestionIndex];
    
    if (currentQuestion.required_answers_count && currentQuestion.required_answers_count > 1) {
      if (!newAnswers[currentQuestionIndex]) {
        newAnswers[currentQuestionIndex] = [];
      }
      
      const currentAnswers = [...newAnswers[currentQuestionIndex]];
      const index = currentAnswers.indexOf(answerIndex);
      
      if (index > -1) {
        currentAnswers.splice(index, 1);
      } else {
        if (currentAnswers.length < currentQuestion.required_answers_count) {
          currentAnswers.push(answerIndex);
        }
      }
      
      newAnswers[currentQuestionIndex] = currentAnswers;
    } else {
      newAnswers[currentQuestionIndex] = answerIndex;
    }
    
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    const categoryScores = {};

    assessment.questions.forEach((question, index) => {
      const studentAnswer = answers[index];
      const correctAnswer = question.correct_answer;
      
      let isCorrect = false;
      if (Array.isArray(correctAnswer)) {
        if (Array.isArray(studentAnswer)) {
          isCorrect = JSON.stringify([...studentAnswer].sort()) === JSON.stringify([...correctAnswer].sort());
        } else {
          isCorrect = correctAnswer.length === 1 && correctAnswer[0] === studentAnswer;
        }
      } else {
        isCorrect = studentAnswer === correctAnswer;
      }

      if (isCorrect) {
        correctCount++;
      }

      const category = question.category || 'General';
      if (!categoryScores[category]) {
        categoryScores[category] = { correct: 0, total: 0 };
      }
      categoryScores[category].total++;
      if (isCorrect) {
        categoryScores[category].correct++;
      }
    });

    const percentage = Math.round((correctCount / assessment.questions.length) * 100);
    
    const formattedCategoryScores = {};
    Object.entries(categoryScores).forEach(([category, data]) => {
      formattedCategoryScores[category] = Math.round((data.correct / data.total) * 100);
    });

    return { percentage, categoryScores: formattedCategoryScores };
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { percentage, categoryScores } = calculateScore();

      await base44.entities.AssessmentAttempt.create({
        student_id: currentUser.id,
        assessment_id: assessment.id,
        answers: answers,
        score: percentage,
        time_taken_minutes: Math.round((assessment.time_limit_minutes * 60 - timeRemaining) / 60),
        category_scores: categoryScores,
        completed_at: new Date().toISOString()
      });

      setScore(percentage);
      setShowResultModal(true);

    } catch (error) {
      console.error("Error submitting assessment:", error);
      alert("Failed to submit assessment. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    navigate(createPageUrl("StudentDashboard"));
  };

  if (loading) {
    return <LoadingScreen message="Loading assessment..." />;
  }

  if (!assessment) {
    return null;
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="text-gray-600 mt-1">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-blue-600">
              <Clock className="w-6 h-6" />
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / assessment.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
            {currentQuestion.required_answers_count && currentQuestion.required_answers_count > 1 && (
              <p className="text-sm text-blue-600 font-medium mb-4">
                Select {currentQuestion.required_answers_count} answers
              </p>
            )}
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = currentQuestion.required_answers_count && currentQuestion.required_answers_count > 1
                ? answers[currentQuestionIndex]?.includes(idx)
                : answers[currentQuestionIndex] === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className="flex-1 text-gray-900">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="px-6"
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {answers.filter(a => a !== null && a !== undefined && (Array.isArray(a) ? a.length > 0 : true)).length} / {assessment.questions.length} answered
          </div>

          {currentQuestionIndex === assessment.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-teal-600 px-6"
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Result Modal */}
      <Dialog open={showResultModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Assessment Complete!</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
              <Award className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2">{score}%</h3>
            <p className="text-gray-600 mb-6">Your Assessment Score</p>
            <p className="text-sm text-gray-500 mb-6">
              Your results have been saved and are now visible to your instructors.
            </p>
            <Button
              onClick={handleFinish}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-lg py-6"
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}