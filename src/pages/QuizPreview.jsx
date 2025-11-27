import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getUserRole } from '../components/utils/getUserRole';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function QuizPreview() {
  const [quiz, setQuiz] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);
      if (userRole !== 'admin' && userRole !== 'teacher') {
        window.location.href = '/';
        return;
      }

      const quizData = await base44.entities.Quiz.filter({ id: quizId });
      if (quizData[0]) {
        setQuiz(quizData[0]);
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Quiz not found or access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to={createPageUrl("AdminQuizzes")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600 mt-2">{quiz.description}</p>
            </div>
            <Button onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? 'Hide' : 'Show'} Answers
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-8">
            {quiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="border-b pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Question {qIndex + 1}:
                </h3>
                <div 
                  className="text-gray-800 mb-4 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: question.question }}
                />

                {question.image_url && (
                  <div className="mb-6">
                    <img 
                      src={question.image_url} 
                      alt="Question diagram" 
                      className="max-w-full h-auto rounded-lg border-2 border-gray-200 shadow-md"
                    />
                  </div>
                )}

                {question.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options?.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`p-3 rounded-lg border-2 ${
                          showAnswers && question.correct_answer?.includes(oIndex)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={showAnswers && question.correct_answer?.includes(oIndex)}
                            disabled
                            className="mr-3"
                          />
                          <span>{option}</span>
                          {showAnswers && question.correct_answer?.includes(oIndex) && (
                            <CheckCircle className="w-5 h-5 ml-auto text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.question_type === 'matrix' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-2 border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border-2 border-gray-300 p-3 text-left font-semibold"></th>
                          {question.matrix_columns?.map((col, cIndex) => (
                            <th key={cIndex} className="border-2 border-gray-300 p-3 text-center font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {question.matrix_rows?.map((row, rIndex) => (
                          <tr key={rIndex} className="hover:bg-blue-50">
                            <td className="border-2 border-gray-300 p-3 font-medium bg-gray-50 text-gray-700">{row}</td>
                            {question.matrix_columns?.map((col, cIndex) => {
                              const correctAnswers = Array.isArray(question.matrix_correct_answers?.[rIndex]) 
                                ? question.matrix_correct_answers[rIndex] 
                                : (question.matrix_correct_answers?.[rIndex] !== undefined ? [question.matrix_correct_answers[rIndex]] : []);
                              const isCorrect = correctAnswers.includes(cIndex);
                              
                              return (
                                <td 
                                  key={cIndex} 
                                  className={`border-2 border-gray-300 p-3 text-center ${
                                    showAnswers && isCorrect ? 'bg-green-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    <Checkbox
                                      checked={showAnswers && isCorrect}
                                      disabled
                                      className="w-5 h-5"
                                    />
                                    {showAnswers && isCorrect && (
                                      <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {question.question_type === 'ranking' && (
                  <div className="space-y-2">
                    {question.options?.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`p-3 rounded-lg border-2 flex items-center ${
                          showAnswers
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 font-semibold">
                          {showAnswers ? oIndex + 1 : '?'}
                        </span>
                        <span>{option}</span>
                      </div>
                    ))}
                    {showAnswers && (
                      <p className="text-sm text-blue-600 mt-2">
                        ↑ Correct order shown above
                      </p>
                    )}
                  </div>
                )}

                {showAnswers && question.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-2">Rationale:</p>
                    <p className="text-blue-800">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}