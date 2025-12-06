"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  imageUrl: string;
  caption: string;
  productIds: string[];
  votes: number;
  votedBy: string[];
  createdAt: number;
}

export interface StyleChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  coverImage: string;
  startDate: number;
  endDate: number;
  votingEndDate: number;
  status: "upcoming" | "active" | "voting" | "ended";
  prizes: {
    place: number;
    reward: string;
    points: number;
  }[];
  requirements: string[];
  submissions: ChallengeSubmission[];
  winners?: {
    place: number;
    submissionId: string;
    userId: string;
  }[];
  featured: boolean;
  participantCount: number;
}

export interface UserChallengeStats {
  totalParticipations: number;
  totalWins: number;
  totalVotesReceived: number;
  totalVotesGiven: number;
  currentRank?: number;
  badges: string[];
  recentSubmissions: ChallengeSubmission[];
}

interface StyleChallengeContextType {
  challenges: StyleChallenge[];
  loading: boolean;
  getActiveChallenge: () => StyleChallenge | null;
  getUpcomingChallenges: () => StyleChallenge[];
  getPastChallenges: () => StyleChallenge[];
  getChallengeById: (id: string) => StyleChallenge | null;
  submitEntry: (challengeId: string, imageUrl: string, caption: string, productIds: string[]) => Promise<boolean>;
  voteForSubmission: (challengeId: string, submissionId: string) => Promise<boolean>;
  hasUserSubmitted: (challengeId: string) => boolean;
  hasUserVoted: (challengeId: string, submissionId: string) => boolean;
  getUserSubmission: (challengeId: string) => ChallengeSubmission | null;
  getTopSubmissions: (challengeId: string, limit?: number) => ChallengeSubmission[];
  getUserStats: () => UserChallengeStats;
  getLeaderboard: (challengeId: string) => { submission: ChallengeSubmission; rank: number }[];
  shareSubmission: (submissionId: string, platform: "twitter" | "facebook" | "copy") => void;
}

// Sample challenges data
const SAMPLE_CHALLENGES: StyleChallenge[] = [
  {
    id: "challenge-1",
    title: "Winter Streetwear",
    description: "Show us your best winter streetwear look! Layer up with CIPHER pieces and showcase how you stay stylish in the cold.",
    theme: "winter",
    coverImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
    startDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
    votingEndDate: Date.now() + 4 * 24 * 60 * 60 * 1000,
    status: "active",
    prizes: [
      { place: 1, reward: "$500 Store Credit + Featured on Homepage", points: 5000 },
      { place: 2, reward: "$250 Store Credit", points: 2500 },
      { place: 3, reward: "$100 Store Credit", points: 1000 },
    ],
    requirements: [
      "Must include at least one CIPHER product",
      "Original photo only",
      "Full outfit must be visible",
      "No filters or heavy editing",
    ],
    submissions: [
      {
        id: "sub-1",
        challengeId: "challenge-1",
        userId: "user-1",
        userName: "Alex Chen",
        userAvatar: "https://i.pravatar.cc/150?u=alex",
        imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600",
        caption: "Keeping it cozy with the CIPHER hoodie and cargo combo 🔥",
        productIds: ["1", "3"],
        votes: 127,
        votedBy: ["user-2", "user-3", "user-4"],
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      },
      {
        id: "sub-2",
        challengeId: "challenge-1",
        userId: "user-2",
        userName: "Jordan Smith",
        userAvatar: "https://i.pravatar.cc/150?u=jordan",
        imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
        caption: "Layered up for the city streets ❄️",
        productIds: ["2", "6"],
        votes: 98,
        votedBy: ["user-1", "user-5"],
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      },
      {
        id: "sub-3",
        challengeId: "challenge-1",
        userId: "user-3",
        userName: "Maya Johnson",
        userAvatar: "https://i.pravatar.cc/150?u=maya",
        imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600",
        caption: "Minimalist winter vibes with CIPHER essentials",
        productIds: ["1", "4"],
        votes: 156,
        votedBy: ["user-1", "user-2", "user-4", "user-5"],
        createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      },
    ],
    featured: true,
    participantCount: 234,
  },
  {
    id: "challenge-2",
    title: "Monochrome Madness",
    description: "Create a stunning all-black or all-white outfit using CIPHER pieces. Show us your best monochromatic style!",
    theme: "monochrome",
    coverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    startDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    votingEndDate: Date.now() + 12 * 24 * 60 * 60 * 1000,
    status: "upcoming",
    prizes: [
      { place: 1, reward: "$300 Store Credit + Exclusive Drop Access", points: 3000 },
      { place: 2, reward: "$150 Store Credit", points: 1500 },
      { place: 3, reward: "$75 Store Credit", points: 750 },
    ],
    requirements: [
      "Must be all black OR all white outfit",
      "Minimum 2 CIPHER products",
      "Original photo only",
    ],
    submissions: [],
    featured: true,
    participantCount: 0,
  },
  {
    id: "challenge-3",
    title: "Street Classics",
    description: "The ultimate streetwear challenge. Mix vintage vibes with modern CIPHER pieces.",
    theme: "street",
    coverImage: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800",
    startDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
    endDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    votingEndDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    status: "ended",
    prizes: [
      { place: 1, reward: "$400 Store Credit", points: 4000 },
      { place: 2, reward: "$200 Store Credit", points: 2000 },
      { place: 3, reward: "$100 Store Credit", points: 1000 },
    ],
    requirements: [
      "Include at least one CIPHER product",
      "Original photo only",
    ],
    submissions: [
      {
        id: "sub-4",
        challengeId: "challenge-3",
        userId: "user-5",
        userName: "Chris Lee",
        userAvatar: "https://i.pravatar.cc/150?u=chris",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
        caption: "Classic street vibes never go out of style",
        productIds: ["1", "3", "4"],
        votes: 312,
        votedBy: [],
        createdAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
      },
    ],
    winners: [
      { place: 1, submissionId: "sub-4", userId: "user-5" },
    ],
    featured: false,
    participantCount: 189,
  },
];

