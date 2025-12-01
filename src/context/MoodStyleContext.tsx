"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type MoodType = 
  | "calm" 
  | "playful" 
  | "focused" 
  | "confident" 
  | "cozy" 
  | "adventurous" 
  | "romantic" 
  | "professional"
  | "rebellious"
  | "minimal";

export interface MoodQuizAnswer {
  questionId: number;
  answer: string;
}

export interface MoodProfile {
  primaryMood: MoodType;
  secondaryMood?: MoodType;
  intensity: number; // 1-10
  occasion?: string;
  weather?: string;
  timeOfDay?: string;
  answers: MoodQuizAnswer[];
  timestamp: Date;
}

export interface DailyRecommendation {
  mood: MoodType;
  products: string[];
  reasoning: string;
  greeting: string;
  tip: string;
  timestamp: Date;
}

// Mood-to-style mapping for product recommendations
export const MOOD_STYLE_MAP: Record<MoodType, {
  keywords: string[];
  colors: string[];
  categories: string[];
  vibe: string;
}> = {
  calm: {
    keywords: ["relaxed", "comfortable", "soft", "cozy"],
    colors: ["cream", "beige", "soft gray", "navy"],
    categories: ["Hoodies", "Tees"],
    vibe: "Soft, understated pieces that wrap you in comfort"
  },
  playful: {
    keywords: ["fun", "colorful", "bold", "statement"],
    colors: ["bright", "colorful", "rust", "sage"],
    categories: ["Tees", "Accessories"],
    vibe: "Bold pieces that express your fun side"
  },
  focused: {
    keywords: ["clean", "minimal", "streamlined", "functional"],
    colors: ["black", "white", "gray", "navy"],
    categories: ["Tees", "Pants"],
    vibe: "Clean, distraction-free pieces for peak productivity"
  },
  confident: {
    keywords: ["bold", "statement", "power", "standout"],
    colors: ["black", "red accents", "deep tones"],
    categories: ["Outerwear", "Pants", "Accessories"],
    vibe: "Head-turning pieces that command attention"
  },
  cozy: {
    keywords: ["warm", "soft", "comfortable", "layered"],
    colors: ["cream", "charcoal", "earth tones"],
    categories: ["Hoodies", "Outerwear"],
    vibe: "Warm, enveloping layers for maximum comfort"
  },
  adventurous: {
    keywords: ["utility", "functional", "rugged", "versatile"],
    colors: ["olive", "khaki", "black", "earth tones"],
    categories: ["Outerwear", "Pants", "Accessories"],
    vibe: "Functional gear ready for any adventure"
  },
  romantic: {
    keywords: ["elegant", "refined", "soft", "sophisticated"],
    colors: ["blush", "cream", "soft black"],
    categories: ["Tees", "Outerwear"],
    vibe: "Refined pieces for memorable moments"
  },
  professional: {
    keywords: ["polished", "sleek", "modern", "refined"],
    colors: ["black", "navy", "charcoal", "white"],
    categories: ["Pants", "Outerwear", "Tees"],
    vibe: "Modern professional wear with streetwear edge"
  },
  rebellious: {
    keywords: ["edgy", "dark", "statement", "unconventional"],
    colors: ["all black", "dark gray", "silver"],
    categories: ["Outerwear", "Pants", "Accessories"],
    vibe: "Break the rules with bold, unapologetic style"
  },
  minimal: {
    keywords: ["simple", "clean", "essential", "timeless"],
    colors: ["black", "white", "gray"],
    categories: ["Tees", "Pants"],
    vibe: "Stripped-back essentials, nothing more"
  }
};

// Quiz questions for mood detection
export const MOOD_QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "How are you feeling right now?",
    options: [
      { text: "Relaxed and at peace", moods: ["calm", "cozy"] },
      { text: "Energized and ready to conquer", moods: ["confident", "adventurous"] },
      { text: "Creative and playful", moods: ["playful", "rebellious"] },
      { text: "Focused and determined", moods: ["focused", "professional"] },
    ],
  },
  {
    id: 2,
    question: "What's your vibe for today?",
    options: [
      { text: "Comfort is king", moods: ["cozy", "calm"] },
      { text: "Make a statement", moods: ["confident", "rebellious"] },
      { text: "Keep it simple", moods: ["minimal", "focused"] },
      { text: "Ready for anything", moods: ["adventurous", "playful"] },
    ],
  },
  {
    id: 3,
    question: "Pick a word that resonates:",
    options: [
      { text: "Serenity", moods: ["calm", "minimal"] },
      { text: "Power", moods: ["confident", "professional"] },
      { text: "Freedom", moods: ["adventurous", "rebellious"] },
      { text: "Joy", moods: ["playful", "romantic"] },
    ],
  },
  {
    id: 4,
    question: "What's on your agenda?",
    options: [
      { text: "Netflix and chill", moods: ["cozy", "calm"] },
      { text: "Big meeting or date", moods: ["confident", "romantic", "professional"] },
      { text: "Exploring the city", moods: ["adventurous", "playful"] },
      { text: "Working from home", moods: ["focused", "minimal"] },
    ],
  },
  {
    id: 5,
    question: "Choose your superpower:",
    options: [
      { text: "Invisibility (blend in)", moods: ["minimal", "calm"] },
      { text: "Magnetism (stand out)", moods: ["confident", "rebellious"] },
      { text: "Flight (freedom)", moods: ["adventurous", "playful"] },
      { text: "Time control (productivity)", moods: ["focused", "professional"] },
    ],
  },
];

