import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getUserRole } from "../components/utils/getUserRole";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Plus, Pencil, Trash2, Eye, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminAssessments() {
  const [currentUser, setCurrentUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time_limit_minutes: 60,
    questions: [],
    is_active: true
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);
      if (userRole !== 'admin') {
        window.location.href = createPageUrl("LandingPage");
        return;
      }

      const allAssessments = await base44.entities.AssessmentExam.list('-created_date');
      setAssessments(allAssessments);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const openModal = (assessment = null) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setFormData({
        title: assessment.title,
        description: assessment.description || '',
        time_limit_minutes: assessment.time_limit_minutes || 60,
        questions: assessment.questions || [],
        is_active: assessment.is_active !== false
      });
    } else {
      setEditingAssessment(null);
      setFormData({
        title: '',
        description: '',
        time_limit_minutes: 60,
        questions: [],
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingAssessment) {
        await base44.entities.AssessmentExam.update(editingAssessment.id, formData);
      } else {
        await base44.entities.AssessmentExam.create(formData);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving assessment:", error);
      alert("Failed to save assessment");
    }
  };

  const openDeleteModal = (assessment) => {
    setAssessmentToDelete(assessment);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!assessmentToDelete) return;
    
    try {
      await base44.entities.AssessmentExam.delete(assessmentToDelete.id);
      await loadData();
      setIsDeleteModalOpen(false);
      setAssessmentToDelete(null);
    } catch (error) {
      console.error("Error deleting assessment:", error);
      alert("Failed to delete assessment");
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          question_type: 'multiple_choice',
          points: 1,
          options: ['', '', '', ''],
          correct_answer: [],
          category: ''
        }
      ]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const viewSummary = (assessmentId) => {
    navigate(createPageUrl(`AssessmentSummary?id=${assessmentId}`));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Exams</h1>
            <p className="text-gray-600 mt-2">Manage student assessment exams</p>
          </div>
          <Button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
            <Plus className="w-4 h-4 mr-2" /> Create Assessment
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{assessment.title}</div>
                      <div className="text-sm text-gray-500">{assessment.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {assessment.questions?.length || 0} questions
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {assessment.time_limit_minutes} minutes
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        assessment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Button
                        onClick={() => viewSummary(assessment.id)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View Summary
                      </Button>
                      <Button
                        onClick={() => openModal(assessment)}
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        onClick={() => openDeleteModal(assessment)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssessment ? 'Edit Assessment' : 'Create Assessment'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Initial Assessment Exam"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Assessment description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  value={formData.time_limit_minutes}
                  onChange={(e) => setFormData({...formData, time_limit_minutes: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Questions</Label>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                  </Button>
                </div>

                <div className="space-y-6">
                  {formData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <Label>Question {qIndex + 1}</Label>
                        <Button
                          onClick={() => removeQuestion(qIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter question..."
                        rows={2}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={question.category}
                            onChange={(e) => updateQuestion(qIndex, 'category', e.target.value)}
                            placeholder="e.g., Fundamentals, Pharmacology"
                          />
                        </div>
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[oIndex] = e.target.value;
                                  updateQuestion(qIndex, 'options', newOptions);
                                }}
                                placeholder={`Option ${oIndex + 1}`}
                              />
                              <input
                                type="checkbox"
                                checked={question.correct_answer?.includes(oIndex)}
                                onChange={(e) => {
                                  let newCorrect = [...(question.correct_answer || [])];
                                  if (e.target.checked) {
                                    newCorrect.push(oIndex);
                                  } else {
                                    newCorrect = newCorrect.filter(i => i !== oIndex);
                                  }
                                  updateQuestion(qIndex, 'correct_answer', newCorrect);
                                }}
                                className="w-5 h-5"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={() => setIsModalOpen(false)} variant="outline">Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {editingAssessment ? 'Update' : 'Create'} Assessment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">Are you sure you want to delete this assessment? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={() => setIsDeleteModalOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}