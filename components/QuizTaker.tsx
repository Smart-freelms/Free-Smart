import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, User, Question, QuizAttempt, QuizResult } from '../types';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, ArrowRight, Flag } from 'lucide-react';
import { db } from '../utils/database';

interface QuizTakerProps {
  quiz: Quiz;
  user: User;
  onComplete: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, user, onComplete }) => {
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, string[]>>({});

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<QuizResult | null>(null);

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      await db.init();
      const session = await db.getQuizSession(quiz.id, user.id);

      let initialQuestions = quiz.questions;
      let initialOptions: Record<string, string[]> = {};

      if (session) {
        setAnswers(session.answers);
        setCurrentQuestionIndex(session.currentQuestionIndex);
        if (session.timeRemaining !== undefined) setTimeRemaining(session.timeRemaining);
        setStartTime(new Date(session.startTime));

        // Restore question order
        if (session.questionOrder) {
          const questionMap = new Map(quiz.questions.map(q => [q.id, q]));
          initialQuestions = session.questionOrder
            .map((id: string) => questionMap.get(id))
            .filter(Boolean) as Question[];
        }

        // Restore option order
        if (session.optionsMap) {
          initialOptions = session.optionsMap;
        }
      } else {
        setStartTime(new Date());
        if (quiz.timeLimit) {
          setTimeRemaining(quiz.timeLimit * 60);
        }

        if (quiz.shuffleQuestions) {
          initialQuestions = shuffleArray(quiz.questions);
        }

        quiz.questions.forEach(q => {
          if (q.options) {
            initialOptions[q.id] = quiz.shuffleOptions ? shuffleArray(q.options) : q.options;
          }
        });
      }

      setShuffledQuestions(initialQuestions);
      setShuffledOptionsMap(initialOptions);
      setIsLoaded(true);
    };
    loadSession();
  }, [quiz.id, user.id]);

  // Save session
  useEffect(() => {
    if (!isLoaded || showResults || !startTime) return;
    const saveSession = async () => {
      await db.saveQuizSession({
        id: `${user.id}-${quiz.id}`,
        userId: user.id,
        quizId: quiz.id,
        answers,
        currentQuestionIndex,
        timeRemaining,
        startTime: startTime.toISOString(),
        questionOrder: shuffledQuestions.map(q => q.id),
        optionsMap: shuffledOptionsMap,
        updatedAt: new Date().toISOString()
      });
    };
    saveSession();
  }, [answers, currentQuestionIndex, timeRemaining, isLoaded, showResults, shuffledQuestions, shuffledOptionsMap, startTime]);

  useEffect(() => {
    const now = new Date();
    if (user.role === 'student') {
      if (quiz.scheduledPublishDate && new Date(quiz.scheduledPublishDate) > now) {
        setIsAccessDenied(true);
        setAccessError(`This quiz is scheduled to open on ${new Date(quiz.scheduledPublishDate).toLocaleString()}`);
      } else if (quiz.scheduledExpiryDate && new Date(quiz.scheduledExpiryDate) < now) {
        setIsAccessDenied(true);
        setAccessError(`This quiz expired on ${new Date(quiz.scheduledExpiryDate).toLocaleString()}`);
      }
    }
  }, [quiz, user]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining === null]);

  useEffect(() => {
    if (timeRemaining === 0 && !showResults) {
      handleSubmit();
    }
  }, [timeRemaining, showResults]);

  // Per-question timer
  useEffect(() => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (currentQuestion?.timeLimit) {
      setQuestionTimeRemaining(currentQuestion.timeLimit);
    } else {
      setQuestionTimeRemaining(null);
    }
  }, [currentQuestionIndex, shuffledQuestions]);

  useEffect(() => {
    if (questionTimeRemaining === null || questionTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setQuestionTimeRemaining(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [questionTimeRemaining === null, currentQuestionIndex]);

  useEffect(() => {
    if (questionTimeRemaining === 0 && !showResults) {
      handleNext();
    }
  }, [questionTimeRemaining, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const handleAnswerChange = (value: string | string[]) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    const detailedResults = shuffledQuestions.map(question => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        isCorrect = userAnswer === question.correctAnswer;
      } else {
        // For text-based answers, do a case-insensitive comparison
        const correctAnswer = (question.correctAnswer as string).toLowerCase().trim();
        const userAnswerText = (userAnswer as string || '').toLowerCase().trim();
        isCorrect = userAnswerText === correctAnswer;
      }

      totalPoints += question.points;
      if (isCorrect) {
        earnedPoints += question.points;
      }

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points,
        explanation: question.explanation
      };
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    return {
      earnedPoints,
      totalPoints,
      percentage,
      passed,
      detailedResults
    };
  };

  const handleSubmit = async () => {
    if (!startTime) return;
    setIsSubmitting(true);

    const endTime = new Date();
    const timeSpent = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    const score = calculateScore();

    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      quizId: quiz.id,
      userId: user.id,
      answers,
      score: score.earnedPoints,
      totalPoints: score.totalPoints,
      percentage: score.percentage,
      startTime,
      endTime,
      timeSpent,
      passed: score.passed
    };

    try {
      await db.saveAttempt(attempt);
      await db.deleteQuizSession(quiz.id, user.id);
      setResults({ attempt, ...score });
      setShowResults(true);
    } catch (error) {
      console.error('Failed to save attempt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex === shuffledQuestions.length - 1) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const getShuffledOptions = (question: Question) => {
    return shuffledOptionsMap[question.id] || question.options;
  };

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Results Header */}
          <div className={`rounded-2xl p-8 text-white mb-8 ${
            results.passed
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-red-500 to-pink-600'
          }`}>
            <div className="text-center">
              {results.passed ? (
                <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-bold mb-2">
                {results.passed ? 'Congratulations!' : 'Quiz Complete'}
              </h2>
              <p className="text-xl mb-4">
                You scored {results.percentage}% ({results.earnedPoints}/{results.totalPoints} points)
              </p>
              <p className="opacity-90">
                {results.passed
                  ? `You passed! The passing score was ${quiz.passingScore}%`
                  : `You need ${quiz.passingScore}% to pass. Keep practicing!`
                }
              </p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Results</h3>

            <div className="space-y-6">
              {results.detailedResults.map((result, index: number) => (
                <div
                  key={result.questionId}
                  className={`border rounded-lg p-4 ${
                    result.isCorrect
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 mr-2">
                        Q{index + 1}
                      </span>
                      {result.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {result.points}/{result.maxPoints} points
                    </span>
                  </div>

                  <p className="text-gray-900 font-medium mb-3">{result.question}</p>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Your answer: </span>
                      <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                        {result.userAnswer || 'No answer provided'}
                      </span>
                    </div>
                    {!result.isCorrect && (
                      <div>
                        <span className="font-medium text-gray-700">Correct answer: </span>
                        <span className="text-green-700">{result.correctAnswer}</span>
                      </div>
                    )}
                    {result.explanation && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">Explanation: </span>
                        <span className="text-blue-800">{result.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {quiz.allowRetry && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retake Quiz
              </button>
            )}
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{accessError}</p>
          <button
            onClick={onComplete}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const options = getShuffledOptions(currentQuestion);

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            {['true', 'false'].map((option) => (
              <label
                key={option}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900 capitalize">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short-answer':
      case 'fill-blank':
        return (
          <input
            type="text"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your answer here..."
          />
        );

      default:
        return null;
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading quiz session...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={onComplete}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              {timeRemaining !== null && (
                <div className="flex items-center text-orange-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-mono text-lg">
                    Total: {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              {questionTimeRemaining !== null && (
                <div className="flex items-center text-red-600 text-sm font-semibold">
                  <Clock className="w-4 h-4 mr-2" />
                  Question: {formatTime(questionTimeRemaining)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentQuestionIndex + 1) / shuffledQuestions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                Question {currentQuestionIndex + 1}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
            <Flag className="w-5 h-5 text-gray-400" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-3">
            {currentQuestionIndex === shuffledQuestions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {shuffledQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[shuffledQuestions[index].id]
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
