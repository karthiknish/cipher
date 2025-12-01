"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db, doc, getDoc, setDoc } from "@/lib/firebase";

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Work", etc.
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface StylePreferences {
  favoriteColors: string[];
  preferredFit: "slim" | "regular" | "oversized" | "";
  favoriteCategories: string[];
  priceRange: { min: number; max: number };
}

export interface StyleQuizAnswers {
  completed: boolean;
  answers: {
    style: string; // "minimalist", "streetwear", "classic", "bold"
    colors: string[];
    fit: string;
    occasions: string[];
    budget: string;
  };
}

export interface UserProfile {
  displayName: string;
  email: string;
  avatar: string;
  phone: string;
  birthdate: string;
  savedAddresses: SavedAddress[];
  stylePreferences: StylePreferences;
  styleQuiz: StyleQuizAnswers;
  createdAt: number;
  updatedAt: number;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  updateAvatar: (avatarUrl: string) => Promise<boolean>;
  addAddress: (address: Omit<SavedAddress, "id">) => Promise<boolean>;
  updateAddress: (id: string, address: Partial<SavedAddress>) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  getDefaultAddress: () => SavedAddress | null;
  saveStyleQuiz: (answers: StyleQuizAnswers["answers"]) => Promise<boolean>;
  updateStylePreferences: (prefs: Partial<StylePreferences>) => Promise<boolean>;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  email: "",
  avatar: "",
  phone: "",
  birthdate: "",
  savedAddresses: [],
  stylePreferences: {
    favoriteColors: [],
    preferredFit: "",
    favoriteCategories: [],
    priceRange: { min: 0, max: 500 },
  },
  styleQuiz: {
    completed: false,
    answers: {
      style: "",
      colors: [],
      fit: "",
      occasions: [],
      budget: "",
    },
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const STORAGE_KEY = "cipher_user_profile";

const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  loading: true,
  updateProfile: async () => false,
  updateAvatar: async () => false,
  addAddress: async () => false,
  updateAddress: async () => false,
  deleteAddress: async () => false,
  setDefaultAddress: async () => false,
  getDefaultAddress: () => null,
  saveStyleQuiz: async () => false,
  updateStylePreferences: async () => false,
});

