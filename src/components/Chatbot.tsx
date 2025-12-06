"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { ChatCircle, X, PaperPlaneTilt, SpinnerGap, Robot, User, Sparkle, Lightning, Moon, Coffee, Heart } from "@phosphor-icons/react";
import { useMoodStyle, MoodType } from "@/context/MoodStyleContext";
import { useProducts } from "@/context/ProductContext";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  styleProducts?: string[];
  moodDetected?: string;
}

const QUICK_QUESTIONS = [
  "What should I wear today?",
  "I need outfit ideas for a date",
  "What products do you sell?",
  "How does virtual try-on work?",
];

// Clean up AI response - remove markdown formatting
function cleanResponse(text: string): string {
  return text
    // Remove ** bold markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove * italic markers  
    .replace(/\*(.*?)\*/g, '$1')
    // Remove markdown headers
    .replace(/^#+\s*/gm, '')
    // Remove markdown bullet points and replace with clean format
    .replace(/^[\*\-]\s+/gm, '• ')
    // Remove numbered list formatting but keep numbers
    .replace(/^\d+\.\s+/gm, (match) => match)
    // Clean up multiple line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there! 👋 I'm the CIPHER style assistant. Ask me what to wear, describe your mood, or tell me about your plans — I'll curate the perfect look for you!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { currentMood, getGreeting, getMoodFromContext } = useMoodStyle();
  const { products } = useProducts();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Check if message is style/mood related
  const isStyleQuery = (text: string): boolean => {
    const styleKeywords = [
      "wear", "outfit", "style", "look", "dress", "mood", "feeling",
      "date", "meeting", "party", "casual", "formal", "cozy", "cold",
      "rain", "hot", "summer", "winter", "confidence", "comfortable",
      "recommend", "suggestion", "what should", "help me pick", "vibe"
    ];
    const lowerText = text.toLowerCase();
    return styleKeywords.some(keyword => lowerText.includes(keyword));
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Check if this is a style/mood related query
      if (isStyleQuery(messageText)) {
        // Use style agent for mood-based recommendations
        const styleResponse = await fetch("/api/style-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: messageText.trim(),
            mood: currentMood?.primaryMood,
          }),
        });

        const styleData = await styleResponse.json();

        if (styleData.success) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: styleData.reasoning + (styleData.tip ? `\n\n💡 ${styleData.tip}` : ""),
            timestamp: new Date(),
            styleProducts: styleData.products,
            moodDetected: styleData.moodDetected,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error("Style agent failed");
        }
      } else {
        // Use regular chat for general questions
        const history = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText.trim(),
            history,
          }),
        });

        const data = await response.json();

        if (data.success && data.message) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: cleanResponse(data.message),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error("Chat failed");
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatCircle className="w-6 h-6" weight="fill" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-200"
            style={{ height: "min(600px, calc(100vh - 8rem))" }}
          >
            {/* Header */}
            <div className="bg-black text-white px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Sparkle className="w-5 h-5" weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium tracking-wide text-sm">CIPHER STYLE ASSISTANT</h3>
                <p className="text-xs text-gray-400">
                  {currentMood ? `Mood: ${currentMood.primaryMood}` : "AI-Powered Styling"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" weight="fill" />
                    ) : (
                      <Robot className="w-4 h-4" weight="fill" />
                    )}
                  </div>
                  <div className="max-w-[80%]">
                    <div
                      className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-black text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {message.moodDetected && (
                        <span className="inline-block px-2 py-0.5 mb-2 bg-sky-100 text-sky-700 text-xs rounded-full capitalize">
                          {message.moodDetected} mood
                        </span>
                      )}
                      {message.content}
                    </div>
                    {/* Product recommendations from style agent */}
                    {message.styleProducts && message.styleProducts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.styleProducts.slice(0, 4).map((productId) => {
                          const product = products.find(p => p.id === productId);
                          if (!product) return null;
                          return (
                            <Link
                              key={productId}
                              href={`/shop/${productId}`}
                              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition text-xs"
                            >
                              <span className="font-medium">{product.name}</span>
                              <span className="text-gray-500">${product.price}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                    <Robot className="w-4 h-4" weight="fill" />
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 flex items-center gap-2">
                    <SpinnerGap className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition rounded-full"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-gray-200 bg-white flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask what to wear, describe your mood..."
                className="flex-1 px-4 py-3 bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-black/10 transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-3 bg-black text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperPlaneTilt className="w-4 h-4" weight="fill" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
