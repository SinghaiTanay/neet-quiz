import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEET Quiz Platform - AI-Powered NEET PYQ Practice",
  description: "Generate NEET-style MCQs instantly. Practice with AI-powered quizzes based on NEET PYQ patterns.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}