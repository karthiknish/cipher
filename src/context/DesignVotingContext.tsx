"use client";
import { createContext, use, useEffect, useState, ReactNode, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface DesignOption {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  votes: number;
  voters: string[];
}

export interface DesignContest {
  id: string;
  title: string;
  description: string;
  designA: Omit<DesignOption, "id">;
  designB: Omit<DesignOption, "id">;
  status: "draft" | "active" | "closed";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  createdBy: string;
  totalVotes: number;
  winner?: "A" | "B" | "tie";
}

interface DesignVotingContextType {
  contests: DesignContest[];
  activeContests: DesignContest[];
  loading: boolean;
  createContest: (
    contest: Omit<DesignContest, "id" | "createdAt" | "totalVotes" | "winner">
  ) => Promise<string | null>;
  updateContest: (id: string, updates: Partial<DesignContest>) => Promise<boolean>;
  deleteContest: (id: string) => Promise<boolean>;
  vote: (contestId: string, choice: "A" | "B") => Promise<boolean>;
  getUserVote: (contestId: string) => "A" | "B" | null;
  closeContest: (id: string) => Promise<boolean>;
  getContestStats: (id: string) => { percentA: number; percentB: number; total: number };
}

const DesignVotingContext = createContext<DesignVotingContextType | undefined>(
  undefined
);

export function DesignVotingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const convexContests = useQuery(api.designContests.list);
  const createMut = useMutation(api.designContests.create);
  const updateMut = useMutation(api.designContests.update);
  const removeMut = useMutation(api.designContests.remove);
  const voteMut = useMutation(api.designContests.vote);
  const closeMut = useMutation(api.designContests.close);

  const [userVotes, setUserVotes] = useState<Record<string, "A" | "B">>({});

  const contests: DesignContest[] = (convexContests ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    designA: c.designA as DesignContest["designA"],
    designB: c.designB as DesignContest["designB"],
    status: c.status as DesignContest["status"],
    startDate: new Date(c.startDate),
    endDate: new Date(c.endDate),
    createdAt: new Date(c.createdAt),
    createdBy: c.createdBy,
    totalVotes: c.totalVotes,
    winner: c.winner as DesignContest["winner"],
  }));

  const loading = convexContests === undefined;

  useEffect(() => {
    const userId = user?.uid;
    if (!userId) return;
    const stored = localStorage.getItem(`cipher-design-votes-${userId}`);
    if (stored) setUserVotes(JSON.parse(stored));
    const votesMap: Record<string, "A" | "B"> = {};
    for (const contest of contests) {
      const aVoters = new Set(contest.designA.voters ?? []);
      const bVoters = new Set(contest.designB.voters ?? []);
      if (aVoters.has(userId)) votesMap[contest.id] = "A";
      else if (bVoters.has(userId)) votesMap[contest.id] = "B";
    }
    if (Object.keys(votesMap).length > 0) {
      setUserVotes((prev) => ({ ...prev, ...votesMap }));
    }
  }, [user?.uid, contests]);

  const activeContests = contests.filter((c) => c.status === "active");

  const createContest = async (
    contestData: Omit<DesignContest, "id" | "createdAt" | "totalVotes" | "winner">
  ): Promise<string | null> => {
    try {
      return await createMut({
        title: contestData.title,
        description: contestData.description,
        designA: { ...contestData.designA, votes: 0, voters: [] },
        designB: { ...contestData.designB, votes: 0, voters: [] },
        status: contestData.status,
        startDate: contestData.startDate.getTime(),
        endDate: contestData.endDate.getTime(),
        createdBy: contestData.createdBy,
      });
    } catch {
      return null;
    }
  };

  const updateContest = async (
    id: string,
    updates: Partial<DesignContest>
  ): Promise<boolean> => {
    try {
      const patch: Record<string, unknown> = { ...updates };
      if (updates.startDate) patch.startDate = updates.startDate.getTime();
      if (updates.endDate) patch.endDate = updates.endDate.getTime();
      await updateMut({ id, patch });
      return true;
    } catch {
      return false;
    }
  };

  const deleteContest = async (id: string): Promise<boolean> => {
    try {
      await removeMut({ id });
      return true;
    } catch {
      return false;
    }
  };

  const vote = async (contestId: string, choice: "A" | "B"): Promise<boolean> => {
    const userId = user?.uid;
    if (!userId || getUserVote(contestId)) return false;
    try {
      const ok = await voteMut({ contestId, choice });
      if (ok) {
        const newVotes = { ...userVotes, [contestId]: choice };
        setUserVotes(newVotes);
        localStorage.setItem(
          `cipher-design-votes-${userId}`,
          JSON.stringify(newVotes)
        );
      }
      return ok;
    } catch {
      return false;
    }
  };

  const getUserVote = (contestId: string): "A" | "B" | null =>
    userVotes[contestId] ?? null;

  const closeContest = async (id: string): Promise<boolean> => {
    try {
      await closeMut({ id });
      return true;
    } catch {
      return false;
    }
  };

  const getContestStats = (id: string) => {
    const contest = contests.find((c) => c.id === id);
    if (!contest) return { percentA: 0, percentB: 0, total: 0 };
    const total = contest.designA.votes + contest.designB.votes;
    if (total === 0) return { percentA: 50, percentB: 50, total: 0 };
    return {
      percentA: Math.round((contest.designA.votes / total) * 100),
      percentB: Math.round((contest.designB.votes / total) * 100),
      total,
    };
  };

  const contextValue = useMemo(
    () => ({
        contests,
        activeContests,
        loading,
        createContest,
        updateContest,
        deleteContest,
        vote,
        getUserVote,
        closeContest,
        getContestStats,
      }),
    [activeContests, closeContest, contests, createContest, deleteContest, getContestStats, getUserVote, loading, updateContest, vote]
  );

  return (
    <DesignVotingContext.Provider value={contextValue}>
      {children}
    </DesignVotingContext.Provider>
  );
}

export function useDesignVoting() {
  const context = use(DesignVotingContext);
  if (!context) {
    throw new Error("useDesignVoting must be used within a DesignVotingProvider");
  }
  return context;
}
