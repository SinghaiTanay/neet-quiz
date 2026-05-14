"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock, Target, BarChart3, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ResultData {
  score: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  total_questions: number;
  percentage: number;
  time_taken: number;
  subject_analysis: Record<string, { correct: number; total: number }>;
  chapter_analysis: Record<string, { correct: number; total: number; name: string }>;
  detailed_review: Array<{
    question_number: number;
    question: string;
    options: string[];
    correct_answer: number;
    user_answer: number | null;
    is_correct: boolean;
    score: number;
    explanation: string;
    subject: string;
    chapter_name: string;
  }>;
  mode: string;
}

const COLORS = ["#22c55e", "#ef4444", "#94a3b8"];

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "review">("summary");

  useEffect(() => {
    const stored = localStorage.getItem("quizResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push("/");
    }
  }, [router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full" />
      </div>
    );
  }

  const pieData = [
    { name: "Correct", value: result.correct },
    { name: "Incorrect", value: result.incorrect },
    { name: "Unanswered", value: result.unanswered },
  ];

  const subjectData = Object.entries(result.subject_analysis).map(([key, val]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    correct: val.correct,
    total: val.total,
    percentage: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
  }));

  const getScoreColor = () => {
    if (result.percentage >= 70) return "text-green-600";
    if (result.percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-gray-900">NEET Quiz Results</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/configure")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
              New Quiz
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Score Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Score</h2>
            <div className={`text-5xl font-bold ${getScoreColor()}`}>
              {result.score}
            </div>
            <div className="text-gray-500 mt-2">
              {result.percentage}% • {result.correct} correct • {result.incorrect} incorrect
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{result.correct}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <X className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{result.incorrect}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{result.unanswered}</div>
              <div className="text-sm text-gray-600">Unanswered</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{formatTime(result.time_taken)}</div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "summary" ? "bg-blue-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analysis
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "review" ? "bg-blue-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Answer Review
          </button>
        </div>

        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Question Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject Analysis */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="subject" width={80} />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Subject Breakdown</h3>
              <div className="space-y-4">
                {subjectData.map((item) => (
                  <div key={item.subject}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900">{item.subject}</span>
                      <span className="text-gray-600">{item.correct}/{item.total} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.percentage >= 70 ? "bg-green-500" :
                          item.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter Breakdown */}
            {Object.keys(result.chapter_analysis).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Chapter Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(result.chapter_analysis).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{val.name}</div>
                        <div className="text-xs text-gray-500">{val.correct}/{val.total} correct</div>
                      </div>
                      <div className={`text-sm font-semibold ${
                        val.total > 0 && val.correct / val.total >= 0.7 ? "text-green-600" :
                        val.total > 0 && val.correct / val.total >= 0.5 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeTab === "review" && (
          <div className="space-y-4">
            {result.detailed_review.map((item) => (
              <div
                key={item.question_number}
                className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
                  item.is_correct ? "border-l-4 border-l-green-500" :
                  item.user_answer === null ? "border-l-4 border-l-gray-300" : "border-l-4 border-l-red-500"
                }`}
              >
                <button
                  onClick={() => setExpandedQuestion(expandedQuestion === item.question_number ? null : item.question_number)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      item.is_correct ? "bg-green-100 text-green-700" :
                      item.user_answer === null ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
                    }`}>
                      {item.is_correct ? <Check className="w-4 h-4" /> : item.user_answer === null ? "?" : <X className="w-4 h-4" />}
                    </span>
                    <span className="font-medium text-gray-900">Q{item.question_number}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.subject === "physics" ? "bg-blue-100 text-blue-800" :
                      item.subject === "chemistry" ? "bg-green-100 text-green-800" :
                      item.subject === "botany" ? "bg-emerald-100 text-emerald-800" :
                      "bg-orange-100 text-orange-800"
                    }`}>
                      {item.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${
                      item.score > 0 ? "text-green-600" : item.score < 0 ? "text-red-600" : "text-gray-500"
                    }`}>
                      {item.score > 0 ? `+${item.score}` : item.score === 0 ? "0" : item.score}
                    </span>
                    {expandedQuestion === item.question_number ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedQuestion === item.question_number && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="py-4">
                      <p className="text-gray-900 mb-4">{item.question}</p>
                      <div className="space-y-2 mb-4">
                        {item.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg flex items-center gap-3 ${
                              idx === item.correct_answer
                                ? "bg-green-50 border border-green-200"
                                : idx === item.user_answer
                                ? "bg-red-50 border border-red-200"
                                : "bg-gray-50"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              idx === item.correct_answer
                                ? "bg-green-500 text-white"
                                : idx === item.user_answer
                                ? "bg-red-500 text-white"
                                : "bg-gray-300"
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-gray-700">{opt}</span>
                            {idx === item.correct_answer && (
                              <Check className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">Explanation</div>
                        <p className="text-sm text-blue-800">{item.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}