"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  Trophy,
  Clock,
  Users,
  Heart,
  Camera,
  X,
  CaretRight,
  CaretLeft,
  CheckCircle,
  Fire,
  Medal,
  Crown,
  Star,
  SpinnerGap,
  Upload,
  Warning,
} from "@phosphor-icons/react";
import { useStyleChallenges, StyleChallenge, ChallengeSubmission } from "@/context/StyleChallengeContext";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";

// Format time remaining
function formatTimeRemaining(endDate: number): string {
  const now = Date.now();
  const diff = endDate - now;
  
  if (diff <= 0) return "Ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  
  return `${minutes}m left`;
}

// Submission Card Component
function SubmissionCard({ 
  submission, 
  rank,
  onVote,
  hasVoted,
  isOwnSubmission,
  canVote,
}: { 
  submission: ChallengeSubmission;
  rank?: number;
  onVote: () => void;
  hasVoted: boolean;
  isOwnSubmission: boolean;
  canVote: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 overflow-hidden group hover:border-black transition"
    >
      <div className="relative aspect-[3/4]">
        <Image
          src={submission.imageUrl}
          alt={submission.caption}
          fill
          className="object-cover"
        />
        {rank && rank <= 3 && (
          <div className={`absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-white text-sm font-bold ${
            rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-gray-400" : "bg-amber-600"
          }`}>
            {rank}
          </div>
        )}
        {isOwnSubmission && (
          <div className="absolute top-3 right-3 bg-black text-white px-2 py-1 text-xs">
            YOUR ENTRY
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {submission.userAvatar ? (
            <Image
              src={submission.userAvatar}
              alt={submission.userName}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
              {submission.userName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{submission.userName}</p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Heart className={`w-4 h-4 ${hasVoted ? "text-red-500" : "text-gray-400"}`} weight={hasVoted ? "fill" : "regular"} />
            <span>{submission.votes}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{submission.caption}</p>
        
        {canVote && !isOwnSubmission && (
          <button
            onClick={onVote}
            disabled={hasVoted}
            className={`w-full py-2 text-sm tracking-wider transition ${
              hasVoted
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {hasVoted ? "VOTED" : "VOTE"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Submit Entry Modal
function SubmitEntryModal({
  isOpen,
  onClose,
  challenge,
}: {
  isOpen: boolean;
  onClose: () => void;
  challenge: StyleChallenge;
}) {
  const { submitEntry } = useStyleChallenges();
  const { products } = useProducts();
  const toast = useToast();
  
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async () => {
    if (!imageUrl || !caption || selectedProducts.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    const success = await submitEntry(challenge.id, imageUrl, caption, selectedProducts);
    setSubmitting(false);

    if (success) {
      toast.success("Entry submitted successfully!");
      onClose();
    } else {
      toast.error("Failed to submit entry");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">Submit Your Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                  s <= step ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {s < step ? <CheckCircle className="w-4 h-4" weight="bold" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-px ${s < step ? "bg-black" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">Upload Your Photo</h3>
              <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-4">Drag & drop or paste image URL</p>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://your-image-url.com/photo.jpg"
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
                />
              </div>
              {imageUrl && (
                <div className="relative aspect-[3/4] max-w-xs mx-auto">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <button
                onClick={() => setStep(2)}
                disabled={!imageUrl}
                className="w-full bg-black text-white py-3 text-sm tracking-wider hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                CONTINUE
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">Select CIPHER Products in Your Outfit</h3>
              <p className="text-sm text-gray-500">Select at least one product you&apos;re wearing</p>
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProducts(prev => 
                        prev.includes(product.id)
                          ? prev.filter(id => id !== product.id)
                          : [...prev, product.id]
                      );
                    }}
                    className={`flex items-center gap-2 p-2 border text-left transition ${
                      selectedProducts.includes(product.id)
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <div className="relative w-12 h-12 bg-gray-100 flex-shrink-0">
                      {product.images?.[0] && (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                      )}
                      {selectedProducts.includes(product.id) && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" weight="bold" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs truncate">{product.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-200 text-sm tracking-wider hover:bg-gray-50 transition"
                >
                  BACK
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 bg-black text-white py-3 text-sm tracking-wider hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Add a Caption</h3>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe your look..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none resize-none"
              />
              
              {/* Preview */}
              <div className="bg-gray-50 p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">PREVIEW</p>
                <div className="flex gap-4">
                  <div className="relative w-20 h-24 flex-shrink-0">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{caption || "Your caption..."}</p>
                    <p className="text-xs text-gray-500 mt-2">{selectedProducts.length} products tagged</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-200 text-sm tracking-wider hover:bg-gray-50 transition"
                >
                  BACK
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !caption}
                  className="flex-1 bg-black text-white py-3 text-sm tracking-wider hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      SUBMITTING...
                    </>
                  ) : (
                    "SUBMIT ENTRY"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Challenge Detail View
function ChallengeDetail({ 
  challenge, 
  onBack 
}: { 
  challenge: StyleChallenge; 
  onBack: () => void;
}) {
  const { voteForSubmission, hasUserSubmitted, hasUserVoted, getTopSubmissions } = useStyleChallenges();
  const { user } = useAuth();
  const toast = useToast();
  
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");

  const topSubmissions = getTopSubmissions(challenge.id, 100);
  const sortedSubmissions = sortBy === "votes" 
    ? topSubmissions 
    : [...challenge.submissions].sort((a, b) => b.createdAt - a.createdAt);

  const handleVote = async (submissionId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }
    const success = await voteForSubmission(challenge.id, submissionId);
    if (success) {
      toast.success("Vote recorded!");
    }
  };

  const canSubmit = challenge.status === "active" && user && !hasUserSubmitted(challenge.id);
  const canVote = (challenge.status === "active" || challenge.status === "voting") && !!user;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition"
      >
        <CaretLeft className="w-4 h-4" />
        Back to Challenges
      </button>

      {/* Hero */}
      <div className="relative h-64 md:h-96 mb-8">
        <Image
          src={challenge.coverImage}
          alt={challenge.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 text-xs font-medium ${
              challenge.status === "active" ? "bg-green-500 text-white" :
              challenge.status === "voting" ? "bg-blue-500 text-white" :
              challenge.status === "upcoming" ? "bg-yellow-500 text-black" :
              "bg-gray-500 text-white"
            }`}>
              {challenge.status.toUpperCase()}
            </span>
            {challenge.status !== "ended" && (
              <span className="text-white/80 text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTimeRemaining(challenge.status === "voting" ? challenge.votingEndDate : challenge.endDate)}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{challenge.title}</h1>
          <p className="text-white/70 max-w-2xl">{challenge.description}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Submissions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Submissions ({challenge.submissions.length})</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy("votes")}
                className={`px-3 py-1 text-sm ${sortBy === "votes" ? "bg-black text-white" : "bg-gray-100"}`}
              >
                Top Voted
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`px-3 py-1 text-sm ${sortBy === "recent" ? "bg-black text-white" : "bg-gray-100"}`}
              >
                Recent
              </button>
            </div>
          </div>

          {sortedSubmissions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 border border-gray-200">
              <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No submissions yet. Be the first!</p>
              {canSubmit && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-black text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-800 transition"
                >
                  SUBMIT YOUR ENTRY
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {sortedSubmissions.map((submission, index) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  rank={sortBy === "votes" ? index + 1 : undefined}
                  onVote={() => handleVote(submission.id)}
                  hasVoted={hasUserVoted(challenge.id, submission.id)}
                  isOwnSubmission={user?.uid === submission.userId}
                  canVote={canVote}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submit CTA */}
          {canSubmit && (
            <div className="bg-black text-white p-6">
              <h3 className="font-bold mb-2">Ready to Enter?</h3>
              <p className="text-white/70 text-sm mb-4">Share your best outfit for a chance to win!</p>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full bg-white text-black py-3 text-sm tracking-wider hover:bg-gray-100 transition"
              >
                SUBMIT YOUR ENTRY
              </button>
            </div>
          )}

          {/* Prizes */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Prizes
            </h3>
            <div className="space-y-3">
              {challenge.prizes.map((prize) => (
                <div key={prize.place} className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
                    prize.place === 1 ? "bg-yellow-100 text-yellow-700" :
                    prize.place === 2 ? "bg-gray-100 text-gray-600" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {prize.place}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{prize.reward}</p>
                    <p className="text-xs text-gray-500">+{prize.points} points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-bold mb-4">Requirements</h3>
            <ul className="space-y-2">
              {challenge.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{challenge.participantCount}</p>
                <p className="text-xs text-gray-500">Participants</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{challenge.submissions.reduce((sum, s) => sum + s.votes, 0)}</p>
                <p className="text-xs text-gray-500">Total Votes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        <SubmitEntryModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          challenge={challenge}
        />
      </AnimatePresence>
    </div>
  );
}

// Challenge Card
function ChallengeCard({ 
  challenge, 
  onClick 
}: { 
  challenge: StyleChallenge; 
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 overflow-hidden text-left group hover:border-black transition w-full"
    >
      <div className="relative aspect-[16/9]">
        <Image
          src={challenge.coverImage}
          alt={challenge.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium ${
            challenge.status === "active" ? "bg-green-500 text-white" :
            challenge.status === "voting" ? "bg-blue-500 text-white" :
            challenge.status === "upcoming" ? "bg-yellow-500 text-black" :
            "bg-gray-500 text-white"
          }`}>
            {challenge.status.toUpperCase()}
          </span>
        </div>
        {challenge.featured && (
          <div className="absolute top-3 right-3 bg-black text-white px-2 py-1 text-xs flex items-center gap-1">
            <Fire className="w-3 h-3" weight="fill" />
            FEATURED
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white">{challenge.title}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{challenge.description}</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {challenge.participantCount}
            </span>
            {challenge.status !== "ended" && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTimeRemaining(challenge.status === "voting" ? challenge.votingEndDate : challenge.endDate)}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 font-medium group-hover:gap-2 transition-all">
            View <CaretRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function StyleChallengesPage() {
  const { challenges, loading, getActiveChallenge, getUpcomingChallenges, getPastChallenges } = useStyleChallenges();
  const [selectedChallenge, setSelectedChallenge] = useState<StyleChallenge | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "past">("active");

  const activeChallenge = getActiveChallenge();
  const upcomingChallenges = getUpcomingChallenges();
  const pastChallenges = getPastChallenges();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (selectedChallenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ChallengeDetail 
            challenge={selectedChallenge} 
            onBack={() => setSelectedChallenge(null)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="w-8 h-8" />
              <h1 className="text-4xl md:text-5xl font-light tracking-tight">
                Style <span className="font-bold">Challenges</span>
              </h1>
            </div>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Show off your style, compete with the community, and win exclusive prizes. 
              New challenges every week!
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div>
                <p className="text-2xl font-bold">{challenges.length}</p>
                <p className="text-white/60">Total Challenges</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <p className="text-2xl font-bold">
                  {challenges.reduce((sum, c) => sum + c.participantCount, 0).toLocaleString()}
                </p>
                <p className="text-white/60">Participants</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <p className="text-2xl font-bold">$10K+</p>
                <p className="text-white/60">Prizes Given</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200">
          {[
            { key: "active", label: "Active", count: activeChallenge ? 1 : 0 },
            { key: "upcoming", label: "Upcoming", count: upcomingChallenges.length },
            { key: "past", label: "Past", count: pastChallenges.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                activeTab === tab.key
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-black"
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "active" && (
          <div>
            {activeChallenge ? (
              <div className="max-w-3xl mx-auto">
                <ChallengeCard
                  challenge={activeChallenge}
                  onClick={() => setSelectedChallenge(activeChallenge)}
                />
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Challenge</h3>
                <p className="text-gray-500">Check back soon for the next challenge!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "upcoming" && (
          <div>
            {upcomingChallenges.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => setSelectedChallenge(challenge)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Challenges</h3>
                <p className="text-gray-500">New challenges are announced regularly!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "past" && (
          <div>
            {pastChallenges.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => setSelectedChallenge(challenge)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Past Challenges</h3>
                <p className="text-gray-500">Completed challenges will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* How It Works */}
        <section className="mt-16 bg-white border border-gray-200 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Choose a Challenge", desc: "Browse active and upcoming challenges", icon: Trophy },
              { step: 2, title: "Create Your Look", desc: "Style an outfit featuring CIPHER products", icon: Camera },
              { step: 3, title: "Submit & Share", desc: "Upload your photo and tag products", icon: Upload },
              { step: 4, title: "Win Prizes", desc: "Get votes and climb the leaderboard", icon: Crown },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
