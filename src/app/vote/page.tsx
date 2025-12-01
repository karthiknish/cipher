"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDesignVoting } from "@/context/DesignVotingContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Trophy, Users, Clock, CheckCircle, Heart, ArrowRight, Confetti } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

export default function VotePage() {
  const { user } = useAuth();
  const { activeContests, contests, loading, vote, getUserVote, getContestStats } = useDesignVoting();
  const toast = useToast();

  const [selectedDesign, setSelectedDesign] = useState<Record<string, "A" | "B" | null>>({});
  const [votingAnimation, setVotingAnimation] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  // Get closed contests with results
  const closedContests = contests.filter(c => c.status === "closed");

  const handleVote = async (contestId: string, choice: "A" | "B") => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    const existingVote = getUserVote(contestId);
    if (existingVote) {
      toast.info("You've already voted on this design");
      return;
    }

    setVotingAnimation(contestId);
    
    const success = await vote(contestId, choice);
    
    setTimeout(() => {
      setVotingAnimation(null);
      if (success) {
        toast.success("Thanks for your vote!");
        setShowResults(prev => ({ ...prev, [contestId]: true }));
      } else {
        toast.error("Failed to submit vote");
      }
    }, 800);
  };

  const handleDesignHover = (contestId: string, design: "A" | "B") => {
    if (!getUserVote(contestId)) {
      setSelectedDesign(prev => ({ ...prev, [contestId]: design }));
    }
  };

  const handleDesignLeave = (contestId: string) => {
    if (!getUserVote(contestId)) {
      setSelectedDesign(prev => ({ ...prev, [contestId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-black text-white py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.2em] mb-4">COMMUNITY VOTE</h1>
          <p className="text-gray-400 max-w-lg mx-auto px-4">
            Help shape our next designs. Your vote matters in deciding which concepts become reality.
          </p>
        </motion.div>
      </div>

      {/* Active Contests */}
      <div className="container mx-auto px-4 py-16">
        {activeContests.length === 0 && closedContests.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-light mb-2">No Active Voting</h2>
            <p className="text-gray-500 text-sm mb-6">Check back soon for new design contests</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm tracking-wider underline underline-offset-4"
            >
              Browse Shop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-20">
            {/* Active Contests */}
            {activeContests.length > 0 && (
              <div>
                <div className="text-center mb-12">
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 text-xs tracking-wider rounded-full mb-4">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    VOTING OPEN
                  </span>
                  <h2 className="text-2xl font-light tracking-wide">Active Contests</h2>
                </div>

                <div className="space-y-16">
                  {activeContests.map((contest, index) => {
                    const stats = getContestStats(contest.id);
                    const userVote = getUserVote(contest.id);
                    const hasVoted = !!userVote;
                    const showResultsForContest = showResults[contest.id] || hasVoted;

                    return (
                      <motion.div
                        key={contest.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {/* Contest Header */}
                        <div className="text-center mb-8">
                          <h3 className="text-xl font-light mb-2">{contest.title}</h3>
                          <p className="text-gray-500 text-sm max-w-md mx-auto">{contest.description}</p>
                          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Ends {new Date(contest.endDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {stats.total} votes
                            </span>
                          </div>
                        </div>

                        {/* A/B Design Cards */}
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                          {/* Design A */}
                          <motion.div
                            className={`relative group cursor-pointer ${hasVoted && userVote !== "A" ? "opacity-60" : ""}`}
                            whileHover={!hasVoted ? { scale: 1.02 } : {}}
                            onMouseEnter={() => handleDesignHover(contest.id, "A")}
                            onMouseLeave={() => handleDesignLeave(contest.id)}
                            onClick={() => !hasVoted && handleVote(contest.id, "A")}
                          >
                            <div className={`border-2 transition-all duration-300 ${
                              selectedDesign[contest.id] === "A" ? "border-black" : 
                              userVote === "A" ? "border-green-500" : "border-gray-100"
                            }`}>
                              <div className="aspect-[4/5] relative bg-gray-50 overflow-hidden">
                                {contest.designA.imageUrl ? (
                                  <Image
                                    src={contest.designA.imageUrl}
                                    alt={contest.designA.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <span className="text-gray-300">Design A</span>
                                  </div>
                                )}

                                {/* Voting Animation Overlay */}
                                <AnimatePresence>
                                  {votingAnimation === contest.id && selectedDesign[contest.id] === "A" && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-black/70 flex items-center justify-center"
                                    >
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-white"
                                      >
                                        <Confetti className="w-16 h-16" weight="fill" />
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Vote Badge */}
                                {userVote === "A" && (
                                  <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full">
                                    <CheckCircle className="w-5 h-5" weight="fill" />
                                  </div>
                                )}

                                {/* Hover Overlay */}
                                {!hasVoted && (
                                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                                    selectedDesign[contest.id] === "A" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  }`}>
                                    <span className="text-white text-sm tracking-wider px-6 py-3 border border-white">
                                      VOTE FOR A
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-4">
                                <h4 className="font-medium mb-1">{contest.designA.title}</h4>
                                {contest.designA.description && (
                                  <p className="text-sm text-gray-500">{contest.designA.description}</p>
                                )}

                                {/* Results Bar */}
                                {showResultsForContest && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4"
                                  >
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="font-medium">{stats.percentA}%</span>
                                      <span className="text-gray-400">{contest.designA.votes} votes</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.percentA}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="h-full bg-black"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>

                          {/* VS Divider (mobile) */}
                          <div className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 md:flex items-center justify-center">
                            <span className="bg-white px-4 py-2 text-sm tracking-wider text-gray-400">VS</span>
                          </div>

                          {/* Design B */}
                          <motion.div
                            className={`relative group cursor-pointer ${hasVoted && userVote !== "B" ? "opacity-60" : ""}`}
                            whileHover={!hasVoted ? { scale: 1.02 } : {}}
                            onMouseEnter={() => handleDesignHover(contest.id, "B")}
                            onMouseLeave={() => handleDesignLeave(contest.id)}
                            onClick={() => !hasVoted && handleVote(contest.id, "B")}
                          >
                            <div className={`border-2 transition-all duration-300 ${
                              selectedDesign[contest.id] === "B" ? "border-black" : 
                              userVote === "B" ? "border-green-500" : "border-gray-100"
                            }`}>
                              <div className="aspect-[4/5] relative bg-gray-50 overflow-hidden">
                                {contest.designB.imageUrl ? (
                                  <Image
                                    src={contest.designB.imageUrl}
                                    alt={contest.designB.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <span className="text-gray-300">Design B</span>
                                  </div>
                                )}

                                {/* Voting Animation Overlay */}
                                <AnimatePresence>
                                  {votingAnimation === contest.id && selectedDesign[contest.id] === "B" && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-black/70 flex items-center justify-center"
                                    >
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-white"
                                      >
                                        <Confetti className="w-16 h-16" weight="fill" />
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Vote Badge */}
                                {userVote === "B" && (
                                  <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full">
                                    <CheckCircle className="w-5 h-5" weight="fill" />
                                  </div>
                                )}

                                {/* Hover Overlay */}
                                {!hasVoted && (
                                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                                    selectedDesign[contest.id] === "B" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  }`}>
                                    <span className="text-white text-sm tracking-wider px-6 py-3 border border-white">
                                      VOTE FOR B
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-4">
                                <h4 className="font-medium mb-1">{contest.designB.title}</h4>
                                {contest.designB.description && (
                                  <p className="text-sm text-gray-500">{contest.designB.description}</p>
                                )}

                                {/* Results Bar */}
                                {showResultsForContest && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4"
                                  >
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="font-medium">{stats.percentB}%</span>
                                      <span className="text-gray-400">{contest.designB.votes} votes</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.percentB}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="h-full bg-gray-400"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Login Prompt */}
                        {!user && (
                          <div className="text-center mt-8">
                            <Link
                              href="/login"
                              className="inline-flex items-center gap-2 text-sm tracking-wider bg-black text-white px-8 py-3 hover:bg-gray-900 transition-colors"
                            >
                              LOGIN TO VOTE
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Results */}
            {closedContests.length > 0 && (
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-light tracking-wide mb-2">Past Results</h2>
                  <p className="text-gray-500 text-sm">See which designs our community chose</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {closedContests.map((contest) => {
                    const stats = getContestStats(contest.id);
                    const winnerDesign = contest.winner === "A" ? contest.designA : contest.designB;
                    
                    return (
                      <motion.div
                        key={contest.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-100"
                      >
                        <div className="aspect-square relative bg-gray-50">
                          {winnerDesign.imageUrl && (
                            <Image
                              src={winnerDesign.imageUrl}
                              alt={winnerDesign.title}
                              fill
                              className="object-cover"
                            />
                          )}
                          <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1.5 text-xs tracking-wider flex items-center gap-1">
                            <Trophy className="w-4 h-4" weight="fill" />
                            WINNER
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium mb-1">{contest.title}</h4>
                          <p className="text-sm text-gray-500 mb-3">
                            {winnerDesign.title} won with {contest.winner === "A" ? stats.percentA : stats.percentB}% of {stats.total} votes
                          </p>
                          <div className="flex gap-1">
                            <div className="h-2 bg-black rounded-l" style={{ width: `${stats.percentA}%` }} />
                            <div className="h-2 bg-gray-300 rounded-r" style={{ width: `${stats.percentB}%` }} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
