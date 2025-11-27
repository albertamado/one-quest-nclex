import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserRole } from '../components/utils/getUserRole';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AssessmentSummary() {
  const [currentUser, setCurrentUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get('id');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);
      if (userRole !== 'admin' && userRole !== 'teacher') {
        window.location.href = createPageUrl("LandingPage");
        return;
      }

      const assessmentData = await base44.entities.AssessmentExam.filter({ id: assessmentId });
      if (assessmentData[0]) {
        setAssessment(assessmentData[0]);
      }

      const allAttempts = await base44.entities.AssessmentAttempt.filter({ assessment_id: assessmentId });
      setAttempts(allAttempts);

      const studentIds = [...new Set(allAttempts.map(a => a.student_id))];
      const studentData = {};
      for (const studentId of studentIds) {
        try {
          const student = await base44.entities.User.filter({ id: studentId });
          if (student[0]) {
            studentData[studentId] = student[0];
          }
        } catch (error) {
          console.warn(`Could not load student ${studentId}`);
        }
      }
      setStudents(studentData);

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Assessment not found</p>
          <Link to={createPageUrl("AdminAssessments")}>
            <Button className="mt-4">Back to Assessments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const scoreDistribution = [
    { range: '0-20', count: attempts.filter(a => a.score <= 20).length },
    { range: '21-40', count: attempts.filter(a => a.score > 20 && a.score <= 40).length },
    { range: '41-60', count: attempts.filter(a => a.score > 40 && a.score <= 60).length },
    { range: '61-80', count: attempts.filter(a => a.score > 60 && a.score <= 80).length },
    { range: '81-100', count: attempts.filter(a => a.score > 80).length }
  ];

  const categoryData = {};
  attempts.forEach(attempt => {
    if (attempt.category_scores) {
      Object.entries(attempt.category_scores).forEach(([category, score]) => {
        if (!categoryData[category]) {
          categoryData[category] = { total: 0, count: 0 };
        }
        categoryData[category].total += score;
        categoryData[category].count += 1;
      });
    }
  });

  const categoryAverages = Object.entries(categoryData).map(([category, data]) => ({
    category: category.replace('-', ' ').toUpperCase(),
    average: Math.round(data.total / data.count)
  }));

  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  const passRate = attempts.length > 0
    ? Math.round((attempts.filter(a => a.score >= 75).length / attempts.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <Link to={createPageUrl("AdminAssessments")} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessments
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Summary</h1>
            <p className="text-gray-600 mt-2">{assessment.title}</p>
          </div>
          <Button onClick={handlePrint} className="bg-gradient-to-r from-blue-600 to-teal-600">
            <Printer className="w-4 h-4 mr-2" />
            Print Summary
          </Button>
        </div>

        <div ref={printRef} className="space-y-8">
          <div className="hidden print:block mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
            <p className="text-xl text-gray-600">Assessment Summary Report</p>
            <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-gray-900">{attempts.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Unique Students</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(students).length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-blue-600">{averageScore}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Pass Rate</p>
              <p className="text-3xl font-bold text-green-600">{passRate}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Number of Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {categoryAverages.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Performance by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#10B981" name="Average Score %" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {categoryAverages.map((cat, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">{cat.category}</p>
                    <p className={`text-2xl font-bold ${cat.average >= 75 ? 'text-green-600' : cat.average >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {cat.average}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Individual Student Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Time Taken</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Completed</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attempts.map((attempt, idx) => {
                    const student = students[attempt.student_id];
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {student?.full_name || student?.email || 'Unknown Student'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            attempt.score >= 75 ? 'bg-green-100 text-green-700' :
                            attempt.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {attempt.score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {attempt.time_taken_minutes} min
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            attempt.score >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {attempt.score >= 75 ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}