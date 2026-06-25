import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/lib/navigation";
import AdminLayout from "@/components/admin-layout/AdminLayout";
import { SpinnerGap, ShieldWarning } from "@phosphor-icons/react";
import { motion, AnimatePresence, modalOverlay, modalContent } from "@/lib/motion";
import Image from "@/components/NextImage";
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  PencilSimple, 
  Trash,
  Eye,
  Check,
  X,
  Lightning,
  Star,
  Crown,
  Export,
  CaretDown,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { useLocalScene, CipherEvent, EventType, LoyaltyTier } from "@/context/LocalSceneContext";
import { useToast } from "@/context/ToastContext";
import ImageUploader from "@/components/ImageUploader";

const EVENT_TYPE_CONFIG = {
  popup: { label: "Pop-Up", color: "bg-purple-500", icon: Lightning },
  meetup: { label: "Meetup", color: "bg-blue-500", icon: Users },
  launch: { label: "Launch", color: "bg-orange-500", icon: Star },
  workshop: { label: "Workshop", color: "bg-green-500", icon: Crown },
};

const STATUS_COLORS = {
  upcoming: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  ended: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

const EMPTY_EVENT: Omit<CipherEvent, "id" | "createdAt" | "rsvpCount"> = {
  title: "",
  description: "",
  type: "popup",
  imageUrl: "",
  location: {
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    coordinates: { lat: 0, lng: 0 }
  },
  startDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
  endDate: Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
  timezone: "America/New_York",
  capacity: 100,
  waitlistEnabled: true,
  isExclusive: false,
  exclusiveProductIds: [],
  featuredProductIds: [],
  status: "upcoming",
  featured: false,
  createdBy: "admin"
};

function AdminEventsPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { push } = useRouter();
  const { events, createEvent, updateEvent, deleteEvent, getEventRSVPs } = useLocalScene();
  const toast = useToast();
  const isAdmin = userRole?.isAdmin ?? false;

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CipherEvent | null>(null);
  const [formData, setFormData] = useState<Omit<CipherEvent, "id" | "createdAt" | "rsvpCount">>(EMPTY_EVENT);
  const [viewingRSVPs, setViewingRSVPs] = useState<string | null>(null);
  const [rsvpList, setRsvpList] = useState<Awaited<ReturnType<typeof getEventRSVPs>>>([]);
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) push("/login");
  }, [user, authLoading, push]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Events" activeTab="events">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldWarning className="size-12 text-amber-500 mb-4" />
          <p className="text-gray-600">Admin access required</p>
        </div>
      </AdminLayout>
    );
  }

  const filteredEvents = events
    .filter(e => filter === "all" || e.type === filter)
    .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.startDate - a.startDate);

  const handleEdit = (event: CipherEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      type: event.type,
      imageUrl: event.imageUrl,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: event.timezone,
      capacity: event.capacity,
      waitlistEnabled: event.waitlistEnabled,
      isExclusive: event.isExclusive,
      requiredTier: event.requiredTier,
      exclusiveProductIds: event.exclusiveProductIds,
      featuredProductIds: event.featuredProductIds,
      status: event.status,
      featured: event.featured,
      createdBy: event.createdBy
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setFormData(EMPTY_EVENT);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
        toast.success("Event updated successfully");
      } else {
        await createEvent(formData);
        toast.success("Event created successfully");
      }
      setShowForm(false);
      setEditingEvent(null);
      setFormData(EMPTY_EVENT);
    } catch {
      toast.error("Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    await deleteEvent(eventId);
    toast.success("Event deleted");
  };

  const handleViewRSVPs = async (eventId: string) => {
    const rsvps = await getEventRSVPs(eventId);
    setRsvpList(rsvps);
    setViewingRSVPs(eventId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <AdminLayout
      title="Events"
      activeTab="events"
      actions={
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs tracking-wider hover:bg-gray-100 transition"
        >
          <Plus className="size-4" />
          CREATE EVENT
        </button>
      }
    >
      <p className="text-gray-500 text-sm mb-6">{events.length} total events</p>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input aria-label="Search events..."
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:border-black outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm tracking-wider transition ${filter === "all" ? "bg-gray-950 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            All
          </button>
          {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => {
            const config = EVENT_TYPE_CONFIG[type];
            return (
              <button type="button" key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 text-sm tracking-wider transition ${filter === type ? "bg-gray-950 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">EVENT</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">TYPE</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">DATE</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">LOCATION</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">RSVPs</th>
                <th className="text-left text-xs tracking-wider text-gray-500 font-medium px-6 py-4">STATUS</th>
                <th className="text-right text-xs tracking-wider text-gray-500 font-medium px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.map((event) => {
                const typeConfig = EVENT_TYPE_CONFIG[event.type];
                const TypeIcon = typeConfig.icon;
                const capacityPercent = (event.rsvpCount / event.capacity) * 100;
                
                return (
                  <tr key={event.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-12 flex-shrink-0 bg-gray-100">
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover"
                           sizes="(max-width: 768px) 100vw, 50vw" />
                          {event.featured && (
                            <div className="absolute -top-1 -right-1 size-4 bg-yellow-400 flex items-center justify-center">
                              <Star weight="fill" className="size-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          {event.isExclusive && event.requiredTier && (
                            <span className="text-xs text-purple-600">{event.requiredTier} exclusive</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs text-white ${typeConfig.color}`}>
                        <TypeIcon weight="bold" className="size-3" />
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{formatDate(event.startDate)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{event.location.city}, {event.location.state}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-gray-400" />
                        <span className="text-sm">{event.rsvpCount}/{event.capacity}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(100, capacityPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${STATUS_COLORS[event.status]}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => handleViewRSVPs(event.id)}
                          className="p-2 hover:bg-gray-100 transition rounded"
                          title="View RSVPs"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button type="button" onClick={() => handleEdit(event)}
                          className="p-2 hover:bg-gray-100 transition rounded"
                          title="Edit"
                        >
                          <PencilSimple className="size-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(event.id)}
                          className="p-2 hover:bg-red-50 text-red-500 transition rounded"
                          title="Delete"
                        >
                          <Trash className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No events found</p>
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/50 z-50 flex items-center justify-center p-4"
            role="presentation"
          ><button type="button" aria-label="Close" className="absolute inset-0 w-full h-full cursor-default" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-medium">
                  {editingEvent ? "Edit Event" : "Create Event"}
                </h2>
                <button aria-label="x" type="button" onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 transition rounded"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="page-event-title-26" className="block text-xs tracking-wider text-gray-500 mb-2">EVENT TITLE</label>
                    <input aria-label="EVENT TITLE" id="page-event-title-26"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="page-description-27" className="block text-xs tracking-wider text-gray-500 mb-2">DESCRIPTION</label>
                    <textarea aria-label="DESCRIPTION" id="page-description-27"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="page-type-28" className="block text-xs tracking-wider text-gray-500 mb-2">TYPE</label>
                      <select aria-label="TYPE" id="page-type-28"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
                      >
                        <option value="popup">Pop-Up Shop</option>
                        <option value="meetup">Community Meetup</option>
                        <option value="launch">Launch Event</option>
                        <option value="workshop">Workshop</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="page-status-29" className="block text-xs tracking-wider text-gray-500 mb-2">STATUS</label>
                      <select aria-label="STATUS" id="page-status-29"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as CipherEvent["status"] })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="ended">Ended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <ImageUploader
                      value={formData.imageUrl}
                      onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                      folder="events"
                      aspectRatio="video"
                      label="Event image"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Location</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="page-venue-name-30" className="block text-xs tracking-wider text-gray-500 mb-2">VENUE NAME</label>
                      <input aria-label="VENUE NAME" id="page-venue-name-30"
                        type="text"
                        value={formData.location.name}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          location: { ...formData.location, name: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="page-address-31" className="block text-xs tracking-wider text-gray-500 mb-2">ADDRESS</label>
                      <input aria-label="ADDRESS" id="page-address-31"
                        type="text"
                        value={formData.location.address}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          location: { ...formData.location, address: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="page-city-32" className="block text-xs tracking-wider text-gray-500 mb-2">CITY</label>
                      <input aria-label="CITY" id="page-city-32"
                        type="text"
                        value={formData.location.city}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          location: { ...formData.location, city: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="page-state-33" className="block text-xs tracking-wider text-gray-500 mb-2">STATE</label>
                      <input aria-label="STATE" id="page-state-33"
                        type="text"
                        value={formData.location.state}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          location: { ...formData.location, state: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="page-zip-34" className="block text-xs tracking-wider text-gray-500 mb-2">ZIP</label>
                      <input aria-label="ZIP" id="page-zip-34"
                        type="text"
                        value={formData.location.zip}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          location: { ...formData.location, zip: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Date & Time</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="page-start-35" className="block text-xs tracking-wider text-gray-500 mb-2">START</label>
                      <input aria-label="START" id="page-start-35"
                        type="datetime-local"
                        value={new Date(formData.startDate).toISOString().slice(0, 16)}
                        onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value).getTime() })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="page-end-36" className="block text-xs tracking-wider text-gray-500 mb-2">END</label>
                      <input aria-label="END" id="page-end-36"
                        type="datetime-local"
                        value={new Date(formData.endDate).toISOString().slice(0, 16)}
                        onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value).getTime() })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Capacity & Access */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Capacity & Access</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="page-capacity-37" className="block text-xs tracking-wider text-gray-500 mb-2">CAPACITY</label>
                      <input aria-label="CAPACITY" id="page-capacity-37"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        min={1}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                        required
                      />
                    </div>
                    <div className="flex items-end gap-4 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input id="page-field-38"
                          aria-label="Enable waitlist"
                          type="checkbox"
                          checked={formData.waitlistEnabled}
                          onChange={(e) => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                          className="size-4 accent-black"
                        />
                        <span className="text-sm">Enable waitlist</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input id="page-field-39"
                          aria-label="Featured event"
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          className="size-4 accent-black"
                        />
                        <span className="text-sm">Featured</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input id="page-field-40"
                        aria-label="Exclusive event (tier-gated)"
                        type="checkbox"
                        checked={formData.isExclusive}
                        onChange={(e) => setFormData({ ...formData, isExclusive: e.target.checked })}
                        className="size-4 accent-black"
                      />
                      <span className="text-sm">Exclusive event (tier-gated)</span>
                    </label>
                  </div>

                  {formData.isExclusive && (
                    <div>
                      <label htmlFor="page-minimum-tier-41" className="block text-xs tracking-wider text-gray-500 mb-2">MINIMUM TIER</label>
                      <select aria-label="MINIMUM TIER" id="page-minimum-tier-41"
                        value={formData.requiredTier || "bronze"}
                        onChange={(e) => setFormData({ ...formData, requiredTier: e.target.value as LoyaltyTier })}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
                      >
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="platinum">Platinum</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 border border-gray-200 text-sm tracking-wider hover:bg-gray-50 transition"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gray-950 text-white text-sm tracking-wider hover:bg-gray-900 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "SAVING..." : editingEvent ? "UPDATE EVENT" : "CREATE EVENT"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RSVP List Modal */}
      <AnimatePresence>
        {viewingRSVPs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/50 z-50 flex items-center justify-center p-4"
            role="presentation"
          ><button type="button" aria-label="Close" className="absolute inset-0 w-full h-full cursor-default" onClick={() => setViewingRSVPs(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium">RSVPs</h2>
                  <p className="text-sm text-gray-500">{rsvpList.length} attendees</p>
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label="export" type="button" className="p-2 hover:bg-gray-100 transition rounded"
                    title="Export">
                    <Export className="size-5" />
                  </button>
                  <button aria-label="x" type="button" onClick={() => setViewingRSVPs(null)}
                    className="p-2 hover:bg-gray-100 transition rounded"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {rsvpList.length > 0 ? (
                  <div className="space-y-3">
                    {rsvpList.map((rsvp) => (
                      <div key={rsvp.id} className="flex items-center justify-between p-3 bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">{rsvp.userName}</p>
                          <p className="text-xs text-gray-500">{rsvp.userEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            rsvp.status === "confirmed" ? "bg-green-100 text-green-700" :
                            rsvp.status === "waitlist" ? "bg-yellow-100 text-yellow-700" :
                            rsvp.status === "checked-in" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {rsvp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="size-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No RSVPs yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

function AdminEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <SpinnerGap className="size-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <AdminEventsPageContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/events")({ component: AdminEventsPage });
