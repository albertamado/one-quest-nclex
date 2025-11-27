
import React, { useState, useEffect } from 'react';
import { Quiz } from '@/api/entities';
import { Course } from '@/api/entities';
import { Video } from '@/api/entities';
import { QuizAttempt } from '@/api/entities';
import { User } from '@/api/entities';
import { Section } from '@/api/entities';
import { Module } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Users, FileText, X, GripVertical, Plus, Image as ImageIcon, Upload, Copy, Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUserRole } from '../components/utils/getUserRole';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QuestionManager = ({ questions = [], setQuestions, videos = [] }) => {
  const [uploadingImage, setUploadingImage] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(questions.length > 0 ? 0 : -1); // Expand the first question by default if available

  // ReactQuill modules configuration for formatting
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  const quillFormats = [
    'bold', 'italic', 'underline', 'align'
  ];

  const addQuestion = (type = 'multiple_choice') => {
    const newQuestion = {
      question: '',
      question_type: type,
      image_url: '', // Added: New field for question image URL
      options: ['', ''],
      correct_answer: [],
      explanation: '',
      rationale_video_url: '', // Preserve existing field
      points: 1,
      required_answers_count: 1 // Changed from 0 to 1 as per outline
    };

    if (type === 'matrix') {
      newQuestion.matrix_rows = [''];
      newQuestion.matrix_columns = ['', ''];
      newQuestion.matrix_correct_answers = {}; // Storing as an object where keys are row indices and values are arrays of column indices
    } else if (type === 'ranking') {
      newQuestion.ranking_correct_order = [];
    }

    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setExpandedQuestion(updatedQuestions.length - 1); // Expand the newly added question
  };

  const duplicateQuestion = (index) => {
    const newQuestions = [...questions];
    // Perform a deep copy to ensure new object references
    const duplicated = JSON.parse(JSON.stringify(questions[index]));
    newQuestions.splice(index + 1, 0, duplicated);
    setQuestions(newQuestions);
    setExpandedQuestion(index + 1); // Expand the duplicated question
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (expandedQuestion === index) {
      setExpandedQuestion(newQuestions.length > 0 ? Math.max(0, index - 1) : -1);
    } else if (expandedQuestion > index) {
      setExpandedQuestion(expandedQuestion - 1);
    }
  }

  const handleQuestionChange = (qIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex][field] = value;
    
    // Initialize matrix properties when switching to matrix type
    if (field === 'question_type' && value === 'matrix') {
      if (!newQuestions[qIndex].matrix_rows) {
        newQuestions[qIndex].matrix_rows = [''];
      }
      if (!newQuestions[qIndex].matrix_columns) {
        newQuestions[qIndex].matrix_columns = ['', ''];
      }
      if (!newQuestions[qIndex].matrix_correct_answers) {
        newQuestions[qIndex].matrix_correct_answers = {}; // Initialize as empty object
      }
    }
    
    // Initialize ranking properties when switching to ranking type
    if (field === 'question_type' && value === 'ranking') {
      if (!newQuestions[qIndex].ranking_correct_order) {
        newQuestions[qIndex].ranking_correct_order = [];
      }
    }
    
    setQuestions(newQuestions);
  };

  const handleImageUpload = async (qIndex, file) => {
    if (!file) return;
    
    setUploadingImage(qIndex);
    try {
      // Assuming base44.integrations.Core.UploadFile is available and returns { file_url: string }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleQuestionChange(qIndex, 'image_url', file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
    setUploadingImage(null);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length > 2) {
      // Remove option from options array
      newQuestions[qIndex].options.splice(oIndex, 1);

      // Adjust correct_answer indices for multiple_choice
      if (newQuestions[qIndex].question_type === 'multiple_choice') {
        newQuestions[qIndex].correct_answer = newQuestions[qIndex].correct_answer
          .filter(idx => idx !== oIndex) // Remove the deleted option if it was correct
          .map(idx => (idx > oIndex ? idx - 1 : idx)); // Shift indices down for options after the deleted one
      }
      setQuestions(newQuestions);
    }
  };

  const toggleCorrectAnswer = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    
    if (!Array.isArray(question.correct_answer)) {
      question.correct_answer = [];
    }

    const answerIndex = question.correct_answer.indexOf(oIndex);
    
    if (answerIndex > -1) {
      // If already selected, deselect it
      question.correct_answer.splice(answerIndex, 1);
    } else {
      // If not selected, add it (no limit here, limit is for validation)
      question.correct_answer.push(oIndex);
    }
    
    setQuestions(newQuestions);
  };

  const moveQuestion = (fromIndex, toIndex) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    setQuestions(newQuestions);
    setExpandedQuestion(toIndex); // Keep the moved question expanded
  };

  const addMatrixRow = (qIndex) => {
    const newQuestions = [...questions];
    // Ensure matrix_rows exists and is an array
    if (!newQuestions[qIndex].matrix_rows) {
      newQuestions[qIndex].matrix_rows = [];
    }
    newQuestions[qIndex].matrix_rows.push('');
    setQuestions(newQuestions);
  };

  const removeMatrixRow = (qIndex, rIndex) => {
    const newQuestions = [...questions];
    // Ensure matrix_rows exists before checking length
    if (newQuestions[qIndex].matrix_rows && newQuestions[qIndex].matrix_rows.length > 1) {
      newQuestions[qIndex].matrix_rows.splice(rIndex, 1);

      const oldCorrectAnswers = newQuestions[qIndex].matrix_correct_answers || {};
      const newCorrectAnswers = {};
      Object.keys(oldCorrectAnswers).forEach(key => {
        const numKey = parseInt(key, 10);
        if (numKey < rIndex) {
          newCorrectAnswers[numKey] = oldCorrectAnswers[key];
        } else if (numKey > rIndex) {
          newCorrectAnswers[numKey - 1] = oldCorrectAnswers[key];
        }
        // If numKey === rIndex, it's deleted, so don't include it in newCorrectAnswers
      });
      newQuestions[qIndex].matrix_correct_answers = newCorrectAnswers;
      setQuestions(newQuestions);
    }
  };

  const addMatrixColumn = (qIndex) => {
    const newQuestions = [...questions];
    // Ensure matrix_columns exists and is an array
    if (!newQuestions[qIndex].matrix_columns) {
      newQuestions[qIndex].matrix_columns = [];
    }
    newQuestions[qIndex].matrix_columns.push('');
    setQuestions(newQuestions);
  };

  const removeMatrixColumn = (qIndex, cIndex) => {
    const newQuestions = [...questions];
    // Ensure matrix_columns exists before checking length
    if (newQuestions[qIndex].matrix_columns && newQuestions[qIndex].matrix_columns.length > 2) {
      newQuestions[qIndex].matrix_columns.splice(cIndex, 1);

      const oldCorrectAnswers = newQuestions[qIndex].matrix_correct_answers || {};
      const newCorrectAnswers = {};
      Object.keys(oldCorrectAnswers).forEach(rowKey => {
        const rowVal = parseInt(rowKey, 10); // Ensure rowKey is a number
        const currentCorrectCols = oldCorrectAnswers[rowVal] || []; // Get the array of column indices for this row

        // Filter out the deleted column, and adjust indices for columns after it
        const updatedCorrectCols = currentCorrectCols
          .filter(colIndex => colIndex !== cIndex)
          .map(colIndex => (colIndex > cIndex ? colIndex - 1 : colIndex));
        
        // Only add to newCorrectAnswers if there are still correct columns for this row
        if (updatedCorrectCols.length > 0) {
          newCorrectAnswers[rowVal] = updatedCorrectCols;
        }
      });
      newQuestions[qIndex].matrix_correct_answers = newCorrectAnswers;
      setQuestions(newQuestions);
    }
  };

  const handleMatrixCorrectAnswer = (qIndex, rowIndex, columnIndex, checked) => {
    const newQuestions = [...questions];
    if (!newQuestions[qIndex].matrix_correct_answers) {
      newQuestions[qIndex].matrix_correct_answers = {};
    }
    
    // Get current correct answers for this row (should be an array)
    // Ensure it's an array, even if it might have been stored as a single number before change
    const currentRowAnswers = Array.isArray(newQuestions[qIndex].matrix_correct_answers[rowIndex])
      ? [...newQuestions[qIndex].matrix_correct_answers[rowIndex]]
      : [];
    
    if (checked) {
      // Add column to correct answers if not already there
      if (!currentRowAnswers.includes(columnIndex)) {
        newQuestions[qIndex].matrix_correct_answers[rowIndex] = [...currentRowAnswers, columnIndex];
      }
    } else {
      // Remove column from correct answers
      newQuestions[qIndex].matrix_correct_answers[rowIndex] = currentRowAnswers.filter(col => col !== columnIndex);
    }
    
    setQuestions(newQuestions);
  };

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {/* Quick Add Buttons */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Plus className="w-5 h-5" />
            Quick Add Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => addQuestion('multiple_choice')}
              variant="outline"
              size="sm"
              className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Multiple Choice
            </Button>
            <Button
              onClick={() => addQuestion('matrix')}
              variant="outline"
              size="sm"
              className="bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Matrix/Grid
            </Button>
            <Button
              onClick={() => addQuestion('ranking')}
              variant="outline"
              size="sm"
              className="bg-white border-green-300 text-green-700 hover:bg-green-100"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Ranking
            </Button>
          </div>
        </CardContent>
      </Card>

      {questions.map((q, qIndex) => (
        <Card 
          key={qIndex} 
          className={`border-2 transition-all duration-200 ${
            expandedQuestion === qIndex ? 'border-blue-500 shadow-lg' : 'border-gray-200'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 items-center">
                  <button
                    onClick={() => qIndex > 0 && moveQuestion(qIndex, qIndex - 1)}
                    disabled={qIndex === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-colors"
                    title="Move question up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => qIndex < questions.length - 1 && moveQuestion(qIndex, qIndex + 1)}
                    disabled={qIndex === questions.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-colors"
                    title="Move question down"
                  >
                    ▼
                  </button>
                </div>
                <div 
                  className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? -1 : qIndex)}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">{qIndex + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      Question {qIndex + 1}
                      {q.question && q.question.replace(/<[^>]*>/g, '').trim() !== '' && (
                        <span className="text-sm text-gray-500 ml-2 font-normal">
                          ({q.question.replace(/<[^>]*>/g, '').substring(0, 50)}{q.question.replace(/<[^>]*>/g, '').length > 50 ? '...' : ''})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 
                       q.question_type === 'matrix' ? 'Matrix/Grid' : 'Ranking'} • {q.points || 1} point(s)
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? -1 : qIndex)}
                  variant="ghost"
                  size="sm"
                  title={expandedQuestion === qIndex ? "Collapse question" : "Expand question"}
                  className="flex-shrink-0"
                >
                  {expandedQuestion === qIndex ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => duplicateQuestion(qIndex)}
                  variant="ghost"
                  size="sm"
                  title="Duplicate question"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => removeQuestion(qIndex)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  title="Remove question"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedQuestion === qIndex && (
            <CardContent className="space-y-4 pt-0">
              {/* Question Type and Points */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Question Type</Label>
                  <Select
                    value={q.question_type || 'multiple_choice'}
                    onValueChange={(val) => handleQuestionChange(qIndex, 'question_type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="matrix">Matrix / Checkbox Grid</SelectItem>
                      <SelectItem value="ranking">Ordered Response / Ranking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Points</Label>
                  <Input
                    type="number"
                    min="1"
                    value={q.points || 1}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Question Text Editor */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Question Text</Label>
                <ReactQuill
                  theme="snow"
                  value={q.question}
                  onChange={(value) => handleQuestionChange(qIndex, 'question', value)}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter your question here..."
                  className="bg-white"
                />
              </div>

              {/* Image Upload Section - Enhanced */}
              <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                <CardContent className="p-4">
                  <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Question Image (Optional)
                  </Label>
                  
                  {q.image_url ? (
                    <div className="space-y-3">
                      <div className="relative group">
                        <img 
                          src={q.image_url} 
                          alt="Question" 
                          className="max-w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleQuestionChange(qIndex, 'image_url', '')}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor={`image-upload-${qIndex}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                          <input
                            id={`image-upload-${qIndex}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(qIndex, file);
                            }}
                            className="hidden"
                            disabled={uploadingImage === qIndex}
                          />
                        </label>
                      </div>
                      {uploadingImage === qIndex && (
                        <div className="flex items-center justify-center text-blue-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                          <p className="text-sm">Uploading image...</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Multiple Choice Questions */}
              {q.question_type === 'multiple_choice' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Answer Options</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  {q.required_answers_count && q.required_answers_count > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        ℹ️ Students must select exactly {q.required_answers_count} answer(s)
                      </p>
                    </div>
                  )}

                  {(q.options || []).map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <Checkbox
                        checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(oIndex)}
                        onCheckedChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                        className="flex-shrink-0"
                      />
                      <Input
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className="flex-1"
                      />
                      {(q.options || []).length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="text-red-500 flex-shrink-0"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900">
                      ✓ {q.correct_answer?.length || 0} correct answer(s) selected
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Required Answers (Optional)</Label>
                    <Input
                      type="number"
                      min="0"
                      max={q.options?.length || 2}
                      value={q.required_answers_count || 0}
                      onChange={(e) => handleQuestionChange(qIndex, 'required_answers_count', parseInt(e.target.value) || 0)}
                      placeholder="Leave 0 for any number"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set to 0 to allow students to select any number of answers
                    </p>
                  </div>
                </div>
              )}

              {/* Matrix Questions */}
              {q.question_type === 'matrix' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Row Labels</Label>
                    {(q.matrix_rows || []).map((row, rIndex) => (
                      <div key={rIndex} className="flex gap-2 mb-2">
                        <Input
                          placeholder={`Row ${rIndex + 1}`}
                          value={row}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            if (!newQuestions[qIndex].matrix_rows) {
                              newQuestions[qIndex].matrix_rows = [];
                            }
                            newQuestions[qIndex].matrix_rows[rIndex] = e.target.value;
                            setQuestions(newQuestions);
                          }}
                        />
                        {(q.matrix_rows || []).length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMatrixRow(qIndex, rIndex)}
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addMatrixRow(qIndex)}>
                      <Plus size={16} className="mr-2" /> Add Row
                    </Button>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Column Labels</Label>
                    {(q.matrix_columns || []).map((col, cIndex) => (
                      <div key={cIndex} className="flex gap-2 mb-2">
                        <Input
                          placeholder={`Column ${cIndex + 1}`}
                          value={col}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            if (!newQuestions[qIndex].matrix_columns) {
                              newQuestions[qIndex].matrix_columns = [];
                            }
                            newQuestions[qIndex].matrix_columns[cIndex] = e.target.value;
                            setQuestions(newQuestions);
                          }}
                        />
                        {(q.matrix_columns || []).length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMatrixColumn(qIndex, cIndex)}
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addMatrixColumn(qIndex)}>
                      <Plus size={16} className="mr-2" /> Add Column
                    </Button>
                  </div>

                  {/* Matrix Correct Answers Grid */}
                  {q.matrix_rows && q.matrix_rows.length > 0 && q.matrix_columns && q.matrix_columns.length > 0 && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <Label className="text-sm font-medium mb-3 block">Select Correct Answer(s) for Each Row</Label>
                      <p className="text-xs text-gray-600 mb-4">You can select multiple correct answers per row</p>
                      
                      <div className="space-y-4">
                        {q.matrix_rows.map((row, rIndex) => {
                          const currentRowCorrectAnswers = q.matrix_correct_answers?.[rIndex] || [];
                          const displayCount = Array.isArray(currentRowCorrectAnswers) ? currentRowCorrectAnswers.length : 0;
                          
                          return (
                            <div key={rIndex} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                              <p className="text-sm font-bold text-gray-800 mb-3">{row || `Row ${rIndex + 1}`}</p>
                              <div className="space-y-2">
                                {q.matrix_columns.map((col, cIndex) => {
                                  const isCorrect = Array.isArray(currentRowCorrectAnswers) && currentRowCorrectAnswers.includes(cIndex);
                                  
                                  return (
                                    <label
                                      key={cIndex}
                                      className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isCorrect}
                                        onCheckedChange={(checked) => handleMatrixCorrectAnswer(qIndex, rIndex, cIndex, checked)}
                                      />
                                      <span className="text-sm text-gray-700">{col || `Column ${cIndex + 1}`}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-blue-600 font-medium mt-2">
                                ✓ {displayCount} correct answer(s) selected for this row
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ranking Questions */}
              {q.question_type === 'ranking' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Items to Rank (in correct order)</Label>
                  {(q.options || []).map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <GripVertical size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-500 w-6 flex-shrink-0">{oIndex + 1}.</span>
                      <Input
                        placeholder={`Item ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className="flex-1"
                      />
                      {(q.options || []).length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="text-red-500 flex-shrink-0"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(qIndex)}
                    className="w-full"
                  >
                    <Plus size={16} className="mr-2" /> Add Item
                  </Button>
                  <p className="text-xs text-gray-500">Students will need to arrange these in the correct order shown above</p>
                </div>
              )}

              {/* Explanation */}
              <div>
                <Label className="text-sm font-medium">Explanation (shown after answer)</Label>
                <Textarea
                  placeholder="Explain why this is the correct answer..."
                  value={q.explanation || ''}
                  onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Rationale Video */}
              <div>
                <Label className="text-sm font-medium">Rationale Video URL (optional)</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=... or video URL"
                  value={q.rationale_video_url || ''}
                  onChange={(e) => handleQuestionChange(qIndex, 'rationale_video_url', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add a video explaining the correct answer
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {questions.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">No questions added yet</p>
            <p className="text-sm text-gray-500 mb-4">Click the buttons above to add your first question</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const QuizForm = ({ quiz, setQuiz, videos, modules, courses }) => {
  const [courseVideos, setCourseVideos] = useState([]);
  const [availableModulesForCourse, setAvailableModulesForCourse] = useState([]);

  useEffect(() => {
    if (quiz?.course_id) {
      const filteredVideos = videos.filter(v => v.course_id === quiz.course_id);
      setCourseVideos(filteredVideos);
      
      const filteredModules = modules.filter(m => m.course_id === quiz.course_id);
      setAvailableModulesForCourse(filteredModules);
    } else {
      setCourseVideos([]);
      setAvailableModulesForCourse([]);
    }
  }, [quiz?.course_id, videos, modules]);

  const safeQuiz = quiz || {};

  return (
    <div className="space-y-4">
      <Input
        placeholder="Quiz Title"
        value={safeQuiz.title || ''}
        onChange={(e) => setQuiz({...safeQuiz, title: e.target.value})}
      />
      <Textarea
        placeholder="Description"
        value={safeQuiz.description || ''}
        onChange={(e) => setQuiz({...safeQuiz, description: e.target.value})}
      />
      
      <div>
        <Label className="text-sm font-medium mb-2 block">Start Date & Time (Optional)</Label>
        <Input
          type="datetime-local"
          value={safeQuiz.start_date ? new Date(safeQuiz.start_date).toISOString().slice(0, 16) : ''}
          onChange={(e) => setQuiz({...safeQuiz, start_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
        />
        <p className="text-xs text-gray-500 mt-1">Quiz will only be available after this date/time</p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="requires_video"
          checked={safeQuiz.requires_video_completion || false}
          onCheckedChange={(checked) => setQuiz({...safeQuiz, requires_video_completion: checked})}
        />
        <Label htmlFor="requires_video" className="text-sm font-medium cursor-pointer">
          Require video completion before taking quiz
        </Label>
      </div>

      {safeQuiz.requires_video_completion && courseVideos.length > 0 && (
        <div className="border rounded-lg p-3 space-y-2">
          <Label className="text-sm font-medium">Select Required Videos</Label>
          {courseVideos.map(video => (
            <div key={video.id} className="flex items-center space-x-2">
              <Checkbox
                id={`video-${video.id}`}
                checked={safeQuiz.prerequisite_video_ids?.includes(video.id) || false}
                onCheckedChange={(checked) => {
                  const currentIds = safeQuiz.prerequisite_video_ids || [];
                  const newIds = checked
                    ? [...currentIds, video.id]
                    : currentIds.filter(id => id !== video.id);
                  setQuiz({...safeQuiz, prerequisite_video_ids: newIds});
                }}
              />
              <Label htmlFor={`video-${video.id}`} className="text-sm cursor-pointer">
                {video.title}
              </Label>
            </div>
          ))}
        </div>
      )}

      {safeQuiz.requires_video_completion && courseVideos.length === 0 && safeQuiz.course_id && (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-3">
          <p className="text-sm text-orange-800">
            No videos available in this course. Add videos first or disable video requirement.
          </p>
        </div>
      )}

      <Input
        type="number"
        placeholder="Time Limit (minutes)"
        value={safeQuiz.time_limit_minutes || ''}
        onChange={(e) => setQuiz({...safeQuiz, time_limit_minutes: Number(e.target.value) || null})}
      />
      <Input
        type="number"
        placeholder="Passing Score (%)"
        value={safeQuiz.passing_score || ''}
        onChange={(e) => setQuiz({...safeQuiz, passing_score: Number(e.target.value) || null})}
      />
      <div>
        <Input
          type="number"
          placeholder="Max Attempts"
          value={safeQuiz.max_attempts || ''}
          onChange={(e) => setQuiz({...safeQuiz, max_attempts: Number(e.target.value) || null})}
        />
        <p className="text-xs text-gray-500 mt-1">Leave blank or enter 0 for unlimited attempts.</p>
      </div>

      {/* Rationale Video Section */}
      <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
        <Label className="text-base font-bold text-purple-900 mb-3 block flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quiz Rationale Video
        </Label>
        <p className="text-sm text-purple-800 mb-3">
          Add a comprehensive rationale video that explains all answers for this quiz. Students can watch this after completing the quiz or exhausting all attempts.
        </p>
        <Input
          placeholder="Enter rationale video URL (YouTube, Google Drive, or direct link)"
          value={safeQuiz.rationale_video_url || ''}
          onChange={(e) => setQuiz({...safeQuiz, rationale_video_url: e.target.value})}
          className="bg-white"
        />
        <p className="text-xs text-purple-700 mt-2">
          💡 This single video will be available to students after they complete the quiz or use all their attempts
        </p>
      </div>

      <QuestionManager
        questions={safeQuiz.questions || []}
        setQuestions={(qs) => setQuiz({...safeQuiz, questions: qs})}
        videos={courseVideos}
      />
    </div>
  );
};

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [quizStats, setQuizStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [preselectedSectionId, setPreselectedSectionId] = useState(null);
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionId = urlParams.get('section_id');
    if (sectionId) {
      setPreselectedSectionId(sectionId);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (getUserRole(user) !== 'admin') {
        window.location.href = '/';
        return;
      }

      const [allQuizzes, allCourses, allVideos, allAttempts, allSections, allModules] = await Promise.all([
        Quiz.list(),
        Course.list(),
        Video.list(),
        QuizAttempt.list(),
        Section.list(),
        Module.list()
      ]);
      setQuizzes(allQuizzes);
      setCourses(allCourses);
      setVideos(allVideos);
      setSections(allSections);
      setModules(allModules);

      const stats = allAttempts.reduce((acc, attempt) => {
        if (!acc[attempt.quiz_id]) acc[attempt.quiz_id] = new Set();
        acc[attempt.quiz_id].add(attempt.student_id);
        return acc;
      }, {});
      setQuizStats(stats);

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingQuiz) return;
    
    setSaveError('');
    
    if (!editingQuiz.title || editingQuiz.title.trim() === '') {
      setSaveError('Quiz title is required.');
      return;
    }
    
    if (!editingQuiz.course_id) {
      setSaveError('Please select a course for the quiz.');
      return;
    }

    // New: Validate module_id if course_id is set and modules exist for that course
    const modulesForCourse = modules.filter(m => m.course_id === editingQuiz.course_id);
    if (modulesForCourse.length > 0 && !editingQuiz.module_id) {
        setSaveError('Please assign the quiz to a module within the selected course, or select a course without modules.');
        return;
    }
    
    if (!editingQuiz.questions || editingQuiz.questions.length === 0) {
      setSaveError('Please add at least one question to the quiz.');
      return;
    }
    
    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const q = editingQuiz.questions[i];

      // Question text can be empty if it's just an image, but if it has content, it should not be just whitespace
      // ReactQuill returns '<p><br></p>' for empty content, check for that or empty string
      const isEmptyQuestion = !q.question || q.question.replace(/<[^>]*>/g, '').trim() === '';
      if (isEmptyQuestion && !q.image_url) { // If question text is empty AND no image URL, then it's an invalid question
        setSaveError(`Question ${i + 1} is missing both question text and an image.`);
        return;
      }

      if (!q.points || q.points < 1) {
        setSaveError(`Question ${i + 1} must have at least 1 point.`);
        return;
      }
      
      if (q.question_type === 'multiple_choice') {
        if (!q.options || q.options.length < 2 || q.options.some(opt => opt.trim() === '')) {
          setSaveError(`Question ${i + 1} needs at least 2 non-empty answer options.`);
          return;
        }
        
        if (!q.correct_answer || q.correct_answer.length === 0) {
          setSaveError(`Question ${i + 1} needs at least one correct answer selected.`);
          return;
        }

        const requiredAnswers = q.required_answers_count || 0; // 0 means any number of answers
        if (requiredAnswers > 0 && q.correct_answer.length !== requiredAnswers) {
          setSaveError(`Question ${i + 1}: Please select exactly ${requiredAnswers} correct answer(s) as specified in 'Required Answers'.`);
          return;
        }

      } else if (q.question_type === 'matrix') {
        if (!q.matrix_rows || (q.matrix_rows || []).length === 0 || (q.matrix_rows || []).some(row => row.trim() === '')) {
          setSaveError(`Question ${i + 1} needs at least one non-empty row label.`);
          return;
        }
        if (!q.matrix_columns || (q.matrix_columns || []).length < 2 || (q.matrix_columns || []).some(col => col.trim() === '')) {
          setSaveError(`Question ${i + 1} needs at least 2 non-empty column labels.`);
          return;
        }
        if (!q.matrix_correct_answers) {
          setSaveError(`Question ${i + 1}: Please select at least one correct answer for each row in the matrix.`);
          return;
        }
        
        // Validate each row has at least one correct answer selected
        for (let r = 0; r < q.matrix_rows.length; r++) {
          const rowAnswers = q.matrix_correct_answers[r];
          if (!Array.isArray(rowAnswers) || rowAnswers.length === 0) {
            setSaveError(`Question ${i + 1}: Please select at least one correct answer for row "${q.matrix_rows[r] || `Row ${r + 1}`}".`);
            return;
          }
        }
        
      } else if (q.question_type === 'ranking') {
        if (!q.options || (q.options || []).length < 2 || (q.options || []).some(opt => opt.trim() === '')) {
          setSaveError(`Question ${i + 1} needs at least 2 non-empty items to rank.`);
          return;
        }
      }
    }
    
    try {
      const quizData = { ...editingQuiz };
      
      quizData.questions = quizData.questions.map(q => {
        if (q.question_type === 'ranking') {
          q.ranking_correct_order = (q.options || []).map((_, index) => index);
        }
        // Filter out empty options/rows/columns before saving
        if (q.options) q.options = q.options.filter(opt => opt.trim() !== '');
        if (q.matrix_rows) q.matrix_rows = q.matrix_rows.filter(row => row.trim() !== '');
        if (q.matrix_columns) q.matrix_columns = q.matrix_columns.filter(col => col.trim() !== '');
        
        // Ensure rationale_video_url is null if empty string
        if (q.rationale_video_url === '') q.rationale_video_url = null;
        // Ensure image_url is null if empty string
        if (q.image_url === '') q.image_url = null;

        return q;
      });

      // Set number fields to null if empty
      if (!quizData.time_limit_minutes) quizData.time_limit_minutes = null;
      if (!quizData.passing_score) quizData.passing_score = null;
      if (!quizData.max_attempts) quizData.max_attempts = null;
      
      // Handle prerequisite_video_ids based on requires_video_completion
      if (quizData.prerequisite_video_ids && quizData.prerequisite_video_ids.length === 0) quizData.prerequisite_video_ids = null;
      if (!quizData.requires_video_completion) {
        quizData.prerequisite_video_ids = null;
      }

      // Handle quiz-level rationale video URL
      if (!quizData.rationale_video_url || quizData.rationale_video_url.trim() === '') {
        quizData.rationale_video_url = null;
      }

      if (quizData.id) {
        await Quiz.update(quizData.id, quizData);
      } else {
        await Quiz.create(quizData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingQuiz(null);
      setSaveError('');
    } catch (error) {
      console.error("Error saving quiz:", error);
      setSaveError(error.message || 'Failed to save quiz. Please check all required fields.');
    }
  };

  const handleDelete = async () => {
    if (!editingQuiz) return;
    try {
      await Quiz.delete(editingQuiz.id);
      await loadData();
      setIsDeleteModalOpen(false);
      setEditingQuiz(null);
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  const openAddModal = () => {
    setEditingQuiz({ 
      title: '',
      description: '',
      course_id: '',
      module_id: null,
      section_id: preselectedSectionId || null,
      questions: [],
      time_limit_minutes: 30,
      passing_score: 60,
      max_attempts: 3,
      requires_video_completion: false,
      prerequisite_video_ids: [],
      start_date: null,
      rationale_video_url: null
    });
    setSaveError('');
    setIsModalOpen(true);
  };

  const openEditModal = (quiz) => {
    setEditingQuiz({...quiz});
    setSaveError('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (quiz) => {
    setEditingQuiz({...quiz});
    setIsDeleteModalOpen(true);
  };

  const getCourseTitle = (courseId) => courses.find(c => c.id === courseId)?.title || 'N/A';
  const getModuleTitle = (moduleId) => modules.find(m => m.id === moduleId)?.title || 'N/A';

  const createPageUrl = (pageNameAndParams) => {
    return `/${pageNameAndParams}`;
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(quiz => {
    if (selectedCourse !== 'all' && quiz.course_id !== selectedCourse) return false;
    if (selectedModule !== 'all' && quiz.module_id !== selectedModule) return false;
    return true;
  });

  // Get modules for selected course
  const availableModules = selectedCourse !== 'all' 
    ? modules.filter(m => m.course_id === selectedCourse)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">Loading quizzes...</p>
      </div>
    );
  }

  if (currentUser && getUserRole(currentUser) !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Quiz Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Create and manage course assessments</p>
          </div>
          <Button onClick={openAddModal} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
            <PlusCircle className="w-5 h-5 mr-2" /> Add Quiz
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-100">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Course</Label>
              <Select value={selectedCourse} onValueChange={(value) => {
                setSelectedCourse(value);
                setSelectedModule('all');
              }}>
                <SelectTrigger className="border-2 border-gray-200 focus:border-purple-500">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Module</Label>
              <Select 
                value={selectedModule} 
                onValueChange={setSelectedModule}
                disabled={selectedCourse === 'all' || availableModules.length === 0}
              >
                <SelectTrigger className="border-2 border-gray-200 focus:border-purple-500">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {availableModules.map(module => (
                    <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">All Quizzes</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                <TableHead className="font-bold text-gray-900">Title</TableHead>
                <TableHead className="font-bold text-gray-900">Course</TableHead>
                <TableHead className="font-bold text-gray-900">Module</TableHead>
                <TableHead className="font-bold text-gray-900">Questions</TableHead>
                <TableHead className="font-bold text-gray-900">Type</TableHead>
                <TableHead className="font-bold text-gray-900">Participants</TableHead>
                <TableHead className="text-right font-bold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes.length > 0 ? (
                filteredQuizzes.map((quiz) => {
                  const questionTypes = quiz.questions?.map(q => q.question_type || 'multiple_choice');
                  const hasMultipleTypes = new Set(questionTypes).size > 1;
                  return (
                    <TableRow key={quiz.id} className="hover:bg-purple-50 transition-colors">
                      <TableCell className="font-semibold">
                        <Link 
                          to={createPageUrl(`QuizPreview?id=${quiz.id}`)}
                          className="text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          {quiz.title}
                        </Link>
                      </TableCell>
                      <TableCell>{getCourseTitle(quiz.course_id)}</TableCell>
                      <TableCell>{quiz.module_id ? getModuleTitle(quiz.module_id) : '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {quiz.questions?.length || 0} questions
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          hasMultipleTypes ? 'bg-purple-100 text-purple-800' : 
                          questionTypes[0] === 'matrix' ? 'bg-green-100 text-green-800' :
                          questionTypes[0] === 'ranking' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {hasMultipleTypes ? 'Mixed' : (questionTypes[0] === 'matrix' ? 'Matrix' : questionTypes[0] === 'ranking' ? 'Ranking' : 'Multiple Choice')}
                        </span>
                      </TableCell>
                      <TableCell className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-500" /> 
                        <span className="font-semibold">{quizStats[quiz.id]?.size || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Link to={createPageUrl(`QuizPreview?id=${quiz.id}`)} className="flex items-center w-full">
                                <FileText className="w-4 h-4 mr-2" /> Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(quiz)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => openDeleteModal(quiz)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  {selectedCourse !== 'all' || selectedModule !== 'all' ? 'No quizzes match the selected filters.' : 'No quizzes found.'}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingQuiz?.id ? 'Edit' : 'Add'} Quiz</DialogTitle></DialogHeader>
          
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <X className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error saving quiz</p>
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            </div>
          )}
          
          <div className="py-4 space-y-4">
            <Select 
              value={editingQuiz?.course_id || ''} 
              onValueChange={(value) => {
                setEditingQuiz({...editingQuiz, course_id: value, module_id: null});
              }}
            >
              <SelectTrigger className={!editingQuiz?.course_id ? 'border-red-300' : ''}>
                <SelectValue placeholder="Select Course *" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {!editingQuiz?.course_id && (
              <p className="text-xs text-red-500 mt-1">Please select a course</p>
            )}

            {/* Module selection */}
            <Select 
              value={editingQuiz?.module_id || ''} 
              onValueChange={(value) => setEditingQuiz({...editingQuiz, module_id: value})}
              disabled={!editingQuiz?.course_id || modules.filter(m => m.course_id === editingQuiz.course_id).length === 0}
            >
              <SelectTrigger className={modules.filter(m => m.course_id === editingQuiz?.course_id).length > 0 && !editingQuiz?.module_id ? 'border-red-300' : ''}>
                <SelectValue placeholder="Assign to Module (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Module</SelectItem>
                {modules
                  .filter(m => m.course_id === editingQuiz?.course_id)
                  .map(module => (
                    <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modules.filter(m => m.course_id === editingQuiz?.course_id).length > 0 && !editingQuiz?.module_id && (
              <p className="text-xs text-red-500 mt-1">Please assign a module if one is available for the selected course, or select "No Module".</p>
            )}

            <Select 
              value={editingQuiz?.section_id || ''} 
              onValueChange={(value) => setEditingQuiz({...editingQuiz, section_id: value})}
            >
              <SelectTrigger><SelectValue placeholder="Select Section (Optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Section</SelectItem>
                {sections
                  .filter(s => s.section_type === 'quiz' || s.section_type === 'other')
                  .map(section => (
                  <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <QuizForm
              quiz={editingQuiz}
              setQuiz={setEditingQuiz}
              videos={videos}
              modules={modules}
              courses={courses}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              setSaveError('');
            }}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{editingQuiz?.title}"?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
