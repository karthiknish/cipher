"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useLoyalty } from "./LoyaltyContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  increment,
  serverTimestamp,
  Timestamp,
  getDocs
} from "firebase/firestore";

// Types
export type EventType = "popup" | "meetup" | "launch" | "workshop";
export type EventStatus = "upcoming" | "active" | "ended" | "cancelled";
export type StoreType = "flagship" | "popup" | "partner";
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface EventLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coordinates: { lat: number; lng: number };
}

export interface CipherEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  imageUrl: string;
  location: EventLocation;
  startDate: number;
  endDate: number;
  timezone: string;
  capacity: number;
  rsvpCount: number;
  waitlistEnabled: boolean;
  isExclusive: boolean;
  requiredTier?: LoyaltyTier;
  exclusiveProductIds: string[];
  featuredProductIds: string[];
  status: EventStatus;
  featured: boolean;
  createdAt: number;
  createdBy: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  type: StoreType;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coordinates: { lat: number; lng: number };
  hours: {
    [day: string]: { open: string; close: string } | "closed";
  };
  hasPickup: boolean;
  exclusiveProductIds: string[];
  phone: string;
  email: string;
  isActive: boolean;
  imageUrl?: string;
}

export interface EventRSVP {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: "confirmed" | "waitlist" | "cancelled" | "checked-in";
  createdAt: number;
  checkedInAt?: number;
}

export interface UserLocationPrefs {
  enabled: boolean;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  notifyRadius: number; // in miles
}

interface LocalSceneContextType {
  events: CipherEvent[];
  stores: StoreLocation[];
  userRSVPs: EventRSVP[];
  userLocation: UserLocationPrefs | null;
  loading: boolean;
  
  // Event functions
  getEventById: (id: string) => CipherEvent | undefined;
  getUpcomingEvents: () => CipherEvent[];
  getFeaturedEvent: () => CipherEvent | null;
  getEventsByType: (type: EventType) => CipherEvent[];
  getNearbyEvents: (radiusMiles: number) => CipherEvent[];
  
  // RSVP functions
  rsvpToEvent: (eventId: string) => Promise<boolean>;
  cancelRSVP: (eventId: string) => Promise<boolean>;
  getUserRSVP: (eventId: string) => EventRSVP | undefined;
  hasUserRSVPd: (eventId: string) => boolean;
  checkEligibility: (eventId: string) => { eligible: boolean; reason?: string };
  
  // Store functions
  getStoreById: (id: string) => StoreLocation | undefined;
  getNearbyStores: (radiusMiles: number) => StoreLocation[];
  getPickupStores: () => StoreLocation[];
  getExclusiveItems: (storeId: string) => string[];
  
  // Location functions
  updateUserLocation: (prefs: Partial<UserLocationPrefs>) => void;
  requestLocationPermission: () => Promise<boolean>;
  
