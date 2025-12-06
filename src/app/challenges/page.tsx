"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
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
  Image as ImageIcon,
  Trash,
} from "@phosphor-icons/react";
import { useStyleChallenges, StyleChallenge, ChallengeSubmission } from "@/context/StyleChallengeContext";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { uploadImage, generateImagePath } from "@/lib/uploadImage";

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

// Live Countdown Timer Component
function CountdownTimer({ endDate, variant = "compact" }: { endDate: number; variant?: "compact" | "full" }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = endDate - Date.now();
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    const timer = setInterval(() => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);
      setIsUrgent(tl.days === 0 && tl.hours < 24);
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [endDate]);

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1 text-sm ${isUrgent ? "text-red-500" : "text-white/80"}`}>
        <Clock className={`w-4 h-4 ${isUrgent ? "animate-pulse" : ""}`} />
        <span>
          {timeLeft.days > 0
            ? `${timeLeft.days}d ${timeLeft.hours}h`
            : `${String(timeLeft.hours).padStart(2, "0")}:${String(timeLeft.minutes).padStart(2, "0")}:${String(timeLeft.seconds).padStart(2, "0")}`
          }
        </span>
      </div>
    );
  }

  // Full variant for sidebar
  return (
    <div className={`p-4 ${isUrgent ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"} border`}>
      <p className={`text-xs tracking-wider mb-3 ${isUrgent ? "text-red-500" : "text-gray-500"}`}>
        {isUrgent ? "⏰ ENDING SOON" : "TIME REMAINING"}
      </p>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map((unit) => (
          <div key={unit.label}>
            <div className={`text-2xl font-bold ${isUrgent ? "text-red-600" : "text-black"}`}>
              {String(unit.value).padStart(2, "0")}
            </div>
            <div className="text-[10px] text-gray-400">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// User Stats Card Component
function UserStatsCard() {
  const { getUserStats } = useStyleChallenges();
  const { user } = useAuth();
  const stats = getUserStats();

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <div className="text-center">
          <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold mb-2">Track Your Progress</h3>
          <p className="text-sm text-gray-500 mb-4">Sign in to see your challenge stats and badges</p>
          <Link href="/login" className="inline-block px-4 py-2 bg-black text-white text-sm">
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  const getBadgeInfo = (badge: string) => {
    const badges: Record<string, { label: string; icon: typeof Trophy; color: string }> = {
      first_entry: { label: "First Entry", icon: Star, color: "text-blue-500" },
      regular_contestant: { label: "Regular", icon: Trophy, color: "text-green-500" },
      style_veteran: { label: "Veteran", icon: Crown, color: "text-purple-500" },
      challenge_winner: { label: "Winner", icon: Trophy, color: "text-yellow-500" },
      style_champion: { label: "Champion", icon: Crown, color: "text-orange-500" },
      crowd_favorite: { label: "Crowd Fave", icon: Heart, color: "text-pink-500" },
      style_icon: { label: "Style Icon", icon: Star, color: "text-red-500" },
      active_voter: { label: "Active Voter", icon: CheckCircle, color: "text-green-500" },
      community_supporter: { label: "Supporter", icon: Users, color: "text-blue-500" },
    };
    return badges[badge] || { label: badge, icon: Star, color: "text-gray-500" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 p-6"
    >
      <h3 className="text-xs tracking-wider text-gray-500 mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        YOUR STATS
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50">
          <p className="text-2xl font-bold">{stats.totalParticipations}</p>
          <p className="text-xs text-gray-500">Entries</p>
        </div>
        <div className="text-center p-3 bg-gray-50">
          <p className="text-2xl font-bold">{stats.totalWins}</p>
          <p className="text-xs text-gray-500">Wins</p>
        </div>
        <div className="text-center p-3 bg-gray-50">
          <p className="text-2xl font-bold">{stats.totalVotesReceived}</p>
          <p className="text-xs text-gray-500">Votes Received</p>
        </div>
        <div className="text-center p-3 bg-gray-50">
          <p className="text-2xl font-bold">{stats.totalVotesGiven}</p>
          <p className="text-xs text-gray-500">Votes Given</p>
        </div>
      </div>

      {stats.currentRank && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200">
          <p className="text-xs text-yellow-700 mb-1">Current Challenge Rank</p>
          <p className="text-2xl font-bold text-yellow-700">#{stats.currentRank}</p>
        </div>
      )}

      {stats.badges.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-3">BADGES EARNED</p>
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((badge) => {
              const info = getBadgeInfo(badge);
              return (
                <motion.div
                  key={badge}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs ${info.color}`}
                >
                  <info.icon className="w-3 h-3" weight="fill" />
                  {info.label}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {stats.badges.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Participate to earn badges!
        </div>
      )}
    </motion.div>
  );
}

// Leaderboard Component
function Leaderboard({ challengeId }: { challengeId: string }) {
  const { getLeaderboard } = useStyleChallenges();
  const { user } = useAuth();
  const leaderboard = getLeaderboard(challengeId);

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6 text-center">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No entries yet. Be the first!</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-xs tracking-wider text-gray-500 flex items-center gap-2">
          <ChartLine className="w-4 h-4" />
          LEADERBOARD
        </h3>
        <span className="text-xs text-gray-400">{leaderboard.length} entries</span>
      </div>

      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {leaderboard.slice(0, 10).map(({ submission, rank }) => {
          const isCurrentUser = user?.uid === submission.userId;
          return (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rank * 0.05 }}
              className={`flex items-center gap-3 p-3 ${isCurrentUser ? "bg-yellow-50" : "hover:bg-gray-50"} transition`}
            >
              {/* Rank */}
              <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${rank === 1 ? "bg-yellow-500 text-white" :
                rank === 2 ? "bg-gray-400 text-white" :
                  rank === 3 ? "bg-amber-600 text-white" :
                    "bg-gray-100 text-gray-600"
                }`}>
                {rank}
              </div>

              {/* Avatar */}
              {submission.userAvatar ? (
                <Image
                  src={submission.userAvatar}
                  alt={submission.userName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                  {submission.userName.charAt(0)}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {submission.userName}
                  {isCurrentUser && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                </p>
              </div>

              {/* Votes */}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Heart className="w-4 h-4" weight={submission.votes > 0 ? "fill" : "regular"} />
                {submission.votes}
              </div>
            </motion.div>
          );
        })}
      </div>

      {leaderboard.length > 10 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <span className="text-xs text-gray-400">+ {leaderboard.length - 10} more entries</span>
        </div>
      )}
    </motion.div>
  );
}

// Share Buttons Component
function ShareButtons({ submissionId }: { submissionId: string }) {
  const { shareSubmission } = useStyleChallenges();
  const toast = useToast();

  const handleShare = (platform: "twitter" | "facebook" | "copy") => {
    shareSubmission(submissionId, platform);
    if (platform === "copy") {
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleShare("twitter")}
        className="p-2 bg-[#1DA1F2] text-white text-xs hover:opacity-80 transition"
        title="Share on Twitter"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        onClick={() => handleShare("facebook")}
        className="p-2 bg-[#1877F2] text-white text-xs hover:opacity-80 transition"
        title="Share on Facebook"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>
      <button
        onClick={() => handleShare("copy")}
        className="p-2 bg-gray-800 text-white text-xs hover:opacity-80 transition"
        title="Copy link"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  );
}

// ChartLine icon (for leaderboard)
function ChartLine({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 256 256">
      <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69l58.34-58.35a8,8,0,0,1,11.32,11.32l-64,64a8,8,0,0,1-11.32,0L96,123.31,40,179.31V200H224A8,8,0,0,1,232,208Z" />
    </svg>
  );
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
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteAnimation, setShowVoteAnimation] = useState(false);

  const handleVote = async () => {
    setIsVoting(true);
    await onVote();
    setIsVoting(false);
    setShowVoteAnimation(true);
    setTimeout(() => setShowVoteAnimation(false), 1000);
  };

  const getRankBadge = (r: number) => {
    if (r === 1) return { bg: "bg-yellow-500", icon: Crown, label: "1st" };
    if (r === 2) return { bg: "bg-gray-400", icon: Medal, label: "2nd" };
    if (r === 3) return { bg: "bg-amber-600", icon: Medal, label: "3rd" };
    return null;
  };

  const rankBadge = rank && rank <= 3 ? getRankBadge(rank) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 overflow-hidden group hover:border-black hover:shadow-lg transition-all"
    >
      <div className="relative aspect-[3/4]">
        <Image
          src={submission.imageUrl}
          alt={submission.caption}
          fill
          className="object-cover"
        />

        {/* Rank Badge */}
        {rankBadge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`absolute top-3 left-3 px-2 py-1 flex items-center gap-1 text-white text-xs font-bold ${rankBadge.bg}`}
          >
            <rankBadge.icon className="w-3 h-3" weight="fill" />
            {rankBadge.label}
          </motion.div>
        )}

        {isOwnSubmission && (
          <div className="absolute top-3 right-3 bg-black text-white px-2 py-1 text-xs">
            YOUR ENTRY
          </div>
        )}

        {/* Vote animation overlay */}
        <AnimatePresence>
          {showVoteAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <Heart className="w-16 h-16 text-red-500" weight="fill" />
            </motion.div>
          )}
        </AnimatePresence>

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
          <motion.div
            className="flex items-center gap-1 text-sm"
            animate={showVoteAnimation ? { scale: [1, 1.3, 1] } : {}}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${hasVoted ? "text-red-500" : "text-gray-400"}`}
              weight={hasVoted ? "fill" : "regular"}
            />
            <motion.span
              key={submission.votes}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {submission.votes}
            </motion.span>
          </motion.div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{submission.caption}</p>

        {canVote && !isOwnSubmission && (
          <button
            onClick={handleVote}
            disabled={hasVoted || isVoting}
            className={`w-full py-2 text-sm tracking-wider transition flex items-center justify-center gap-2 ${hasVoted
              ? "bg-green-50 text-green-600 border border-green-200"
              : isVoting
                ? "bg-gray-100 text-gray-500"
                : "bg-black text-white hover:bg-gray-800"
              }`}
          >
            {isVoting ? (
              <>
                <SpinnerGap className="w-4 h-4 animate-spin" />
                VOTING...
              </>
            ) : hasVoted ? (
              <>
                <CheckCircle className="w-4 h-4" weight="bold" />
                VOTED
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                VOTE
              </>
            )}
          </button>
        )}

        {/* Share buttons for own submission */}
        {isOwnSubmission && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Share your entry</p>
            <ShareButtons submissionId={submission.id} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Simulate upload progress
  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image must be less than 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl(""); // Clear URL if file is selected
    setShowUrlInput(false);
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if ((!imageUrl && !imageFile) || !caption || selectedProducts.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      // Upload file if selected
      if (imageFile) {
        setUploading(true);
        const progressInterval = simulateProgress();
        const path = generateImagePath('challenges', imageFile.name);
        finalImageUrl = await uploadImage(imageFile, path);
        clearInterval(progressInterval);
        setUploadProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause to show 100%
        setUploading(false);
      }

      const success = await submitEntry(challenge.id, finalImageUrl, caption, selectedProducts);

      if (success) {
        toast.success("Entry submitted successfully!");
        // Reset form
        setImageUrl("");
        setImageFile(null);
        setImagePreview("");
        setCaption("");
        setSelectedProducts([]);
        setStep(1);
        setUploadProgress(0);
        onClose();
      } else {
        toast.error("Failed to submit entry");
      }
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setSubmitting(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentPreview = imagePreview || imageUrl;

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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 transition rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { num: 1, label: "Photo" },
              { num: 2, label: "Products" },
              { num: 3, label: "Caption" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: step === s.num ? 1.1 : 1,
                      backgroundColor: s.num <= step ? "#000" : "#f3f4f6"
                    }}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-full ${s.num <= step ? "text-white" : "text-gray-400"
                      }`}
                  >
                    {s.num < step ? <CheckCircle className="w-5 h-5" weight="bold" /> : s.num}
                  </motion.div>
                  <span className={`text-xs mt-1 ${s.num <= step ? "text-black" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 ${s.num < step ? "bg-black" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-bold text-lg mb-1">Upload Your Photo</h3>
                  <p className="text-sm text-gray-500">Show off your outfit with a clear, full-body shot</p>
                </div>

                {!currentPreview ? (
                  <>
                    {/* Drag & Drop Zone */}
                    <motion.div
                      animate={{
                        borderColor: dragActive ? "#000" : "#d1d5db",
                        backgroundColor: dragActive ? "#f9fafb" : "#fff",
                        scale: dragActive ? 1.02 : 1,
                      }}
                      className="border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer relative overflow-hidden"
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />

                      {/* Animated background pattern when dragging */}
                      <AnimatePresence>
                        {dragActive && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"
                          />
                        )}
                      </AnimatePresence>

                      <div className="relative z-10">
                        <motion.div
                          animate={{
                            y: dragActive ? -5 : 0,
                            scale: dragActive ? 1.1 : 1
                          }}
                          className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                          <Camera className="w-8 h-8 text-gray-400" weight="light" />
                        </motion.div>

                        <p className="text-base font-medium mb-1">
                          {dragActive ? "Drop your image here" : "Drag & drop your photo"}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">or click to browse</p>

                        <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" />
                            JPG, PNG, WEBP
                          </span>
                          <span>•</span>
                          <span>Max 10MB</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* URL Input Toggle */}
                    <div className="text-center">
                      <button
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-sm text-gray-500 hover:text-black transition"
                      >
                        {showUrlInput ? "Hide URL input" : "Or paste an image URL"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showUrlInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="https://your-image-url.com/photo.jpg"
                              className="flex-1 px-4 py-3 border border-gray-200 focus:border-black outline-none text-sm rounded-lg"
                            />
                            {imageUrl && (
                              <button
                                onClick={() => setImageUrl("")}
                                className="px-4 py-3 text-gray-500 hover:text-red-500 transition"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  /* Image Preview */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <div className="relative aspect-[3/4] max-w-xs mx-auto bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                      <Image src={currentPreview} alt="Preview" fill className="object-cover" />

                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white/90 hover:bg-white text-sm font-medium rounded-lg shadow flex items-center gap-2 transition"
                          >
                            <Camera className="w-4 h-4" />
                            Change
                          </button>
                          <button
                            onClick={clearImage}
                            className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium rounded-lg shadow flex items-center gap-2 transition"
                          >
                            <Trash className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Quick delete button */}
                      <button
                        onClick={clearImage}
                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Image success badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" weight="bold" />
                        Ready
                      </motion.div>
                    </div>

                    {imageFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mt-4"
                      >
                        <p className="text-sm font-medium text-gray-700 truncate max-w-xs mx-auto">
                          {imageFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(imageFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!currentPreview}
                  className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-lg flex items-center justify-center gap-2"
                >
                  CONTINUE
                  <CaretRight className="w-4 h-4" />
                </button>
              </motion.div>
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
                      className={`flex items-center gap-2 p-2 border text-left transition ${selectedProducts.includes(product.id)
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
                    <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100">
                      {currentPreview && (
                        <Image src={currentPreview} alt="Preview" fill className="object-cover" />
                      )}
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
                    disabled={submitting}
                    className="flex-1 py-3 border border-gray-200 text-sm tracking-wider hover:bg-gray-50 disabled:opacity-50 transition"
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
                        {uploading ? "UPLOADING..." : "SUBMITTING..."}
                      </>
                    ) : (
                      "SUBMIT ENTRY"
                    )}
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
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
            <span className={`px-2 py-1 text-xs font-medium ${challenge.status === "active" ? "bg-green-500 text-white" :
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
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${prize.place === 1 ? "bg-yellow-100 text-yellow-700" :
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

          {/* Countdown Timer */}
          {challenge.status !== "ended" && (
            <CountdownTimer
              endDate={challenge.status === "voting" ? challenge.votingEndDate : challenge.endDate}
              variant="full"
            />
          )}

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

          {/* Leaderboard */}
          {challenge.submissions.length > 0 && (
            <Leaderboard challengeId={challenge.id} />
          )}

          {/* User Stats */}
          <UserStatsCard />
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
          <span className={`px-2 py-1 text-xs font-medium ${challenge.status === "active" ? "bg-green-500 text-white" :
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
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === tab.key
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
