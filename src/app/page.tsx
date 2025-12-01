"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDown, Truck, ArrowsClockwise, ShieldCheck, CreditCard, Sparkle, MagnifyingGlass, SpinnerGap, ShoppingBag, Heart, Sun, Cloud, Moon, Smiley, Lightning, Coffee, Confetti, Brain, Palette, Fire } from "@phosphor-icons/react";
import { useRef, useState, useEffect } from "react";
import { useProducts, Product } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useMoodStyle, MoodType, MOOD_QUIZ_QUESTIONS } from "@/context/MoodStyleContext";

const COLLECTIONS = [
  {
    id: "hoodies",
    title: "HOODIES",
    subtitle: "Essential Warmth",
    image: "/hoodie.png",
    count: 12,
  },
  {
    id: "outerwear",
    title: "OUTERWEAR",
    subtitle: "Urban Protection",
    image: "/outerwear.png",
    count: 8,
  },
  {
    id: "tees",
    title: "TEES",
    subtitle: "Daily Essentials",
    image: "/tees.png",
    count: 24,
  },
];

const BESTSELLERS = [
  { id: "1", name: "Cipher Hoodie", price: 89, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=HOODIE" },
  { id: "6", name: "Tactical Vest", price: 120, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=VEST" },
  { id: "3", name: "Cargo Pants", price: 95, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=CARGO" },
  { id: "2", name: "Street Tee", price: 45, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=TEE" },
];

const SERVICE_FEATURES = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $150" },
  { icon: ArrowsClockwise, title: "Easy Returns", desc: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected checkout" },
  { icon: CreditCard, title: "Flexible Payment", desc: "Multiple payment options" },
];

// Mood icons mapping
const MOOD_ICONS: Record<MoodType, React.ReactNode> = {
  calm: <Moon className="w-5 h-5" />,
  playful: <Confetti className="w-5 h-5" />,
  focused: <Brain className="w-5 h-5" />,
  confident: <Lightning className="w-5 h-5" />,
  cozy: <Coffee className="w-5 h-5" />,
  adventurous: <Fire className="w-5 h-5" />,
  romantic: <Heart className="w-5 h-5" />,
  professional: <Smiley className="w-5 h-5" />,
  rebellious: <Fire className="w-5 h-5" />,
  minimal: <Palette className="w-5 h-5" />,
};

const MOOD_COLORS: Record<MoodType, string> = {
  calm: "from-blue-500/20 to-indigo-500/20",
  playful: "from-pink-500/20 to-orange-500/20",
  focused: "from-gray-500/20 to-slate-500/20",
  confident: "from-amber-500/20 to-red-500/20",
  cozy: "from-orange-500/20 to-amber-500/20",
  adventurous: "from-green-500/20 to-emerald-500/20",
  romantic: "from-rose-500/20 to-pink-500/20",
  professional: "from-slate-500/20 to-gray-500/20",
  rebellious: "from-purple-500/20 to-violet-500/20",
  minimal: "from-gray-400/20 to-gray-500/20",
};

// Style Agent Section Component with Mood Quiz
function StyleAgentSection() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ products: Product[]; reasoning: string; moodDetected?: string; tip?: string } | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { 
    currentMood, 
    quizProgress, 
    answerQuiz, 
    completeQuiz, 
    startQuiz, 
    resetQuiz,
    getMoodStyleInfo,
    getGreeting,
    isDopamineMode,
  } = useMoodStyle();

  // Get time-based greeting
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    setGreeting(getGreeting());
  }, [currentMood, getGreeting]);

  const handleSearch = async (searchQuery?: string, detectedMood?: MoodType) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch("/api/style-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: q,
          mood: detectedMood || currentMood?.primaryMood,
          context: isDopamineMode ? "User may need mood-lifting suggestions" : undefined
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const matchedProducts = data.products
          .map((id: string) => products.find((p) => p.id === id))
          .filter(Boolean) as Product[];
        
        setResults({
          products: matchedProducts,
          reasoning: data.reasoning,
          moodDetected: data.moodDetected,
          tip: data.tip,
        });
      }
    } catch (error) {
      console.error("Style agent error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    handleSearch(tag);
  };

  const handleStartQuiz = () => {
    startQuiz();
    setShowQuiz(true);
    setCurrentQuestion(0);
    setQuizComplete(false);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const question = MOOD_QUIZ_QUESTIONS[currentQuestion];
    answerQuiz(question.id, answerIndex);
    
    if (currentQuestion < MOOD_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz complete
      const detectedMood = completeQuiz();
      setQuizComplete(true);
      const moodInfo = getMoodStyleInfo(detectedMood);
      // Auto-search with detected mood
      handleSearch(`I'm feeling ${detectedMood}. ${moodInfo.vibe}`, detectedMood);
      setTimeout(() => {
        setShowQuiz(false);
      }, 2000);
    }
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    resetQuiz();
    setCurrentQuestion(0);
    setQuizComplete(false);
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-neutral-900 to-black text-white">
      <div className="w-full px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Sparkle className="w-4 h-4" weight="fill" />
            <span className="text-sm tracking-wider">AI-POWERED VIRTUAL STYLIST</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-4">
            WHAT SHOULD YOU <span className="font-bold">WEAR TODAY?</span>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto">
            {greeting || "Tell us your mood, vibe, or occasion — our AI stylist will curate the perfect look for you"}
          </p>
          
          {/* Dopamine Mode Banner */}
          {isDopamineMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-full"
            >
              <Confetti className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-pink-300">Dopamine Dressing Mode Active — Let&apos;s boost your mood! ✨</span>
            </motion.div>
          )}
        </motion.div>

        {/* Mood Quiz or Current Mood Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="max-w-3xl mx-auto mb-8"
        >
          {currentMood ? (
            <div className={`relative p-6 rounded-2xl bg-gradient-to-r ${MOOD_COLORS[currentMood.primaryMood]} border border-white/10 mb-8`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    {MOOD_ICONS[currentMood.primaryMood]}
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Today&apos;s Mood</p>
                    <p className="text-xl font-medium capitalize">{currentMood.primaryMood}</p>
                    <p className="text-sm text-white/50">{getMoodStyleInfo(currentMood.primaryMood).vibe}</p>
                  </div>
                </div>
                <button
                  onClick={handleStartQuiz}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <button
                onClick={handleStartQuiz}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
              >
                <Sparkle className="w-5 h-5" weight="fill" />
                Take the Mood Quiz
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-white/40 text-sm mt-3">5 quick questions to find your perfect style</p>
            </div>
          )}
        </motion.div>

        {/* Quiz Modal */}
        <AnimatePresence>
          {showQuiz && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseQuiz}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg p-8"
                onClick={e => e.stopPropagation()}
              >
                {quizComplete ? (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10 }}
                      className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${currentMood ? MOOD_COLORS[currentMood.primaryMood] : ""} flex items-center justify-center`}
                    >
                      {currentMood && MOOD_ICONS[currentMood.primaryMood]}
                    </motion.div>
                    <h3 className="text-2xl font-medium mb-2">You&apos;re feeling {currentMood?.primaryMood}!</h3>
                    <p className="text-white/60">{currentMood && getMoodStyleInfo(currentMood.primaryMood).vibe}</p>
                    <p className="text-white/40 text-sm mt-4">Finding your perfect looks...</p>
                  </div>
                ) : (
                  <>
                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex justify-between text-sm text-white/50 mb-2">
                        <span>Question {currentQuestion + 1} of {MOOD_QUIZ_QUESTIONS.length}</span>
                        <button onClick={handleCloseQuiz} className="hover:text-white">Skip</button>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((currentQuestion + 1) / MOOD_QUIZ_QUESTIONS.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Question */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-2xl font-medium mb-6 text-center">
                          {MOOD_QUIZ_QUESTIONS[currentQuestion].question}
                        </h3>
                        <div className="space-y-3">
                          {MOOD_QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => (
                            <motion.button
                              key={idx}
                              onClick={() => handleQuizAnswer(idx)}
                              className="w-full p-4 text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {option.text}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Try 'I have a date tonight' or 'feeling stressed, need comfort'..."
              className="w-full pl-6 pr-14 py-5 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition text-base"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white text-black rounded-full hover:bg-white/90 transition disabled:opacity-50"
            >
              {loading ? (
                <SpinnerGap className="w-5 h-5 animate-spin" />
              ) : (
                <MagnifyingGlass className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Context-Aware Quick Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {[
              "cozy rainy day",
              "big presentation",
              "date night",
              "feeling adventurous",
              "need a mood boost",
              "work from home",
              "weekend exploring"
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-4 py-2 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-sm transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-white/40"
              >
                <SpinnerGap className="w-10 h-10 animate-spin mb-4" />
                <p className="text-sm tracking-wider">UNDERSTANDING YOUR MOOD...</p>
              </motion.div>
            )}

            {!loading && !results && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 border border-white/20 rounded-full flex items-center justify-center mb-6">
                  <Sparkle className="w-8 h-8 text-white/30" weight="fill" />
                </div>
                <p className="text-white/40 text-sm tracking-wider">YOUR PERSONALIZED STYLE PICKS WILL APPEAR HERE</p>
                <p className="text-white/30 text-xs mt-2">Take the mood quiz or describe how you&apos;re feeling</p>
              </motion.div>
            )}

            {!loading && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* AI Reasoning with Mood Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-r ${results.moodDetected ? MOOD_COLORS[results.moodDetected as MoodType] : "from-white/5 to-white/10"} border border-white/10 rounded-2xl p-6 mb-8`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      {results.moodDetected ? MOOD_ICONS[results.moodDetected as MoodType] : <Sparkle className="w-5 h-5" weight="fill" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-white/50">Style Agent says</p>
                        {results.moodDetected && (
                          <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs capitalize">
                            {results.moodDetected} mood detected
                          </span>
                        )}
                      </div>
                      <p className="text-white/90">{results.reasoning}</p>
                      {results.tip && (
                        <p className="text-white/60 text-sm mt-3 italic">💡 {results.tip}</p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Product Grid */}
                {results.products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {results.products.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition"
                      >
                        <Link href={`/shop/${product.id}`}>
                          <div className="relative aspect-[4/5]">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                        
                        {/* Quick Actions */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              if (isInWishlist(product.id)) {
                                removeFromWishlist(product.id);
                              } else {
                                addToWishlist(product);
                              }
                            }}
                            className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                          >
                            <Heart 
                              className={`w-4 h-4 ${isInWishlist(product.id) ? "text-red-500" : "text-gray-600"}`} 
                              weight={isInWishlist(product.id) ? "fill" : "regular"}
                            />
                          </button>
                          <button
                            onClick={() => addToCart({ 
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.image,
                              quantity: 1, 
                              size: product.sizes?.[0] || "M",
                              category: product.category
                            })}
                            className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                          >
                            <ShoppingBag className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="p-4">
                          <Link href={`/shop/${product.id}`}>
                            <h4 className="text-sm font-medium text-white group-hover:underline underline-offset-4">{product.name}</h4>
                            <p className="text-sm text-white/50 mt-1">${product.price}</p>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/40">
                    <p>No exact matches found. Try a different description!</p>
                  </div>
                )}

                {/* View All Button */}
                {results.products.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-10"
                  >
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 hover:bg-white hover:text-black transition-all text-sm tracking-wider"
                    >
                      VIEW ALL PRODUCTS
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Screen Editorial */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          {/* Desktop Image */}
          <div className="hidden md:block relative w-full h-full">
            <Image
              src="/hero.png"
              alt="Cipher Collection"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Mobile Image */}
          <div className="block md:hidden relative w-full h-full">
            <Image
              src="/hero-mobile.png"
              alt="Cipher Collection"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-black/10" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 h-full flex flex-col"
        >
          {/* Hero Content Removed */}
          <div className="flex-1" />

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/60"
          >
            <span className="text-xs tracking-[0.3em]">SCROLL</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Service Bar */}
      <section className="bg-black text-white py-5 border-b border-white/10">
        <div className="w-full px-6 md:px-12">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 md:gap-4">
            {SERVICE_FEATURES.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm text-white/70"
              >
                <feature.icon className="w-4 h-4" />
                <span className="tracking-wide">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style Agent Section */}
      <StyleAgentSection />

      {/* Collections Grid */}
      <section className="py-20 md:py-32 bg-white">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              SHOP BY CATEGORY
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Discover our curated collections designed for every moment
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {COLLECTIONS.map((collection, i) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <Link
                  href={`/shop?category=${collection.title}`}
                  className="group block relative aspect-[3/4] overflow-hidden"
                >
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <p className="text-white/60 text-sm tracking-wider mb-2">
                      {collection.count} items
                    </p>
                    <h3 className="text-white text-2xl md:text-3xl font-light tracking-wide mb-1">
                      {collection.title}
                    </h3>
                    <p className="text-white/80 text-sm">{collection.subtitle}</p>
                    <div className="mt-6 flex items-center gap-2 text-white text-sm tracking-wider opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <span>SHOP NOW</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-20 md:py-32 bg-neutral-50">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-3">
                BESTSELLERS
              </h2>
              <p className="text-gray-500">Our most loved pieces this season</p>
            </div>
            <Link
              href="/shop"
              className="group flex items-center gap-2 text-sm tracking-wider font-medium hover:gap-4 transition-all"
            >
              VIEW ALL
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {BESTSELLERS.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={`/shop/${product.id}`} className="group block">
                  <div className="relative aspect-[4/5] mb-4 overflow-hidden bg-white">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">${product.price}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Try-On Feature */}
      <section className="py-20 md:py-32 bg-black text-white">
        <div className="w-full px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm tracking-[0.3em] text-white/50 mb-6">
                AI-POWERED
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8 leading-[1.1]">
                TRY BEFORE
                <br />
                <span className="font-bold">YOU BUY</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
                Upload your photo and see how any piece looks on you.
                Our AI creates realistic virtual try-ons in seconds.
              </p>
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm tracking-wider font-medium hover:bg-white/90 transition-all"
              >
                TRY IT NOW
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-white/40 text-sm mt-6">
                Available on all product pages
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="relative aspect-square bg-white/5 flex items-center justify-center"
            >
              <div className="absolute inset-0 border border-white/10" />
              <div className="text-center p-8">
                <div className="w-20 h-20 border border-white/20 mx-auto mb-6 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white/60 rounded-full" />
                </div>
                <p className="text-white/40 text-sm tracking-wider">
                  POWERED BY GEMINI
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Editorial Banner */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <Image
          src="https://placehold.co/1920x1080/1a1a1a/ffffff?text="
          alt="Editorial"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm tracking-[0.4em] mb-6 text-white/60">
              NEW ARRIVALS
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-light tracking-tight mb-8 leading-[1.1]">
              STEP INTO THE
              <br />
              <span className="font-bold">NEW SEASON</span>
            </h2>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-sm tracking-wider font-medium hover:bg-white/90 transition-all"
            >
              DISCOVER
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 md:py-32 bg-neutral-100">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              STAY CONNECTED
            </h2>
            <p className="text-gray-500 mb-10">
              Subscribe for exclusive access to new drops, limited editions,
              and special offers.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-white border border-gray-200 text-black placeholder-gray-400 focus:outline-none focus:border-black transition text-sm"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-black text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition"
              >
                SUBSCRIBE
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-6">
              By subscribing, you agree to our Privacy Policy
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
