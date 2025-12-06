"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, modalOverlay, modalContent } from "@/lib/motion";
import { 
  Envelope, 
  Users, 
  TrendUp, 
  Export, 
  MagnifyingGlass,
  Trash,
  Tag,
  Calendar,
  Check,
  X,
  Funnel,
  CaretDown,
  PaperPlaneTilt,
  Clock,
  Eye,
  Cursor,
  SpinnerGap,
  Plus,
  Warning
} from "@phosphor-icons/react";
import { useNewsletter, NewsletterSubscriber } from "@/context/NewsletterContext";
import { useToast } from "@/context/ToastContext";

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  homepage: { label: "Homepage", color: "bg-blue-100 text-blue-700" },
  events: { label: "Events", color: "bg-purple-100 text-purple-700" },
  checkout: { label: "Checkout", color: "bg-green-100 text-green-700" },
  popup: { label: "Pop-up", color: "bg-orange-100 text-orange-700" },
  other: { label: "Other", color: "bg-gray-100 text-gray-700" },
};

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  unsubscribed: { label: "Unsubscribed", color: "bg-red-100 text-red-700" },
  bounced: { label: "Bounced", color: "bg-yellow-100 text-yellow-700" },
};

export default function AdminNewsletterPage() {
  const { 
    subscribers, 
    campaigns,
    loading, 
    getStats, 
    deleteSubscriber, 
    updateSubscriber,
    exportSubscribers,
    loadAllSubscribers,
  } = useNewsletter();
  const toast = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | NewsletterSubscriber["source"]>("all");
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const stats = getStats();

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      if (searchQuery && !sub.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && sub.status !== statusFilter) {
        return false;
      }
      if (sourceFilter !== "all" && sub.source !== sourceFilter) {
        return false;
      }
      return true;
    });
  }, [subscribers, searchQuery, statusFilter, sourceFilter]);

  const handleExport = () => {
    const csv = exportSubscribers();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cipher_subscribers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${stats.active} subscribers`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    const success = await deleteSubscriber(id);
    if (success) {
      toast.success("Subscriber deleted");
    } else {
      toast.error("Failed to delete subscriber");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedSubscribers.length} subscribers?`)) return;
    
    for (const id of selectedSubscribers) {
      await deleteSubscriber(id);
    }
    setSelectedSubscribers([]);
    toast.success(`Deleted ${selectedSubscribers.length} subscribers`);
  };

  const handleAddTag = async (subscriberId: string) => {
    if (!newTag.trim()) return;
    
    const subscriber = subscribers.find(s => s.id === subscriberId);
    if (!subscriber) return;

    const updatedTags = [...new Set([...subscriber.tags, newTag.trim().toLowerCase()])];
    await updateSubscriber(subscriberId, { tags: updatedTags });
    setNewTag("");
    setShowTagModal(null);
    toast.success("Tag added");
  };

  const handleRemoveTag = async (subscriberId: string, tag: string) => {
    const subscriber = subscribers.find(s => s.id === subscriberId);
    if (!subscriber) return;

    const updatedTags = subscriber.tags.filter(t => t !== tag);
    await updateSubscriber(subscriberId, { tags: updatedTags });
  };

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedSubscribers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Newsletter</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your email subscribers
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm tracking-wider hover:bg-gray-50 transition"
          >
            <Export className="w-4 h-4" />
            EXPORT CSV
          </button>
          <button
            onClick={() => loadAllSubscribers()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm tracking-wider hover:bg-gray-900 transition disabled:opacity-50"
          >
            {loading ? (
              <SpinnerGap className="w-4 h-4 animate-spin" />
            ) : (
              <Envelope className="w-4 h-4" />
            )}
            REFRESH
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 flex items-center justify-center rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500 tracking-wider">TOTAL</span>
          </div>
          <p className="text-3xl font-light">{stats.total.toLocaleString()}</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 flex items-center justify-center rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500 tracking-wider">ACTIVE</span>
          </div>
          <p className="text-3xl font-light">{stats.active.toLocaleString()}</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 flex items-center justify-center rounded-lg">
              <TrendUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500 tracking-wider">THIS MONTH</span>
          </div>
          <p className="text-3xl font-light">{stats.thisMonth.toLocaleString()}</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 flex items-center justify-center rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs text-gray-500 tracking-wider">UNSUBSCRIBED</span>
          </div>
          <p className="text-3xl font-light">{stats.unsubscribed.toLocaleString()}</p>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h3 className="text-sm font-medium mb-4">Subscribers by Source</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.bySource).map(([source, count]) => {
            const config = SOURCE_LABELS[source] || SOURCE_LABELS.other;
            return (
              <div 
                key={source}
                className={`px-4 py-2 ${config.color} text-sm font-medium`}
              >
                {config.label}: {count}
              </div>
            );
          })}
          {Object.keys(stats.bySource).length === 0 && (
            <p className="text-gray-500 text-sm">No subscribers yet</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:border-black outline-none transition"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-200 focus:border-black outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
            className="px-4 py-2 border border-gray-200 focus:border-black outline-none bg-white"
          >
            <option value="all">All Sources</option>
            <option value="homepage">Homepage</option>
            <option value="events">Events</option>
            <option value="checkout">Checkout</option>
            <option value="popup">Pop-up</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSubscribers.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 p-4 mb-4 flex items-center justify-between">
          <span className="text-sm">{selectedSubscribers.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 text-white text-sm hover:bg-red-600 transition flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedSubscribers([])}
              className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-100 transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-black"
                  />
                </th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">EMAIL</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">STATUS</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">SOURCE</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">TAGS</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">SUBSCRIBED</th>
                <th className="text-right text-xs tracking-wider text-gray-500 font-medium px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubscribers.map((subscriber) => {
                const sourceConfig = SOURCE_LABELS[subscriber.source] || SOURCE_LABELS.other;
                const statusConfig = STATUS_CONFIG[subscriber.status];
                
                return (
                  <tr key={subscriber.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSubscribers.includes(subscriber.id)}
                        onChange={() => toggleSelect(subscriber.id)}
                        className="w-4 h-4 accent-black"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{subscriber.email}</p>
                        {subscriber.firstName && (
                          <p className="text-xs text-gray-500">{subscriber.firstName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${sourceConfig.color}`}>
                        {sourceConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {subscriber.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-xs group"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(subscriber.id, tag)}
                              className="opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => setShowTagModal(subscriber.id)}
                          className="p-1 hover:bg-gray-100 rounded transition"
                          title="Add tag"
                        >
                          <Plus className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(subscriber.subscribedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(subscriber.id)}
                          className="p-2 hover:bg-red-50 text-red-500 transition rounded"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubscribers.length === 0 && (
          <div className="text-center py-12">
            <Envelope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {subscribers.length === 0 
                ? "No subscribers yet" 
                : "No subscribers match your filters"
              }
            </p>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredSubscribers.length} of {subscribers.length} subscribers
      </div>

      {/* Add Tag Modal */}
      <AnimatePresence>
        {showTagModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTagModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium mb-4">Add Tag</h3>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag name"
                className="w-full px-4 py-2 border border-gray-200 focus:border-black outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTagModal(null)}
                  className="flex-1 py-2 border border-gray-200 text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddTag(showTagModal)}
                  disabled={!newTag.trim()}
                  className="flex-1 py-2 bg-black text-white text-sm hover:bg-gray-900 transition disabled:opacity-50"
                >
                  Add Tag
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
