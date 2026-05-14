"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Atom, FlaskConical, Leaf, Dna, ChevronLeft, ChevronRight, Check, Search, Sparkles, Loader2 } from "lucide-react";

const SUBJECTS = [
  { id: "physics", name: "Physics", icon: Atom, color: "bg-blue-500", border: "border-blue-500" },
  { id: "chemistry", name: "Chemistry", icon: FlaskConical, color: "bg-green-500", border: "border-green-500" },
  { id: "botany", name: "Botany", icon: Leaf, color: "bg-emerald-500", border: "border-emerald-500" },
  { id: "zoology", name: "Zoology", icon: Dna, color: "bg-orange-500", border: "border-orange-500" },
];

const CLASSES = [
  { id: "11", name: "Class 11" },
  { id: "12", name: "Class 12" },
  { id: "both", name: "Both" },
  { id: "dropper", name: "Dropper" },
];

const DIFFICULTIES = ["easy", "medium", "hard", "mixed"];
const QUESTION_COUNTS = [10, 20, 30, 50];
const MODES = [
  { id: "practice", name: "Practice Mode", description: "Instant explanations" },
  { id: "exam", name: "Exam Mode", description: "Results after submission" },
];

interface Chapter {
  id: string;
  name: string;
  topics: string[];
}

function SubjectIcon({ subject }: { subject: typeof SUBJECTS[0] }) {
  const Icon = subject.icon;
  return (
    <div className={`w-6 h-6 ${subject.color} rounded flex items-center justify-center`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  );
}

export default function ConfigurePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState("");

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(20);
  const [quizMode, setQuizMode] = useState("practice");
  const [chapterSearch, setChapterSearch] = useState("");

  const [availableChapters, setAvailableChapters] = useState<Record<string, Chapter[]>>({});

  const loadingMessages = [
    "Analyzing selected chapters...",
    "Generating NEET-level questions...",
    "Preparing exam environment...",
    "Almost ready...",
  ];

  useEffect(() => {
    if (selectedSubjects.length > 0 && selectedClass) {
      fetchChapters();
    }
  }, [selectedSubjects, selectedClass]);

  useEffect(() => {
    if (generating) {
      let index = 0;
      const interval = setInterval(() => {
        setGeneratingText(loadingMessages[index % loadingMessages.length]);
        index++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [generating]);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chapters?subjects=${selectedSubjects.join(",")}&class_level=${selectedClass}`
      );
      const data = await res.json();
      setAvailableChapters(data);
    } catch (error) {
      console.error("Failed to fetch chapters:", error);
    }
    setLoading(false);
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSelectedChapters([]);
  };

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAllChapters = () => {
    const allChapters = Object.values(availableChapters).flat().map((c) => c.id);
    setSelectedChapters(allChapters);
  };

  const generateQuiz = async () => {
    setGenerating(true);
    setGeneratingText("Analyzing selected chapters...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/generate-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjects: selectedSubjects,
            chapters: selectedChapters,
            difficulty,
            question_count: questionCount,
            class_level: selectedClass,
            mode: quizMode,
          }),
        }
      );

      const data = await res.json();
      setGeneratingText("Generating NEET-level questions...");

      localStorage.setItem("currentQuiz", JSON.stringify({
        quiz_id: data.quiz_id,
        questions: data.questions,
        time_limit: data.time_limit,
        mode: data.mode,
        config: {
          subjects: selectedSubjects,
          chapters: selectedChapters,
          difficulty,
          question_count: questionCount,
          class_level: selectedClass,
          quiz_mode: quizMode,
        },
      }));

      setTimeout(() => {
        router.push(`/quiz/${data.quiz_id}`);
      }, 1500);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      setGenerating(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedClass;
      case 2:
        return selectedSubjects.length > 0;
      case 3:
        return selectedChapters.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : router.push("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    s === step ? "bg-blue-800" : s < step ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">Step {step}/4</span>
          </div>
        </div>
      </header>

      {/* Generating Overlay */}
      {generating && (
        <div className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="flex items-center gap-2 justify-center mb-2">
              <Sparkles className="w-5 h-5 text-blue-800" />
              <span className="font-semibold text-gray-900">Generating Quiz</span>
            </div>
            <p className="text-gray-600 animate-pulse">{generatingText}</p>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Class Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Select Your Class</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CLASSES.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    selectedClass === cls.id
                      ? "border-blue-800 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <span className="font-semibold text-gray-900">{cls.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Subject Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Select Subjects</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedSubjects.includes(subject.id)
                      ? `${subject.border} bg-blue-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-12 h-12 ${subject.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <subject.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">{subject.name}</span>
                  {selectedSubjects.includes(subject.id) && (
                    <Check className="w-5 h-5 text-green-500 mx-auto mt-2" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-sm">
              {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        {/* Step 3: Chapter Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Select Chapters</h2>
              <button
                onClick={selectAllChapters}
                className="text-blue-800 hover:underline text-sm font-medium"
              >
                Select All
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-blue-800 animate-spin mx-auto" />
                <p className="text-gray-500 mt-2">Loading chapters...</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(availableChapters).map(([subject, chapters]) => {
                  const subjectInfo = SUBJECTS.find(s => s.id === subject);
                  return (
                    <div key={subject}>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        {subjectInfo && <SubjectIcon subject={subjectInfo} />}
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {chapters
                          .filter((c) => !chapterSearch || c.name.toLowerCase().includes(chapterSearch.toLowerCase()))
                          .map((chapter) => (
                            <label
                              key={chapter.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedChapters.includes(chapter.id)
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedChapters.includes(chapter.id)}
                                onChange={() => toggleChapter(chapter.id)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedChapters.includes(chapter.id)
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300"
                              }`}>
                                {selectedChapters.includes(chapter.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-sm text-gray-700">{chapter.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-gray-500 text-sm">
              {selectedChapters.length} chapter{selectedChapters.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        {/* Step 4: Quiz Configuration */}
        {step === 4 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Configuration</h2>

            {/* Difficulty */}
            <div>
              <label className="block font-medium text-gray-700 mb-3">Difficulty Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      difficulty === d
                        ? "border-blue-800 bg-blue-50 text-blue-800 font-medium"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block font-medium text-gray-700 mb-3">Number of Questions</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUESTION_COUNTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuestionCount(q)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      questionCount === q
                        ? "border-blue-800 bg-blue-50 text-blue-800 font-medium"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className="block font-medium text-gray-700 mb-3">Quiz Mode</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setQuizMode(m.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      quizMode === m.id
                        ? "border-blue-800 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-sm text-gray-500">{m.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quiz Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Class:</div>
                <div className="text-gray-900 font-medium">{CLASSES.find((c) => c.id === selectedClass)?.name}</div>
                <div className="text-gray-600">Subjects:</div>
                <div className="text-gray-900 font-medium">{selectedSubjects.join(", ")}</div>
                <div className="text-gray-600">Chapters:</div>
                <div className="text-gray-900 font-medium">{selectedChapters.length}</div>
                <div className="text-gray-600">Questions:</div>
                <div className="text-gray-900 font-medium">{questionCount}</div>
                <div className="text-gray-600">Difficulty:</div>
                <div className="text-gray-900 font-medium capitalize">{difficulty}</div>
                <div className="text-gray-600">Time Limit:</div>
                <div className="text-gray-900 font-medium">{questionCount * 45 / 60} min</div>
              </div>
            </div>

            <button
              onClick={generateQuiz}
              disabled={generating}
              className="w-full bg-blue-800 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-900 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Quiz
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-blue-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}