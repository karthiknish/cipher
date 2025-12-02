"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/context/UserProfileContext";

const STYLE_QUESTIONS = [
  {
    id: "style",
    question: "What&apos;s your style?",
    options: ["Minimalist", "Streetwear", "Classic", "Bold & Experimental"],
  },
  {
    id: "colors",
    question: "Preferred colors?",
    options: ["Neutrals", "Earth Tones", "Bright Colors", "Monochrome"],
  },
  {
    id: "fit",
    question: "Preferred fit?",
    options: ["Slim", "Regular", "Relaxed", "Oversized"],
  },
  {
    id: "occasions",
    question: "Primary occasions?",
    options: ["Casual", "Work", "Night Out", "Athletic"],
  },
  {
    id: "budget",
    question: "Budget range?",
    options: ["$25-50", "$50-100", "$100-200", "$200+"],
  },
];

export default function StyleQuizSection() {
  const { updateStylePreferences } = useUserProfile();
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  const handleQuizAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...quizAnswers, [questionId]: answer };
    setQuizAnswers(newAnswers);
    
    if (quizStep < STYLE_QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Save answers
      updateStylePreferences(newAnswers);
      setQuizStep(0);
      setQuizAnswers({});
    }
  };

  const currentQuestion = STYLE_QUESTIONS[quizStep];

  return (
    <div className="p-8">
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {STYLE_QUESTIONS.map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 h-1 ${i <= quizStep ? "bg-black" : "bg-gray-200"}`}
          />
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={quizStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500 tracking-wider mb-2">
            QUESTION {quizStep + 1} OF {STYLE_QUESTIONS.length}
          </p>
          <h3 className="text-2xl font-light mb-8">{currentQuestion.question}</h3>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleQuizAnswer(currentQuestion.id, option)}
                className={`p-4 border transition-all ${
                  quizAnswers[currentQuestion.id] === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:border-black"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