export const useUserProfile = () => useContext(UserProfileContext);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      if (user) {
        // First, load from localStorage immediately (fast)
        const cached = localStorage.getItem(`${STORAGE_KEY}_${user.uid}`);
        if (cached) {
          try {
            setProfile(JSON.parse(cached));
          } catch {
            // Invalid cache, continue to fetch
          }
        } else {
          // Set a default profile immediately while we fetch
          setProfile({
            ...DEFAULT_PROFILE,
            displayName: user.displayName || "",
            email: user.email || "",
            avatar: user.photoURL || "",
          });
        }
        setLoading(false); // Show UI immediately

        // Then fetch from Firebase in background (non-blocking)
        try {
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error("Firestore timeout")), 5000)
          );
          
          const fetchPromise = (async () => {
            const userDoc = await getDoc(doc(db, "userProfiles", user.uid));
            if (userDoc.exists()) {
              return userDoc.data() as UserProfile;
            }
            // Create default profile if doesn't exist
            const newProfile: UserProfile = {
              ...DEFAULT_PROFILE,
              displayName: user.displayName || "",
              email: user.email || "",
              avatar: user.photoURL || "",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            // Don't await this - fire and forget
            setDoc(doc(db, "userProfiles", user.uid), newProfile).catch(() => {});
            return newProfile;
          })();

          const fetchedProfile = await Promise.race([fetchPromise, timeoutPromise]);
          if (fetchedProfile) {
            setProfile(fetchedProfile);
            // Cache in localStorage for next time
            localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, JSON.stringify(fetchedProfile));
          }
        } catch {
          // Silently fail - we already have a profile from cache or default
          console.log("Using cached/default profile");
        }
      } else {
        // Guest: use localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Save profile helper
  const saveProfile = useCallback(async (newProfile: UserProfile): Promise<boolean> => {
    try {
      const updated = { ...newProfile, updatedAt: Date.now() };
      
      // Update state immediately
      setProfile(updated);
      
      if (user) {
        // Cache to localStorage immediately
        localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, JSON.stringify(updated));
        // Save to Firebase in background (don't await)
        setDoc(doc(db, "userProfiles", user.uid), updated).catch((err) => 
          console.error("Error syncing profile to Firebase:", err)
        );
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      return false;
    }
  }, [user]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) return false;
    return saveProfile({ ...profile, ...data });
  }, [profile, saveProfile]);

  const updateAvatar = useCallback(async (avatarUrl: string): Promise<boolean> => {
    if (!profile) return false;
    return saveProfile({ ...profile, avatar: avatarUrl });
  }, [profile, saveProfile]);

  const addAddress = useCallback(async (address: Omit<SavedAddress, "id">): Promise<boolean> => {
    if (!profile) return false;
    
    const newAddress: SavedAddress = {
      ...address,
      id: Date.now().toString(),
      isDefault: profile.savedAddresses.length === 0 ? true : address.isDefault,
    };

    // If new address is default, unset others
    const updatedAddresses = address.isDefault
      ? profile.savedAddresses.map(a => ({ ...a, isDefault: false }))
      : [...profile.savedAddresses];

    return saveProfile({
      ...profile,
      savedAddresses: [...updatedAddresses, newAddress],
    });
  }, [profile, saveProfile]);

  const updateAddress = useCallback(async (id: string, address: Partial<SavedAddress>): Promise<boolean> => {
    if (!profile) return false;

    let updatedAddresses = profile.savedAddresses.map(a =>
      a.id === id ? { ...a, ...address } : a
    );

    // If setting as default, unset others
    if (address.isDefault) {
      updatedAddresses = updatedAddresses.map(a =>
        a.id === id ? a : { ...a, isDefault: false }
      );
    }

    return saveProfile({ ...profile, savedAddresses: updatedAddresses });
  }, [profile, saveProfile]);

  const deleteAddress = useCallback(async (id: string): Promise<boolean> => {
    if (!profile) return false;
    
    const filtered = profile.savedAddresses.filter(a => a.id !== id);
    
    // If deleted address was default, set first remaining as default
    if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
      filtered[0].isDefault = true;
    }

    return saveProfile({ ...profile, savedAddresses: filtered });
  }, [profile, saveProfile]);

  const setDefaultAddress = useCallback(async (id: string): Promise<boolean> => {
    if (!profile) return false;

    const updatedAddresses = profile.savedAddresses.map(a => ({
      ...a,
      isDefault: a.id === id,
    }));

    return saveProfile({ ...profile, savedAddresses: updatedAddresses });
  }, [profile, saveProfile]);

  const getDefaultAddress = useCallback((): SavedAddress | null => {
    if (!profile) return null;
    return profile.savedAddresses.find(a => a.isDefault) || profile.savedAddresses[0] || null;
  }, [profile]);

  const saveStyleQuiz = useCallback(async (answers: StyleQuizAnswers["answers"]): Promise<boolean> => {
    if (!profile) return false;

    // Map quiz answers to style preferences
    const stylePreferences: StylePreferences = {
      favoriteColors: answers.colors,
      preferredFit: answers.fit as StylePreferences["preferredFit"],
      favoriteCategories: answers.occasions.includes("casual") ? ["Tees", "Hoodies"] : 
                         answers.occasions.includes("street") ? ["Outerwear", "Pants"] : [],
      priceRange: answers.budget === "budget" ? { min: 0, max: 75 } :
                  answers.budget === "mid" ? { min: 50, max: 150 } :
                  { min: 100, max: 500 },
    };

    return saveProfile({
      ...profile,
      styleQuiz: { completed: true, answers },
      stylePreferences,
    });
  }, [profile, saveProfile]);

  const updateStylePreferences = useCallback(async (prefs: Partial<StylePreferences>): Promise<boolean> => {
    if (!profile) return false;
    return saveProfile({
      ...profile,
      stylePreferences: { ...profile.stylePreferences, ...prefs },
    });
  }, [profile, saveProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        updateProfile,
        updateAvatar,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getDefaultAddress,
        saveStyleQuiz,
        updateStylePreferences,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};