const StyleChallengeContext = createContext<StyleChallengeContextType>({
  challenges: [],
  loading: true,
  getActiveChallenge: () => null,
  getUpcomingChallenges: () => [],
  getPastChallenges: () => [],
  getChallengeById: () => null,
  submitEntry: async () => false,
  voteForSubmission: async () => false,
  hasUserSubmitted: () => false,
  hasUserVoted: () => false,
  getUserSubmission: () => null,
  getTopSubmissions: () => [],
  getUserStats: () => ({
    totalParticipations: 0,
    totalWins: 0,
    totalVotesReceived: 0,
    totalVotesGiven: 0,
    badges: [],
    recentSubmissions: []
  }),
  getLeaderboard: () => [],
  shareSubmission: () => { },
});

export const useStyleChallenges = () => useContext(StyleChallengeContext);

export const StyleChallengeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<StyleChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setChallenges(SAMPLE_CHALLENGES);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getActiveChallenge = useCallback(() => {
    return challenges.find(c => c.status === "active" || c.status === "voting") || null;
  }, [challenges]);

  const getUpcomingChallenges = useCallback(() => {
    return challenges.filter(c => c.status === "upcoming");
  }, [challenges]);

  const getPastChallenges = useCallback(() => {
    return challenges.filter(c => c.status === "ended");
  }, [challenges]);

  const getChallengeById = useCallback((id: string) => {
    return challenges.find(c => c.id === id) || null;
  }, [challenges]);

  const submitEntry = useCallback(async (
    challengeId: string,
    imageUrl: string,
    caption: string,
    productIds: string[]
  ): Promise<boolean> => {
    if (!user) return false;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.status !== "active") return false;

    // Check if user already submitted
    if (challenge.submissions.some(s => s.userId === user.uid)) return false;

    const newSubmission: ChallengeSubmission = {
      id: `sub-${Date.now()}`,
      challengeId,
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userAvatar: user.photoURL || undefined,
      imageUrl,
      caption,
      productIds,
      votes: 0,
      votedBy: [],
      createdAt: Date.now(),
    };

    setChallenges(prev => prev.map(c => {
      if (c.id === challengeId) {
        return {
          ...c,
          submissions: [...c.submissions, newSubmission],
          participantCount: c.participantCount + 1,
        };
      }
      return c;
    }));

    return true;
  }, [user, challenges]);

  const voteForSubmission = useCallback(async (
    challengeId: string,
    submissionId: string
  ): Promise<boolean> => {
    if (!user) return false;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || (challenge.status !== "active" && challenge.status !== "voting")) return false;

    const submission = challenge.submissions.find(s => s.id === submissionId);
    if (!submission) return false;

    // Check if user already voted
    if (submission.votedBy.includes(user.uid)) return false;

    // Can't vote for own submission
    if (submission.userId === user.uid) return false;

    setChallenges(prev => prev.map(c => {
      if (c.id === challengeId) {
        return {
          ...c,
          submissions: c.submissions.map(s => {
            if (s.id === submissionId) {
              return {
                ...s,
                votes: s.votes + 1,
                votedBy: [...s.votedBy, user.uid],
              };
            }
            return s;
          }),
        };
      }
      return c;
    }));

    return true;
  }, [user, challenges]);

  const hasUserSubmitted = useCallback((challengeId: string): boolean => {
    if (!user) return false;
    const challenge = challenges.find(c => c.id === challengeId);
    return challenge?.submissions.some(s => s.userId === user.uid) || false;
  }, [user, challenges]);

  const hasUserVoted = useCallback((challengeId: string, submissionId: string): boolean => {
    if (!user) return false;
    const challenge = challenges.find(c => c.id === challengeId);
    const submission = challenge?.submissions.find(s => s.id === submissionId);
    return submission?.votedBy.includes(user.uid) || false;
  }, [user, challenges]);

  const getUserSubmission = useCallback((challengeId: string): ChallengeSubmission | null => {
    if (!user) return null;
    const challenge = challenges.find(c => c.id === challengeId);
    return challenge?.submissions.find(s => s.userId === user.uid) || null;
  }, [user, challenges]);

  const getTopSubmissions = useCallback((challengeId: string, limit = 10): ChallengeSubmission[] => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return [];
    return [...challenge.submissions]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit);
  }, [challenges]);

  const getUserStats = useCallback((): UserChallengeStats => {
    if (!user) {
      return {
        totalParticipations: 0,
        totalWins: 0,
        totalVotesReceived: 0,
        totalVotesGiven: 0,
        badges: [],
        recentSubmissions: [],
      };
    }

    // Gather all user submissions across all challenges
    const userSubmissions: ChallengeSubmission[] = [];
    let totalVotesReceived = 0;
    let totalVotesGiven = 0;
    let totalWins = 0;

    challenges.forEach(challenge => {
      // Count submissions
      challenge.submissions.forEach(sub => {
        if (sub.userId === user.uid) {
          userSubmissions.push(sub);
          totalVotesReceived += sub.votes;
        }
        // Count votes given by this user
        if (sub.votedBy.includes(user.uid)) {
          totalVotesGiven++;
        }
      });

      // Count wins
      challenge.winners?.forEach(winner => {
        if (winner.userId === user.uid) {
          totalWins++;
        }
      });
    });

    // Calculate badges
    const badges: string[] = [];
    if (userSubmissions.length >= 1) badges.push("first_entry");
    if (userSubmissions.length >= 5) badges.push("regular_contestant");
    if (userSubmissions.length >= 10) badges.push("style_veteran");
    if (totalWins >= 1) badges.push("challenge_winner");
    if (totalWins >= 3) badges.push("style_champion");
    if (totalVotesReceived >= 50) badges.push("crowd_favorite");
    if (totalVotesReceived >= 100) badges.push("style_icon");
    if (totalVotesGiven >= 10) badges.push("active_voter");
    if (totalVotesGiven >= 50) badges.push("community_supporter");

    // Get current rank in active challenge
    let currentRank: number | undefined;
    const activeChallenge = challenges.find(c => c.status === "active" || c.status === "voting");
    if (activeChallenge) {
      const ranked = [...activeChallenge.submissions].sort((a, b) => b.votes - a.votes);
      const userRankIndex = ranked.findIndex(s => s.userId === user.uid);
      if (userRankIndex >= 0) {
        currentRank = userRankIndex + 1;
      }
    }

    return {
      totalParticipations: userSubmissions.length,
      totalWins,
      totalVotesReceived,
      totalVotesGiven,
      currentRank,
      badges,
      recentSubmissions: userSubmissions.slice(-5).reverse(),
    };
  }, [user, challenges]);

  const getLeaderboard = useCallback((challengeId: string): { submission: ChallengeSubmission; rank: number }[] => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return [];

    return [...challenge.submissions]
      .sort((a, b) => b.votes - a.votes)
      .map((submission, index) => ({
        submission,
        rank: index + 1,
      }));
  }, [challenges]);

  const shareSubmission = useCallback((submissionId: string, platform: "twitter" | "facebook" | "copy") => {
    // Find the submission
    let submission: ChallengeSubmission | null = null;
    let challenge: StyleChallenge | null = null;

    for (const c of challenges) {
      const s = c.submissions.find(sub => sub.id === submissionId);
      if (s) {
        submission = s;
        challenge = c;
        break;
      }
    }

    if (!submission || !challenge) return;

    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/challenges?submission=${submissionId}`;
    const shareText = `Check out my entry in the ${challenge.title} challenge on CIPHER! ${submission.caption}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          "_blank"
        );
        break;
      case "copy":
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl);
        }
        break;
    }
  }, [challenges]);

  return (
    <StyleChallengeContext.Provider value={{
      challenges,
      loading,
      getActiveChallenge,
      getUpcomingChallenges,
      getPastChallenges,
      getChallengeById,
      submitEntry,
      voteForSubmission,
      hasUserSubmitted,
      hasUserVoted,
      getUserSubmission,
      getTopSubmissions,
      getUserStats,
      getLeaderboard,
      shareSubmission,
    }}>
      {children}
    </StyleChallengeContext.Provider>
  );
};