// Context-aware triggers
export interface ContextTrigger {
  type: "weather" | "time" | "event" | "pattern";
  condition: string;
  suggestedMood: MoodType;
  message: string;
}

export const CONTEXT_TRIGGERS: ContextTrigger[] = [
  { type: "weather", condition: "rainy", suggestedMood: "cozy", message: "It's raining today — cozy, comfortable fits you'll love" },
  { type: "weather", condition: "sunny", suggestedMood: "playful", message: "Sun's out! Time for vibrant, mood-lifting pieces" },
  { type: "weather", condition: "cold", suggestedMood: "cozy", message: "Bundle up with our warmest layers" },
  { type: "time", condition: "morning", suggestedMood: "focused", message: "Start your day with purpose" },
  { type: "time", condition: "evening", suggestedMood: "confident", message: "Evening plans? Here are your confidence-boosting pieces" },
  { type: "time", condition: "night", suggestedMood: "calm", message: "Wind down in style" },
  { type: "event", condition: "date", suggestedMood: "romantic", message: "Date night? Here are your best looks" },
  { type: "event", condition: "interview", suggestedMood: "professional", message: "Nail that interview with polished style" },
  { type: "event", condition: "workout", suggestedMood: "adventurous", message: "Get moving in functional fits" },
  { type: "pattern", condition: "low_engagement", suggestedMood: "playful", message: "Need a mood boost? Dopamine dressing activated ✨" },
];

interface MoodStyleContextType {
  currentMood: MoodProfile | null;
  dailyRecommendation: DailyRecommendation | null;
  quizProgress: number;
  quizAnswers: MoodQuizAnswer[];
  isDopamineMode: boolean;
  setMood: (mood: MoodProfile) => void;
  startQuiz: () => void;
  answerQuiz: (questionId: number, answerIndex: number) => void;
  completeQuiz: () => MoodType;
  resetQuiz: () => void;
  getMoodFromContext: (context: string) => MoodType;
  activateDopamineMode: () => void;
  deactivateDopamineMode: () => void;
  getGreeting: () => string;
  getMoodStyleInfo: (mood: MoodType) => typeof MOOD_STYLE_MAP[MoodType];
}

const MoodStyleContext = createContext<MoodStyleContextType | undefined>(undefined);

