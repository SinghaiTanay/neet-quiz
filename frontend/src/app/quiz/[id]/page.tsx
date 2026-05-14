"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Check, X, Maximize2, Minimize2, BookOpen } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  subject: string;
  chapter: string;
  chapter_name: string;
  difficulty: string;
}

interface QuizData {
  quiz_id: string;
  questions: Question[];
  time_limit: number;
  mode: string;
  config: object;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedReview, setMarkedReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load quiz data
  useEffect(() => {
    const stored = localStorage.getItem("currentQuiz");
    if (stored) {
      const data: QuizData = JSON.parse(stored);
      setQuizData(data);
      setTimeLeft(data.time_limit);

      // Restore saved state
      const savedState = localStorage.getItem(`quiz_${data.quiz_id}`);
      if (savedState) {
        const { answers: savedAnswers, markedReview: savedMarked, currentQuestion: savedQ } = JSON.parse(savedState);
        setAnswers(savedAnswers || {});
        setMarkedReview(savedMarked || {});
        setCurrentQuestion(savedQ || 0);
      }
    } else {
      router.push("/configure");
    }
  }, [router]);

  // Timer
  useEffect(() => {
    if (quizData && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizData, timeLeft]);

  // Save state periodically
  useEffect(() => {
    if (quizData) {
      localStorage.setItem(
        `quiz_${quizData.quiz_id}`,
        JSON.stringify({ answers, markedReview, currentQuestion })
      );
    }
  }, [answers, markedReview, currentQuestion, quizData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "4") {
        handleAnswerSelect(parseInt(e.key) - 1);
      } else if (e.key === "r" || e.key === "R") {
        toggleMarkReview();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (currentQuestion === (quizData?.questions.length || 0) - 1) {
          setShowSubmitConfirm(true);
        } else {
          goToNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, quizData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: optionIndex,
    }));
  };

  const toggleMarkReview = () => {
    setMarkedReview((prev) => ({
      ...prev,
      [currentQuestion]: !prev[currentQuestion],
    }));
  };

  const goToNext = () => {
    if (quizData && currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setShowMobilePalette(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getQuestionStatus = (index: number) => {
    if (markedReview[index]) return "marked";
    if (answers[index] !== undefined) return "answered";
    return "unanswered";
  };

  const handleSubmit = async () => {
    if (!quizData) return;

    const timeTaken = quizData.time_limit - timeLeft;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/submit-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quiz_id: quizData.quiz_id,
            answers,
            time_taken: timeTaken,
          }),
        }
      );

      const result = await res.json();
      localStorage.setItem("quizResult", JSON.stringify(result));
      localStorage.removeItem(`quiz_${quizData.quiz_id}`);
      localStorage.removeItem("currentQuiz");

      router.push("/results");
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  };

  if (!quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full" />
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-gray-900">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                question.subject === "physics" ? "bg-blue-100 text-blue-800" :
                question.subject === "chemistry" ? "bg-green-100 text-green-800" :
                question.subject === "botany" ? "bg-emerald-100 text-emerald-800" :
                "bg-orange-100 text-orange-800"
              }`}>
                {question.subject}
              </span>
              <span className="text-xs text-gray-500">{question.chapter_name}</span>
              {(question as any).pyq_year && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  PYQ {(question as any).pyq_year}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
              timeLeft < 60 ? "bg-red-100 text-red-800" : timeLeft < 300 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Question Panel */}
        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            {/* Question Text */}
            <div className="text-lg text-gray-900 mb-6 leading-relaxed">
              {question.question}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${
                    answers[currentQuestion] === index
                      ? "border-blue-800 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium shrink-0 ${
                    answers[currentQuestion] === index
                      ? "border-blue-800 bg-blue-800 text-white"
                      : "border-gray-300 text-gray-600"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={goToPrevious}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={toggleMarkReview}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  markedReview[currentQuestion]
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {markedReview[currentQuestion] ? "Marked for Review" : "Mark for Review"}
              </button>

              {currentQuestion === quizData.questions.length - 1 ? (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  Submit Test
                </button>
              ) : (
                <button
                  onClick={goToNext}
                  className="flex items-center gap-2 bg-blue-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-900"
                >
                  Save & Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Question Palette - Desktop */}
        <aside className="hidden lg:block w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Question Palette</h3>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-gray-400 rounded" /> Unvisited
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-500 rounded" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-purple-500 rounded" /> Marked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-red-500 rounded" /> Unanswered
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-5 gap-2">
            {quizData.questions.map((_, index) => {
              const status = getQuestionStatus(index);
              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    index === currentQuestion
                      ? "ring-2 ring-blue-800 ring-offset-2"
                      : ""
                  } ${
                    status === "answered" ? "bg-green-500 text-white" :
                    status === "marked" ? "bg-purple-500 text-white" :
                    status === "unanswered" && answers[index] === undefined ? "bg-red-500 text-white" :
                    "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Answered</span>
              <span className="font-medium">{Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Marked</span>
              <span className="font-medium">{Object.keys(markedReview).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Unanswered</span>
              <span className="font-medium">
                {quizData.questions.length - Object.keys(answers).length}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
          >
            Submit Test
          </button>
        </aside>
      </div>

      {/* Mobile Palette Toggle */}
      <button
        onClick={() => setShowMobilePalette(true)}
        className="lg:hidden fixed bottom-4 right-4 w-14 h-14 bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <BookOpen className="w-6 h-6" />
      </button>

      {/* Mobile Palette Drawer */}
      {showMobilePalette && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobilePalette(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Question Palette</h3>
              <button onClick={() => setShowMobilePalette(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {quizData.questions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${
                      index === currentQuestion ? "ring-2 ring-blue-800" : ""
                    } ${
                      status === "answered" ? "bg-green-500 text-white" :
                      status === "marked" ? "bg-purple-500 text-white" :
                      status === "unanswered" && answers[index] === undefined ? "bg-red-500 text-white" :
                      "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setShowMobilePalette(false); setShowSubmitConfirm(true); }}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium"
            >
              Submit Test
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Submit Quiz?</h3>
            </div>
            <div className="text-gray-600 mb-6">
              <p className="mb-2">You have answered <span className="font-semibold">{Object.keys(answers).length}</span> out of <span className="font-semibold">{quizData.questions.length}</span> questions.</p>
              {quizData.questions.length - Object.keys(answers).length > 0 && (
                <p className="text-red-600 text-sm">
                  {quizData.questions.length - Object.keys(answers).length} unanswered questions will be marked as incorrect.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Review Questions
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}