  // Admin functions
  createEvent: (event: Omit<CipherEvent, "id" | "createdAt" | "rsvpCount">) => Promise<string | null>;
  updateEvent: (id: string, updates: Partial<CipherEvent>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  createStore: (store: Omit<StoreLocation, "id">) => Promise<string | null>;
  updateStore: (id: string, updates: Partial<StoreLocation>) => Promise<boolean>;
  checkInUser: (eventId: string, userId: string) => Promise<boolean>;
  getEventRSVPs: (eventId: string) => Promise<EventRSVP[]>;
}

const LocalSceneContext = createContext<LocalSceneContextType | undefined>(undefined);

// Sample events data
const SAMPLE_EVENTS: CipherEvent[] = [
  {
    id: "event-1",
    title: "CIPHER Winter Pop-Up",
    description: "Exclusive winter collection preview with limited drops, DJ sets, and complimentary refreshments. Be the first to shop our coldest fits yet.",
    type: "popup",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    location: {
      name: "The Warehouse LA",
      address: "123 Arts District Blvd",
      city: "Los Angeles",
      state: "California",
      zip: "90013",
      country: "United States",
      coordinates: { lat: 34.0407, lng: -118.2356 }
    },
    startDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    endDate: Date.now() + 9 * 24 * 60 * 60 * 1000,
    timezone: "America/Los_Angeles",
    capacity: 200,
    rsvpCount: 156,
    waitlistEnabled: true,
    isExclusive: false,
    exclusiveProductIds: ["1", "3", "5"],
    featuredProductIds: ["1", "2", "3", "4"],
    status: "upcoming",
    featured: true,
    createdAt: Date.now(),
    createdBy: "admin"
  },
  {
    id: "event-2",
    title: "Platinum Members Night",
    description: "An intimate evening exclusively for our Platinum members. Private shopping, personal stylists, and a first look at upcoming collaborations.",
    type: "meetup",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
    location: {
      name: "CIPHER Flagship",
      address: "456 SoHo Street",
      city: "New York",
      state: "New York",
      zip: "10012",
      country: "United States",
      coordinates: { lat: 40.7234, lng: -73.9985 }
    },
    startDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
    timezone: "America/New_York",
    capacity: 50,
    rsvpCount: 32,
    waitlistEnabled: false,
    isExclusive: true,
    requiredTier: "platinum",
    exclusiveProductIds: ["2", "4", "6"],
    featuredProductIds: ["2", "4"],
    status: "upcoming",
    featured: true,
    createdAt: Date.now(),
    createdBy: "admin"
  },
  {
    id: "event-3",
    title: "Street Style Workshop",
    description: "Learn layering techniques and styling tips from CIPHER's creative director. Includes exclusive merchandise and photo opportunities.",
    type: "workshop",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    location: {
      name: "CIPHER Studio",
      address: "789 Creative Ave",
      city: "Brooklyn",
      state: "New York",
      zip: "11211",
      country: "United States",
      coordinates: { lat: 40.7128, lng: -73.9530 }
    },
    startDate: Date.now() + 21 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
    timezone: "America/New_York",
    capacity: 30,
    rsvpCount: 28,
    waitlistEnabled: true,
    isExclusive: true,
    requiredTier: "silver",
    exclusiveProductIds: [],
    featuredProductIds: ["1", "5", "6"],
    status: "upcoming",
    featured: false,
    createdAt: Date.now(),
    createdBy: "admin"
  },
  {
    id: "event-4",
    title: "Spring '25 Launch Party",
    description: "The official launch of our Spring 2025 collection. Live performances, street food vendors, and exclusive early access to the new line.",
    type: "launch",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    location: {
      name: "Pier 17 Rooftop",
      address: "89 South Street",
      city: "New York",
      state: "New York",
      zip: "10038",
      country: "United States",
      coordinates: { lat: 40.7063, lng: -74.0031 }
    },
    startDate: Date.now() + 45 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 45 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000,
    timezone: "America/New_York",
    capacity: 500,
    rsvpCount: 234,
    waitlistEnabled: true,
    isExclusive: false,
    exclusiveProductIds: [],
    featuredProductIds: [],
    status: "upcoming",
    featured: false,
    createdAt: Date.now(),
    createdBy: "admin"
  },
  {
    id: "event-5",
    title: "Gold & Platinum Sneaker Preview",
    description: "Exclusive first look at our upcoming sneaker collaboration. Limited to Gold and Platinum members only.",
    type: "meetup",
    imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800",
    location: {
      name: "CIPHER Flagship",
      address: "456 SoHo Street",
      city: "New York",
      state: "New York",
      zip: "10012",
      country: "United States",
      coordinates: { lat: 40.7234, lng: -73.9985 }
    },
    startDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
    timezone: "America/New_York",
    capacity: 75,
    rsvpCount: 48,
    waitlistEnabled: true,
    isExclusive: true,
    requiredTier: "gold",
    exclusiveProductIds: ["7", "8"],
    featuredProductIds: ["7", "8"],
    status: "upcoming",
    featured: false,
    createdAt: Date.now(),
    createdBy: "admin"
  }
];

// Sample stores data
const SAMPLE_STORES: StoreLocation[] = [
  {
    id: "store-1",
    name: "CIPHER Flagship NYC",
    type: "flagship",
    address: "456 SoHo Street",
    city: "New York",
    state: "New York",
    zip: "10012",
    country: "United States",
    coordinates: { lat: 40.7234, lng: -73.9985 },
    hours: {
      monday: { open: "10:00", close: "20:00" },
      tuesday: { open: "10:00", close: "20:00" },
      wednesday: { open: "10:00", close: "20:00" },
      thursday: { open: "10:00", close: "21:00" },
      friday: { open: "10:00", close: "21:00" },
      saturday: { open: "10:00", close: "21:00" },
      sunday: { open: "11:00", close: "19:00" }
    },
    hasPickup: true,
    exclusiveProductIds: ["2", "4", "6"],
    phone: "+1 (212) 555-0123",
    email: "nyc@cipher.com",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"
  },
  {
    id: "store-2",
    name: "CIPHER LA",
    type: "flagship",
    address: "123 Arts District Blvd",
    city: "Los Angeles",
    state: "California",
    zip: "90013",
    country: "United States",
    coordinates: { lat: 34.0407, lng: -118.2356 },
    hours: {
      monday: { open: "10:00", close: "20:00" },
      tuesday: { open: "10:00", close: "20:00" },
      wednesday: { open: "10:00", close: "20:00" },
      thursday: { open: "10:00", close: "21:00" },
      friday: { open: "10:00", close: "21:00" },
      saturday: { open: "10:00", close: "21:00" },
      sunday: { open: "11:00", close: "19:00" }
    },
    hasPickup: true,
    exclusiveProductIds: ["1", "3", "5"],
    phone: "+1 (213) 555-0456",
    email: "la@cipher.com",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800"
  },
  {
    id: "store-3",
    name: "CIPHER Pop-Up Chicago",
    type: "popup",
    address: "789 Magnificent Mile",
    city: "Chicago",
    state: "Illinois",
    zip: "60611",
    country: "United States",
    coordinates: { lat: 41.8941, lng: -87.6245 },
    hours: {
      monday: { open: "11:00", close: "19:00" },
      tuesday: { open: "11:00", close: "19:00" },
      wednesday: { open: "11:00", close: "19:00" },
      thursday: { open: "11:00", close: "20:00" },
      friday: { open: "11:00", close: "20:00" },
      saturday: { open: "10:00", close: "20:00" },
      sunday: { open: "12:00", close: "18:00" }
    },
    hasPickup: true,
    exclusiveProductIds: [],
    phone: "+1 (312) 555-0789",
    email: "chicago@cipher.com",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800"
  },
  {
    id: "store-4",
    name: "Streetwear Central",
    type: "partner",
    address: "321 Urban Street",
    city: "Miami",
    state: "Florida",
    zip: "33130",
    country: "United States",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    hours: {
      monday: { open: "10:00", close: "19:00" },
      tuesday: { open: "10:00", close: "19:00" },
      wednesday: { open: "10:00", close: "19:00" },
      thursday: { open: "10:00", close: "19:00" },
      friday: { open: "10:00", close: "20:00" },
      saturday: { open: "10:00", close: "20:00" },
      sunday: "closed"
    },
    hasPickup: true,
    exclusiveProductIds: [],
    phone: "+1 (305) 555-0321",
    email: "partner-miami@cipher.com",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800"
  }
];

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<LoyaltyTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4
};

