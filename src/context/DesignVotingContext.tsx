"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, increment, arrayUnion, arrayRemove, where, getDocs } from "firebase/firestore";

export interface DesignOption {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  votes: number;
  voters: string[]; // user IDs who voted
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
  createContest: (contest: Omit<DesignContest, "id" | "createdAt" | "totalVotes" | "winner">) => Promise<string | null>;
  updateContest: (id: string, updates: Partial<DesignContest>) => Promise<boolean>;
  deleteContest: (id: string) => Promise<boolean>;
  vote: (contestId: string, choice: "A" | "B") => Promise<boolean>;
  getUserVote: (contestId: string) => "A" | "B" | null;
  closeContest: (id: string) => Promise<boolean>;
  getContestStats: (id: string) => { percentA: number; percentB: number; total: number };
}

const DesignVotingContext = createContext<DesignVotingContextType | undefined>(undefined);

export function DesignVotingProvider({ children }: { children: ReactNode }) {
  const [contests, setContests] = useState<DesignContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, "A" | "B">>({});

  // Subscribe to contests collection
  useEffect(() => {
    const q = query(collection(db, "designContests"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contestData: DesignContest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        contestData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          designA: data.designA,
          designB: data.designB,
          status: data.status,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
          totalVotes: data.totalVotes || 0,
          winner: data.winner,
        });
      });
      setContests(contestData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching design contests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user votes from localStorage and Firebase
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Load from localStorage first
    const stored = localStorage.getItem(`cipher-design-votes-${userId}`);
    if (stored) {
      setUserVotes(JSON.parse(stored));
    }

    // Also sync with Firebase for the active contests
    const syncVotes = async () => {
      const votesMap: Record<string, "A" | "B"> = {};
      for (const contest of contests) {
        if (contest.designA.voters?.includes(userId)) {
          votesMap[contest.id] = "A";
        } else if (contest.designB.voters?.includes(userId)) {
          votesMap[contest.id] = "B";
        }
      }
      if (Object.keys(votesMap).length > 0) {
        setUserVotes(prev => ({ ...prev, ...votesMap }));
        localStorage.setItem(`cipher-design-votes-${userId}`, JSON.stringify({ ...userVotes, ...votesMap }));
      }
    };
    
    if (contests.length > 0) {
      syncVotes();
    }
  }, [auth.currentUser?.uid, contests.length]);

  const activeContests = contests.filter(c => c.status === "active");

  const createContest = async (contestData: Omit<DesignContest, "id" | "createdAt" | "totalVotes" | "winner">): Promise<string | null> => {
    try {
      const docRef = await addDoc(collection(db, "designContests"), {
        ...contestData,
        designA: { ...contestData.designA, votes: 0, voters: [] },
        designB: { ...contestData.designB, votes: 0, voters: [] },
        createdAt: serverTimestamp(),
        totalVotes: 0,
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating contest:", error);
      return null;
    }
  };

  const updateContest = async (id: string, updates: Partial<DesignContest>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "designContests", id), updates);
      return true;
    } catch (error) {
      console.error("Error updating contest:", error);
      return false;
    }
  };

  const deleteContest = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, "designContests", id));
      return true;
    } catch (error) {
      console.error("Error deleting contest:", error);
      return false;
    }
  };

  const vote = async (contestId: string, choice: "A" | "B"): Promise<boolean> => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("User must be logged in to vote");
      return false;
    }

    const contest = contests.find(c => c.id === contestId);
    if (!contest || contest.status !== "active") {
      console.error("Contest not found or not active");
      return false;
    }

    // Check if user already voted
    const previousVote = getUserVote(contestId);
    if (previousVote) {
      console.error("User has already voted");
      return false;
    }

    try {
      const contestRef = doc(db, "designContests", contestId);
      
      if (choice === "A") {
        await updateDoc(contestRef, {
          "designA.votes": increment(1),
          "designA.voters": arrayUnion(userId),
          totalVotes: increment(1),
        });
      } else {
        await updateDoc(contestRef, {
          "designB.votes": increment(1),
          "designB.voters": arrayUnion(userId),
          totalVotes: increment(1),
        });
      }

      // Save vote locally
      const newVotes = { ...userVotes, [contestId]: choice };
      setUserVotes(newVotes);
      localStorage.setItem(`cipher-design-votes-${userId}`, JSON.stringify(newVotes));

      return true;
    } catch (error) {
      console.error("Error voting:", error);
      return false;
    }
  };

  const getUserVote = (contestId: string): "A" | "B" | null => {
    return userVotes[contestId] || null;
  };

  const closeContest = async (id: string): Promise<boolean> => {
    const contest = contests.find(c => c.id === id);
    if (!contest) return false;

    const votesA = contest.designA.votes;
    const votesB = contest.designB.votes;
    let winner: "A" | "B" | "tie" = "tie";
    
    if (votesA > votesB) winner = "A";
    else if (votesB > votesA) winner = "B";

    try {
      await updateDoc(doc(db, "designContests", id), {
        status: "closed",
        winner,
      });
      return true;
    } catch (error) {
      console.error("Error closing contest:", error);
      return false;
    }
  };

  const getContestStats = (id: string) => {
    const contest = contests.find(c => c.id === id);
    if (!contest) return { percentA: 0, percentB: 0, total: 0 };

    const total = contest.designA.votes + contest.designB.votes;
    if (total === 0) return { percentA: 50, percentB: 50, total: 0 };

    return {
      percentA: Math.round((contest.designA.votes / total) * 100),
      percentB: Math.round((contest.designB.votes / total) * 100),
      total,
    };
  };

  return (
    <DesignVotingContext.Provider value={{
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
    }}>
      {children}
    </DesignVotingContext.Provider>
  );
}

export function useDesignVoting() {
  const context = useContext(DesignVotingContext);
  if (!context) {
    throw new Error("useDesignVoting must be used within a DesignVotingProvider");
  }
  return context;
}
