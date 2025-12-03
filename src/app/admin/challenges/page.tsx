"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStyleChallenges, StyleChallenge } from "@/context/StyleChallengeContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  SpinnerGap, 
  ShieldWarning, 
  Plus,
  Trophy,
  Pencil,
  Trash,
  Eye,
  Users,
  Clock,
  Fire,
  X,
  CheckCircle,
  CalendarBlank,
} from "@phosphor-icons/react";
import AdminLayout from "../components/AdminLayout";

function ChallengesPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { challenges } = useStyleChallenges();
  const toast = useToast();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<StyleChallenge | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "upcoming" | "ended">("all");

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const filteredChallenges = challenges.filter(c => 
    filterStatus === "all" || c.status === filterStatus
  );

  const handleDelete = (challengeId: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;
    // In a real app, this would delete from the database
    toast.success("Challenge deleted successfully");
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="bg-black text-white px-8 py-4 text-sm tracking-wider hover:bg-gray-900 transition"
        >
          RETURN HOME
        </button>
      </div>
    );
  }

  // Stats
  const stats = {
    total: challenges.length,
    active: challenges.filter(c => c.status === "active" || c.status === "voting").length,
    totalParticipants: challenges.reduce((sum, c) => sum + c.participantCount, 0),
    totalSubmissions: challenges.reduce((sum, c) => sum + c.submissions.length, 0),
  };

  return (
    <AdminLayout 
      title="Style Challenges" 
      activeTab="challenges"
      actions={
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs tracking-wider hover:bg-gray-100 transition"
        >
          <Plus className="w-4 h-4" /> CREATE CHALLENGE
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Challenges</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{stats.totalParticipants}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Participants</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Submissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {["all", "active", "upcoming", "ended"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as typeof filterStatus)}
            className={`px-4 py-2 text-sm ${
              filterStatus === status
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Challenges Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">CHALLENGE</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">STATUS</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">DATES</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">SUBMISSIONS</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredChallenges.map((challenge) => (
              <tr key={challenge.id} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-10 bg-gray-100 flex-shrink-0">
                      <Image
                        src={challenge.coverImage}
                        alt={challenge.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {challenge.title}
                        {challenge.featured && <Fire className="w-4 h-4 text-orange-500" weight="fill" />}
                      </p>
                      <p className="text-xs text-gray-500">{challenge.theme}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium ${
                    challenge.status === "active" ? "bg-green-100 text-green-700" :
                    challenge.status === "voting" ? "bg-blue-100 text-blue-700" :
                    challenge.status === "upcoming" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {challenge.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">
                    <p className="flex items-center gap-1">
                      <CalendarBlank className="w-3 h-3 text-gray-400" />
                      {new Date(challenge.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      to {new Date(challenge.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {challenge.participantCount}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>{challenge.submissions.length} entries</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/challenges`, "_blank")}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingChallenge(challenge);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(challenge.id)}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No challenges found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">
                {editingChallenge ? "Edit Challenge" : "Create New Challenge"}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingChallenge(null);
                }}
                className="p-2 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                Challenge creation form would go here.
                <br />
                This is a placeholder for the full implementation.
              </p>
              <button
                onClick={() => {
                  toast.success(editingChallenge ? "Challenge updated!" : "Challenge created!");
                  setShowModal(false);
                  setEditingChallenge(null);
                }}
                className="w-full bg-black text-white py-3 text-sm tracking-wider hover:bg-gray-800 transition"
              >
                {editingChallenge ? "UPDATE CHALLENGE" : "CREATE CHALLENGE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function ChallengesPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function ChallengesPage() {
  return (
    <Suspense fallback={<ChallengesPageLoading />}>
      <ChallengesPageContent />
    </Suspense>
  );
}