export function LocalSceneProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile: loyaltyProfile } = useLoyalty();
  
  const [events, setEvents] = useState<CipherEvent[]>(SAMPLE_EVENTS);
  const [stores, setStores] = useState<StoreLocation[]>(SAMPLE_STORES);
  const [userRSVPs, setUserRSVPs] = useState<EventRSVP[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocationPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user location preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cipher_user_location");
    if (stored) {
      setUserLocation(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  // Load user RSVPs from Firebase
  useEffect(() => {
    if (!user) {
      setUserRSVPs([]);
      return;
    }

    const loadRSVPs = async () => {
      try {
        const rsvpsRef = collection(db, "eventRSVPs");
        const q = query(rsvpsRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const rsvps: EventRSVP[] = [];
        snapshot.forEach((doc) => {
          rsvps.push({ id: doc.id, ...doc.data() } as EventRSVP);
        });
        setUserRSVPs(rsvps);
      } catch (error) {
        console.error("Error loading RSVPs:", error);
        // Load from localStorage as fallback
        const stored = localStorage.getItem(`cipher_rsvps_${user.uid}`);
        if (stored) {
          setUserRSVPs(JSON.parse(stored));
        }
      }
    };

    loadRSVPs();
  }, [user]);

  // Event functions
  const getEventById = useCallback((id: string) => {
    return events.find(e => e.id === id);
  }, [events]);

  const getUpcomingEvents = useCallback(() => {
    return events
      .filter(e => e.status === "upcoming" || e.status === "active")
      .sort((a, b) => a.startDate - b.startDate);
  }, [events]);

  const getFeaturedEvent = useCallback(() => {
    const featured = events.find(e => e.featured && (e.status === "upcoming" || e.status === "active"));
    if (featured) return featured;
    // Return the next upcoming event if no featured
    const upcoming = getUpcomingEvents();
    return upcoming[0] || null;
  }, [events, getUpcomingEvents]);

  const getEventsByType = useCallback((type: EventType) => {
    return events.filter(e => e.type === type && (e.status === "upcoming" || e.status === "active"));
  }, [events]);

  const getNearbyEvents = useCallback((radiusMiles: number) => {
    if (!userLocation?.coordinates) return [];
    
    return events.filter(e => {
      const distance = calculateDistance(
        userLocation.coordinates!.lat,
        userLocation.coordinates!.lng,
        e.location.coordinates.lat,
        e.location.coordinates.lng
      );
      return distance <= radiusMiles && (e.status === "upcoming" || e.status === "active");
    });
  }, [events, userLocation]);

  // RSVP functions
  const rsvpToEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user) return false;
    
    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    // Check eligibility
    const eligibility = checkEligibility(eventId);
    if (!eligibility.eligible) return false;

    const isWaitlist = event.rsvpCount >= event.capacity;
    
    const rsvp: EventRSVP = {
      id: `rsvp-${Date.now()}`,
      eventId,
      userId: user.uid,
      userEmail: user.email || "",
      userName: user.displayName || "Guest",
      status: isWaitlist ? "waitlist" : "confirmed",
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, "eventRSVPs", rsvp.id), rsvp);
      await updateDoc(doc(db, "events", eventId), {
        rsvpCount: increment(1)
      });
    } catch (error) {
      console.error("Error saving RSVP to Firebase:", error);
      // Save locally as fallback
      const stored = localStorage.getItem(`cipher_rsvps_${user.uid}`);
      const localRSVPs = stored ? JSON.parse(stored) : [];
      localRSVPs.push(rsvp);
      localStorage.setItem(`cipher_rsvps_${user.uid}`, JSON.stringify(localRSVPs));
    }

    setUserRSVPs(prev => [...prev, rsvp]);
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, rsvpCount: e.rsvpCount + 1 } : e
    ));
    
    return true;
  }, [user, events]);

  const cancelRSVP = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user) return false;
    
    const rsvp = userRSVPs.find(r => r.eventId === eventId && r.userId === user.uid);
    if (!rsvp) return false;

    try {
      await deleteDoc(doc(db, "eventRSVPs", rsvp.id));
      await updateDoc(doc(db, "events", eventId), {
        rsvpCount: increment(-1)
      });
    } catch (error) {
      console.error("Error cancelling RSVP:", error);
      // Update locally
      const stored = localStorage.getItem(`cipher_rsvps_${user.uid}`);
      if (stored) {
        const localRSVPs = JSON.parse(stored).filter((r: EventRSVP) => r.id !== rsvp.id);
        localStorage.setItem(`cipher_rsvps_${user.uid}`, JSON.stringify(localRSVPs));
      }
    }

    setUserRSVPs(prev => prev.filter(r => r.id !== rsvp.id));
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, rsvpCount: Math.max(0, e.rsvpCount - 1) } : e
    ));
    
    return true;
  }, [user, userRSVPs]);

  const getUserRSVP = useCallback((eventId: string) => {
    if (!user) return undefined;
    return userRSVPs.find(r => r.eventId === eventId && r.userId === user.uid);
  }, [user, userRSVPs]);

  const hasUserRSVPd = useCallback((eventId: string) => {
    return !!getUserRSVP(eventId);
  }, [getUserRSVP]);

  const checkEligibility = useCallback((eventId: string): { eligible: boolean; reason?: string } => {
    const event = events.find(e => e.id === eventId);
    if (!event) return { eligible: false, reason: "Event not found" };
    
    if (!event.isExclusive) return { eligible: true };
    
    if (!user) return { eligible: false, reason: "Please sign in to RSVP" };
    
    if (!event.requiredTier) return { eligible: true };
    
    const userTier = loyaltyProfile?.currentTier || "bronze";
    const requiredLevel = TIER_HIERARCHY[event.requiredTier];
    const userLevel = TIER_HIERARCHY[userTier];
    
    if (userLevel >= requiredLevel) return { eligible: true };
    
    return { 
      eligible: false, 
      reason: `Requires ${event.requiredTier.charAt(0).toUpperCase() + event.requiredTier.slice(1)} tier or higher` 
    };
  }, [events, user, loyaltyProfile]);

  // Store functions
  const getStoreById = useCallback((id: string) => {
    return stores.find(s => s.id === id);
  }, [stores]);

  const getNearbyStores = useCallback((radiusMiles: number) => {
    if (!userLocation?.coordinates) return stores;
    
    return stores
      .filter(s => s.isActive)
      .map(store => ({
        ...store,
        distance: calculateDistance(
          userLocation.coordinates!.lat,
          userLocation.coordinates!.lng,
          store.coordinates.lat,
          store.coordinates.lng
        )
      }))
      .filter(s => s.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);
  }, [stores, userLocation]);

  const getPickupStores = useCallback(() => {
    return stores.filter(s => s.hasPickup && s.isActive);
  }, [stores]);

  const getExclusiveItems = useCallback((storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.exclusiveProductIds || [];
  }, [stores]);

  // Location functions
  const updateUserLocation = useCallback((prefs: Partial<UserLocationPrefs>) => {
    setUserLocation(prev => {
      const updated = { ...prev, ...prefs } as UserLocationPrefs;
      localStorage.setItem("cipher_user_location", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation({
            enabled: true,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            notifyRadius: 50
          });
          resolve(true);
        },
        () => {
          resolve(false);
        }
      );
    });
  }, [updateUserLocation]);

  // Admin functions
  const createEvent = useCallback(async (eventData: Omit<CipherEvent, "id" | "createdAt" | "rsvpCount">): Promise<string | null> => {
    const id = `event-${Date.now()}`;
    const newEvent: CipherEvent = {
      ...eventData,
      id,
      createdAt: Date.now(),
      rsvpCount: 0
    };

    try {
      await setDoc(doc(db, "events", id), newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
    }

    setEvents(prev => [...prev, newEvent]);
    return id;
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<CipherEvent>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "events", id), updates);
    } catch (error) {
      console.error("Error updating event:", error);
    }

    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    return true;
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, "events", id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }

    setEvents(prev => prev.filter(e => e.id !== id));
    return true;
  }, []);

  const createStore = useCallback(async (storeData: Omit<StoreLocation, "id">): Promise<string | null> => {
    const id = `store-${Date.now()}`;
    const newStore: StoreLocation = { ...storeData, id };

    try {
      await setDoc(doc(db, "stores", id), newStore);
    } catch (error) {
      console.error("Error creating store:", error);
    }

    setStores(prev => [...prev, newStore]);
    return id;
  }, []);

  const updateStore = useCallback(async (id: string, updates: Partial<StoreLocation>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "stores", id), updates);
    } catch (error) {
      console.error("Error updating store:", error);
    }

    setStores(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  }, []);

  const checkInUser = useCallback(async (eventId: string, rsvpId: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "eventRSVPs", rsvpId), {
        status: "checked-in",
        checkedInAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error("Error checking in user:", error);
      return false;
    }
  }, []);

  const getEventRSVPs = useCallback(async (eventId: string): Promise<EventRSVP[]> => {
    try {
      const rsvpsRef = collection(db, "eventRSVPs");
      const q = query(rsvpsRef, where("eventId", "==", eventId));
      const snapshot = await getDocs(q);
      const rsvps: EventRSVP[] = [];
      snapshot.forEach((doc) => {
        rsvps.push({ id: doc.id, ...doc.data() } as EventRSVP);
      });
      return rsvps;
    } catch (error) {
      console.error("Error loading event RSVPs:", error);
      return [];
    }
  }, []);

  return (
    <LocalSceneContext.Provider value={{
      events,
      stores,
      userRSVPs,
      userLocation,
      loading,
      getEventById,
      getUpcomingEvents,
      getFeaturedEvent,
      getEventsByType,
      getNearbyEvents,
      rsvpToEvent,
      cancelRSVP,
      getUserRSVP,
      hasUserRSVPd,
      checkEligibility,
      getStoreById,
      getNearbyStores,
      getPickupStores,
      getExclusiveItems,
      updateUserLocation,
      requestLocationPermission,
      createEvent,
      updateEvent,
      deleteEvent,
      createStore,
      updateStore,
      checkInUser,
      getEventRSVPs
    }}>
      {children}
    </LocalSceneContext.Provider>
  );
}

export function useLocalScene() {
  const context = useContext(LocalSceneContext);
  if (!context) {
    throw new Error("useLocalScene must be used within a LocalSceneProvider");
  }
  return context;
}
