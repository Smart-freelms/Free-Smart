import React, { useState, useEffect } from 'react';
import { Quiz, User, QuizAttempt } from '../types';
import { ArrowLeft, Users, TrendingUp, Clock, Target, Download, Filter } from 'lucide-react';
import { db } from '../utils/database';

interface QuizResultsProps {
  quiz: Quiz;
  user: User;
  onBack: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ quiz, user, onBack }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    loadAttempts();
  }, [quiz.id, user]);

  const loadAttempts = async () => {
    try {
      if (user.role === 'teacher') {
        const allAttempts = await db.getQuizAttempts(quiz.id);
        setAttempts(allAttempts);
      } else {
        const userAttempts = await db.getAttempts(user.id);
        setAttempts(userAttempts.filter(a => a.quizId === quiz.id));
      }
    } catch (error) {
      console.error('Failed to load attempts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = () => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        avgScore: 0,
        highestScore: 0,
        passRate: 0,
        avgTime: 0
      };
    }

    const totalAttempts = attempts.length;
    const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts);
    const highestScore = Math.max(...attempts.map(a => a.percentage));
    const passedAttempts = attempts.filter(a => a.passed).length;
    const passRate = Math.round((passedAttempts / totalAttempts) * 100);
    const avgTime = Math.round(attempts.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts);

    return {
      totalAttempts,
      avgScore,
      highestScore,
      passRate,
      avgTime
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const sortedAttempts = [...attempts].sort((a, b) => {
    if (sortBy === 'score') {
      return b.percentage - a.percentage;
    }
    return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
  });

  const stats = getStats();

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
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-500">Quiz Results & Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgScore}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.highestScore}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.passRate}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Time</p>
                <p className="text-3xl font-bold text-gray-900">{formatTime(stats.avgTime)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Attempts List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {user.role === 'teacher' ? 'All Attempts' : 'Your Attempts'}
              </h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 text-gray-400 mr-2" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="score">Sort by Score</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {attempts.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-medium text-gray-900 mb-2">No Attempts Yet</h4>
                <p className="text-gray-500">
                  {user.role === 'teacher' 
                    ? 'No students have taken this quiz yet.'
                    : 'You haven\'t taken this quiz yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAttempts.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            attempt.passed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(attempt.endTime).toLocaleDateString()} at{' '}
                            {new Date(attempt.endTime).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                          <div>
                            <p className="text-gray-600">Score</p>
                            <p className="font-semibold text-lg">{attempt.percentage}%</p>
                            <p className="text-xs text-gray-500">
                              {attempt.score}/{attempt.totalPoints} points
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time Spent</p>
                            <p className="font-semibold">{formatTime(attempt.timeSpent)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Started</p>
                            <p className="font-semibold">
                              {new Date(attempt.startTime).toLocaleTimeString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Completed</p>
                            <p className="font-semibold">
                              {new Date(attempt.endTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
