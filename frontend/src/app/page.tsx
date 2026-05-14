"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Atom, FlaskConical, Leaf, Dna, Sparkles, Clock, Target, BookOpen, ArrowRight, CheckCircle, Play } from "lucide-react";

const subjects = [
  { id: "physics", name: "Physics", icon: Atom, color: "bg-blue-500", chapters: 24 },
  { id: "chemistry", name: "Chemistry", icon: FlaskConical, color: "bg-green-500", chapters: 26 },
  { id: "botany", name: "Botany", icon: Leaf, color: "bg-emerald-500", chapters: 17 },
  { id: "zoology", name: "Zoology", icon: Dna, color: "bg-orange-500", chapters: 24 },
];

const features = [
  { icon: Sparkles, title: "AI-Powered", description: "Smart question generation" },
  { icon: Target, title: "NEET Pattern", description: "Real PYQ style questions" },
  { icon: Clock, title: "Timed Practice", description: "Exam-like environment" },
  { icon: BookOpen, title: "Detailed Analysis", description: "Chapter-wise performance" },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startQuiz = () => {
    setLoading(true);
    router.push("/configure");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NEET Quiz</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-800">Features</a>
              <a href="#subjects" className="text-gray-600 hover:text-blue-800">Subjects</a>
              <button
                onClick={startQuiz}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors"
              >
                Start Quiz
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Generate NEET-style quizzes instantly
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Practice with AI-powered MCQs based on real NEET PYQ patterns.
              Select your class, subjects, and chapters to create custom quizzes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={startQuiz}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why NEET Quiz Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-blue-800" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Subjects Covered
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Comprehensive coverage of Physics, Chemistry, Botany & Zoology
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className={`w-16 h-16 ${subject.color} rounded-xl flex items-center justify-center mb-4`}>
                  <subject.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{subject.name}</h3>
                <p className="text-gray-500 text-sm">{subject.chapters} Chapters</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start your NEET preparation?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Generate unlimited NEET-style quizzes. No login required.
            Practice with real exam patterns.
          </p>
          <button
            onClick={startQuiz}
            className="inline-flex items-center gap-2 bg-white text-blue-800 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            Generate Quiz
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>NEET Quiz Platform - For educational purposes only</p>
        </div>
      </footer>
    </div>
  );
}