export function MoodStyleProvider({ children }: { children: ReactNode }) {
  const [currentMood, setCurrentMood] = useState<MoodProfile | null>(null);
  const [dailyRecommendation, setDailyRecommendation] = useState<DailyRecommendation | null>(null);
  const [quizProgress, setQuizProgress] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<MoodQuizAnswer[]>([]);
  const [isDopamineMode, setIsDopamineMode] = useState(false);
  const [moodScores, setMoodScores] = useState<Record<MoodType, number>>({
    calm: 0, playful: 0, focused: 0, confident: 0, cozy: 0,
    adventurous: 0, romantic: 0, professional: 0, rebellious: 0, minimal: 0
  });

  // Load saved mood from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cipher-mood-profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if mood is from today
        const savedDate = new Date(parsed.timestamp);
        const today = new Date();
        if (savedDate.toDateString() === today.toDateString()) {
          setCurrentMood(parsed);
        }
      } catch (e) {
        console.error("Error loading mood profile:", e);
      }
    }

    // Check for dopamine mode trigger (low engagement pattern)
    const lastVisit = localStorage.getItem("cipher-last-visit");
    const visitCount = parseInt(localStorage.getItem("cipher-visit-count") || "0");
    const now = Date.now();
    
    if (lastVisit) {
      const timeSinceLastVisit = now - parseInt(lastVisit);
      // If user hasn't visited in 3+ days or has visited but not bought anything
      if (timeSinceLastVisit > 3 * 24 * 60 * 60 * 1000 && visitCount > 5) {
        setIsDopamineMode(true);
      }
    }
    
    localStorage.setItem("cipher-last-visit", now.toString());
    localStorage.setItem("cipher-visit-count", (visitCount + 1).toString());
  }, []);

  const setMood = (mood: MoodProfile) => {
    setCurrentMood(mood);
    localStorage.setItem("cipher-mood-profile", JSON.stringify(mood));
  };

  const startQuiz = () => {
    setQuizProgress(0);
    setQuizAnswers([]);
    setMoodScores({
      calm: 0, playful: 0, focused: 0, confident: 0, cozy: 0,
      adventurous: 0, romantic: 0, professional: 0, rebellious: 0, minimal: 0
    });
  };

  const answerQuiz = (questionId: number, answerIndex: number) => {
    const question = MOOD_QUIZ_QUESTIONS.find(q => q.id === questionId);
    if (!question) return;

    const selectedOption = question.options[answerIndex];
    
    // Update mood scores
    const newScores = { ...moodScores };
    selectedOption.moods.forEach(mood => {
      newScores[mood as MoodType] = (newScores[mood as MoodType] || 0) + 1;
    });
    setMoodScores(newScores);

    // Save answer
    setQuizAnswers(prev => [...prev, { questionId, answer: selectedOption.text }]);
    setQuizProgress(prev => prev + 1);
  };

  const completeQuiz = (): MoodType => {
    // Find the mood with highest score
    let maxScore = 0;
    let primaryMood: MoodType = "calm";
    let secondaryMood: MoodType | undefined;

    Object.entries(moodScores).forEach(([mood, score]) => {
      if (score > maxScore) {
        secondaryMood = primaryMood;
        maxScore = score;
        primaryMood = mood as MoodType;
      }
    });

    const moodProfile: MoodProfile = {
      primaryMood,
      secondaryMood,
      intensity: Math.min(10, maxScore * 2),
      answers: quizAnswers,
      timestamp: new Date(),
    };

    setMood(moodProfile);
    return primaryMood;
  };

  const resetQuiz = () => {
    setQuizProgress(0);
    setQuizAnswers([]);
    setMoodScores({
      calm: 0, playful: 0, focused: 0, confident: 0, cozy: 0,
      adventurous: 0, romantic: 0, professional: 0, rebellious: 0, minimal: 0
    });
  };

  const getMoodFromContext = (context: string): MoodType => {
    const lowerContext = context.toLowerCase();
    
    for (const trigger of CONTEXT_TRIGGERS) {
      if (lowerContext.includes(trigger.condition)) {
        return trigger.suggestedMood;
      }
    }

    // Default mapping for common contexts
    if (lowerContext.includes("date") || lowerContext.includes("romantic")) return "romantic";
    if (lowerContext.includes("work") || lowerContext.includes("office")) return "professional";
    if (lowerContext.includes("rain") || lowerContext.includes("cold")) return "cozy";
    if (lowerContext.includes("party") || lowerContext.includes("club")) return "confident";
    if (lowerContext.includes("chill") || lowerContext.includes("relax")) return "calm";
    if (lowerContext.includes("adventure") || lowerContext.includes("travel")) return "adventurous";
    if (lowerContext.includes("gym") || lowerContext.includes("sport")) return "adventurous";
    if (lowerContext.includes("sad") || lowerContext.includes("down")) return "playful"; // Dopamine dressing
    
    return "calm";
  };

  const activateDopamineMode = () => {
    setIsDopamineMode(true);
  };

  const deactivateDopamineMode = () => {
    setIsDopamineMode(false);
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    const mood = currentMood?.primaryMood;
    
    if (hour < 12) {
      if (mood === "focused") return "Good morning! Ready to conquer the day?";
      if (mood === "cozy") return "Good morning! Take it easy today.";
      return "Good morning! What should you wear today?";
    } else if (hour < 17) {
      if (mood === "playful") return "Hey there! Feeling fun this afternoon?";
      if (mood === "professional") return "Good afternoon! Looking sharp today.";
      return "Good afternoon! Need style inspiration?";
    } else if (hour < 21) {
      if (mood === "confident") return "Good evening! Time to make an entrance.";
      if (mood === "romantic") return "Good evening! Date night ready?";
      return "Good evening! What's the plan tonight?";
    } else {
      if (mood === "calm") return "Late night vibes? We've got you.";
      return "Night owl? Here are some cozy picks.";
    }
  };

  const getMoodStyleInfo = (mood: MoodType) => {
    return MOOD_STYLE_MAP[mood];
  };

  return (
    <MoodStyleContext.Provider
      value={{
        currentMood,
        dailyRecommendation,
        quizProgress,
        quizAnswers,
        isDopamineMode,
        setMood,
        startQuiz,
        answerQuiz,
        completeQuiz,
        resetQuiz,
        getMoodFromContext,
        activateDopamineMode,
        deactivateDopamineMode,
        getGreeting,
        getMoodStyleInfo,
      }}
    >
      {children}
    </MoodStyleContext.Provider>
  );
}

export function useMoodStyle() {
  const context = useContext(MoodStyleContext);
  if (context === undefined) {
    throw new Error("useMoodStyle must be used within a MoodStyleProvider");
  }
  return context;
}
