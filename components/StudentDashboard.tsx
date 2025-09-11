import React, { useState, useEffect } from 'react';
import { User, Quiz, QuizAttempt } from '../types';
import { View } from './Dashboard';
import { LogOut, Play, Trophy, Clock, Target, TrendingUp, Star, Book } from 'lucide-react';
import { db } from '../utils/database';

interface StudentDashboardProps {
  user: User;
  quizzes: Quiz[];
  onLogout: () => void;
  onViewChange: (view: View, quiz?: Quiz) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  quizzes,
  onLogout,
  onViewChange,
}) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAttempts();
  }, [user.id]);

  const loadAttempts = async () => {
    try {
      const userAttempts = await db.getAttempts(user.id);
      setAttempts(userAttempts);
    } catch (error) {
      console.error('Failed to load attempts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuizStats = () => {
    const totalQuizzes = quizzes.length;
    const completedQuizzes = [...new Set(attempts.map(a => a.quizId))].length;
    const avgScore = attempts.length > 0 
      ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length 
      : 0;
    const bestScore = attempts.length > 0 
      ? Math.max(...attempts.map(a => a.percentage)) 
      : 0;

    return {
      totalQuizzes,
      completedQuizzes,
      avgScore: Math.round(avgScore),
      bestScore: Math.round(bestScore)
    };
  };

  const getQuizAttempt = (quizId: string) => {
    return attempts
      .filter(a => a.quizId === quizId)
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0];
  };

  const stats = getQuizStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Smart Quiz</h1>
                <p className="text-sm text-gray-500">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}!</h2>
          <p className="text-blue-100 text-lg">Ready to challenge yourself with some quizzes?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Quizzes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Book className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedQuizzes}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgScore}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.bestScore}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Available Quizzes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Available Quizzes</h3>
            <p className="text-gray-600 mt-1">Start taking quizzes to improve your knowledge</p>
          </div>
          
          <div className="p-6">
            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-medium text-gray-900 mb-2">No Quizzes Available</h4>
                <p className="text-gray-500">Check back later for new quizzes to take.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quizzes.map((quiz) => {
                  const attempt = getQuizAttempt(quiz.id);
                  
                  return (
                    <div
                      key={quiz.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {quiz.title}
                            </h4>
                            {attempt && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                attempt.passed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{quiz.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-1" />
                              {quiz.questions.length} questions
                            </div>
                            {quiz.timeLimit && (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {quiz.timeLimit} minutes
                              </div>
                            )}
                            {attempt && (
                              <div className="flex items-center">
                                <Trophy className="w-4 h-4 mr-1" />
                                Best: {attempt.percentage}%
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => onViewChange('take-quiz', quiz)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {attempt ? 'Retake' : 'Start'}
                          </button>
                          
                          {attempt && (
                            <button
                              onClick={() => onViewChange('results', quiz)}
                              className="flex items-center px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              Results
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
