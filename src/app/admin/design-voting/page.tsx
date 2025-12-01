"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useDesignVoting } from "@/context/DesignVotingContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Upload, Image as ImageIcon, Trash, Eye, Calendar, Trophy } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDesignVotingPage() {
  const { user, userRole } = useAuth();
  const { contests, loading, createContest, updateContest, deleteContest, closeContest, getContestStats } = useDesignVoting();
  const toast = useToast();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    designATitle: "",
    designADescription: "",
    designAImage: "",
    designBTitle: "",
    designBDescription: "",
    designBImage: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "draft" as "draft" | "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewTab, setPreviewTab] = useState<"A" | "B">("A");

  if (!user || !userRole?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Access Denied</h1>
          <p className="text-gray-500 mb-6">You need admin access to view this page.</p>
          <Link href="/" className="text-sm tracking-wider underline underline-offset-4">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const handleCreateContest = async () => {
    if (!formData.title || !formData.designATitle || !formData.designBTitle || !formData.designAImage || !formData.designBImage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const contestId = await createContest({
        title: formData.title,
        description: formData.description,
        designA: {
          imageUrl: formData.designAImage,
          title: formData.designATitle,
          description: formData.designADescription,
          votes: 0,
          voters: [],
        },
        designB: {
          imageUrl: formData.designBImage,
          title: formData.designBTitle,
          description: formData.designBDescription,
          votes: 0,
          voters: [],
        },
        status: formData.status,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        createdBy: user.uid,
      });

      if (contestId) {
        toast.success("Design contest created!");
        setShowCreateModal(false);
        resetForm();
      } else {
        toast.error("Failed to create contest");
      }
    } catch (error) {
      toast.error("Error creating contest");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contest?")) return;
    
    const success = await deleteContest(id);
    if (success) {
      toast.success("Contest deleted");
    } else {
      toast.error("Failed to delete contest");
    }
  };

  const handleCloseContest = async (id: string) => {
    if (!confirm("Are you sure you want to close voting? This will declare a winner.")) return;
    
    const success = await closeContest(id);
    if (success) {
      toast.success("Contest closed and winner declared");
    } else {
      toast.error("Failed to close contest");
    }
  };

  const handleActivateContest = async (id: string) => {
    const success = await updateContest(id, { status: "active" });
    if (success) {
      toast.success("Contest is now active");
    } else {
      toast.error("Failed to activate contest");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      designATitle: "",
      designADescription: "",
      designAImage: "",
      designBTitle: "",
      designBDescription: "",
      designBImage: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "draft",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-light tracking-wide">Design Voting</h1>
                <p className="text-sm text-gray-500">Manage A/B design contests</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-6 py-2.5 text-xs tracking-wider hover:bg-gray-900 transition-colors"
            >
              CREATE CONTEST
            </button>
          </div>
        </div>
      </div>

      {/* Contest List */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-light mb-2">No Design Contests</h2>
            <p className="text-gray-500 text-sm mb-6">Create your first A/B design voting contest</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm tracking-wider underline underline-offset-4"
            >
              Create Contest
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {contests.map((contest) => {
              const stats = getContestStats(contest.id);
              return (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-100 p-6"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Design Previews */}
                    <div className="flex gap-4 lg:w-1/2">
                      <div className="flex-1">
                        <div className="aspect-square relative bg-gray-50 mb-2">
                          {contest.designA.imageUrl ? (
                            <Image
                              src={contest.designA.imageUrl}
                              alt={contest.designA.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          {contest.winner === "A" && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                              <Trophy className="w-4 h-4" weight="fill" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium">Design A</p>
                        <p className="text-xs text-gray-500">{contest.designA.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{contest.designA.votes} votes ({stats.percentA}%)</p>
                      </div>
                      <div className="flex-1">
                        <div className="aspect-square relative bg-gray-50 mb-2">
                          {contest.designB.imageUrl ? (
                            <Image
                              src={contest.designB.imageUrl}
                              alt={contest.designB.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          {contest.winner === "B" && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                              <Trophy className="w-4 h-4" weight="fill" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium">Design B</p>
                        <p className="text-xs text-gray-500">{contest.designB.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{contest.designB.votes} votes ({stats.percentB}%)</p>
                      </div>
                    </div>

                    {/* Contest Details */}
                    <div className="lg:w-1/2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{contest.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{contest.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(contest.status)}`}>
                          {contest.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Vote Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Design A: {stats.percentA}%</span>
                          <span>Design B: {stats.percentB}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-black transition-all duration-500"
                            style={{ width: `${stats.percentA}%` }}
                          />
                          <div
                            className="bg-gray-400 transition-all duration-500"
                            style={{ width: `${stats.percentB}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{stats.total} total votes</p>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(contest.startDate).toLocaleDateString()}</span>
                        </div>
                        <span>→</span>
                        <span>{new Date(contest.endDate).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {contest.status === "draft" && (
                          <button
                            onClick={() => handleActivateContest(contest.id)}
                            className="text-xs tracking-wider px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            ACTIVATE
                          </button>
                        )}
                        {contest.status === "active" && (
                          <button
                            onClick={() => handleCloseContest(contest.id)}
                            className="text-xs tracking-wider px-4 py-2 bg-gray-800 text-white hover:bg-black transition-colors"
                          >
                            CLOSE VOTING
                          </button>
                        )}
                        <Link
                          href="/vote"
                          className="text-xs tracking-wider px-4 py-2 border border-gray-200 hover:border-gray-400 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          PREVIEW
                        </Link>
                        <button
                          onClick={() => handleDeleteContest(contest.id)}
                          className="text-xs tracking-wider px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="text-lg font-light tracking-wide">Create Design Contest</h2>
                <p className="text-sm text-gray-500 mt-1">Set up an A/B design voting contest</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Contest Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium tracking-wider">CONTEST DETAILS</h3>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
                      placeholder="e.g., Summer Collection Logo Design"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black resize-none"
                      rows={3}
                      placeholder="Help us choose the next design..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "active" })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
                    >
                      <option value="draft">Draft (not visible to users)</option>
                      <option value="active">Active (open for voting)</option>
                    </select>
                  </div>
                </div>

                {/* Design A & B */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Design A */}
                  <div className="space-y-4 p-4 bg-gray-50">
                    <h3 className="text-sm font-medium tracking-wider">DESIGN A</h3>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.designATitle}
                        onChange={(e) => setFormData({ ...formData, designATitle: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
                        placeholder="Design name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <textarea
                        value={formData.designADescription}
                        onChange={(e) => setFormData({ ...formData, designADescription: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black resize-none bg-white"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Image URL *</label>
                      <input
                        type="url"
                        value={formData.designAImage}
                        onChange={(e) => setFormData({ ...formData, designAImage: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
                        placeholder="https://..."
                      />
                    </div>
                    {formData.designAImage && (
                      <div className="aspect-square relative bg-white border border-gray-200">
                        <Image
                          src={formData.designAImage}
                          alt="Design A Preview"
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Design B */}
                  <div className="space-y-4 p-4 bg-gray-50">
                    <h3 className="text-sm font-medium tracking-wider">DESIGN B</h3>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.designBTitle}
                        onChange={(e) => setFormData({ ...formData, designBTitle: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
                        placeholder="Design name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <textarea
                        value={formData.designBDescription}
                        onChange={(e) => setFormData({ ...formData, designBDescription: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black resize-none bg-white"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Image URL *</label>
                      <input
                        type="url"
                        value={formData.designBImage}
                        onChange={(e) => setFormData({ ...formData, designBImage: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
                        placeholder="https://..."
                      />
                    </div>
                    {formData.designBImage && (
                      <div className="aspect-square relative bg-white border border-gray-200">
                        <Image
                          src={formData.designBImage}
                          alt="Design B Preview"
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end gap-4 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 text-xs tracking-wider border border-gray-200 hover:border-gray-400 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateContest}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs tracking-wider bg-black text-white hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "CREATING..." : "CREATE CONTEST"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
