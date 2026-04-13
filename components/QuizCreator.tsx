import React, { useState, useEffect } from 'react';
import { User, Quiz, Question } from '../types';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { QuizTaker } from './QuizTaker';
import { db } from '../utils/database';
import { QuestionForm } from './quizzes/QuestionForm';
import { QuestionList } from './quizzes/QuestionList';
import { QuizSettings } from './quizzes/QuizSettings';

interface QuizCreatorProps {
  user: User;
  editQuizId: string | null;
  onBack: () => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ user, editQuizId, onBack }) => {
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: '',
    description: '',
    questions: [],
    timeLimit: undefined,
    allowRetry: true,
    shuffleQuestions: false,
    shuffleOptions: true,
    passingScore: 60,
    isPublished: false
  });

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1,
    timeLimit: undefined
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const mockUser: User = {
    id: 'preview-user',
    name: 'Preview Student',
    email: 'preview@example.com',
    role: 'student',
    password: '',
    createdAt: new Date(),
    isActive: true
  };

  useEffect(() => {
    if (editQuizId) {
      loadQuiz();
    }
  }, [editQuizId]);

  const loadQuiz = async () => {
    if (!editQuizId) return;

    try {
      const existingQuiz = await db.getQuizById(editQuizId);
      if (existingQuiz) {
        setQuiz(existingQuiz);
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion.question?.trim()) return;

    const newQuestion: Question = {
      id: editingIndex !== null ? quiz.questions![editingIndex].id : crypto.randomUUID(),
      type: currentQuestion.type as Question["type"],
      question: currentQuestion.question,
      options: currentQuestion.type === 'multiple-choice' ? currentQuestion.options?.filter(opt => opt.trim()) : undefined,
      correctAnswer: currentQuestion.correctAnswer!,
      explanation: currentQuestion.explanation || '',
      points: currentQuestion.points || 1,
      timeLimit: currentQuestion.timeLimit
    };

    const updatedQuestions = [...(quiz.questions || [])];
    if (editingIndex !== null) {
      updatedQuestions[editingIndex] = newQuestion;
    } else {
      updatedQuestions.push(newQuestion);
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    resetCurrentQuestion();
  };

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1,
      timeLimit: undefined
    });
    setEditingIndex(null);
  };

  const handleEditQuestion = (index: number) => {
    const question = quiz.questions![index];
    setCurrentQuestion({ ...question });
    setEditingIndex(index);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = quiz.questions?.filter((_, i) => i !== index) || [];
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleSaveQuiz = async (publish: boolean = false) => {
    if (!quiz.title?.trim() || !quiz.questions?.length) return;

    setIsLoading(true);
    try {
      const quizToSave: Quiz = {
        id: editQuizId || crypto.randomUUID(),
        title: quiz.title,
        description: quiz.description || '',
        createdBy: user.id,
        questions: quiz.questions,
        timeLimit: quiz.timeLimit,
        allowRetry: quiz.allowRetry!,
        shuffleQuestions: quiz.shuffleQuestions!,
        shuffleOptions: quiz.shuffleOptions!,
        passingScore: quiz.passingScore!,
        createdAt: editQuizId ? quiz.createdAt! : new Date(),
        updatedAt: new Date(),
        isPublished: publish,
        scheduledPublishDate: quiz.scheduledPublishDate,
        scheduledExpiryDate: quiz.scheduledExpiryDate
      };

      await db.saveQuiz(quizToSave);
      onBack();
    } catch (error) {
      console.error('Failed to save quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showPreview && quiz.title && quiz.questions && quiz.questions.length > 0) {
    return (
      <QuizTaker
        quiz={quiz as Quiz}
        user={mockUser}
        onComplete={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {editQuizId ? 'Edit Quiz' : 'Create New Quiz'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center px-4 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button
                onClick={() => handleSaveQuiz(false)}
                disabled={isLoading || !quiz.title?.trim() || !quiz.questions?.length}
                className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </button>
              <button
                onClick={() => handleSaveQuiz(true)}
                disabled={isLoading || !quiz.title?.trim() || !quiz.questions?.length}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quiz Settings */}
          <div className="lg:col-span-1">
            <QuizSettings quiz={quiz} onChange={(updates) => setQuiz({ ...quiz, ...updates })} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <QuestionForm
              currentQuestion={currentQuestion}
              editingIndex={editingIndex}
              onSave={handleSaveQuestion}
              onCancel={resetCurrentQuestion}
              onChange={(updates) => setCurrentQuestion({ ...currentQuestion, ...updates })}
            />

            {quiz.questions && quiz.questions.length > 0 && (
              <QuestionList questions={quiz.questions} onEdit={handleEditQuestion} onDelete={handleDeleteQuestion} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
