"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserRole {
  role: "admin" | "user";
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  userRole: null,
  refreshUserRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Admin email whitelist (fallback if Firestore role not set)
const ADMIN_EMAILS = ["karthik.nishanth06@gmail.com"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const fetchUserRole = async (currentUser: User) => {
    // Immediately set role based on email whitelist (instant, no network)
    const isAdminByEmail = ADMIN_EMAILS.includes(currentUser.email || "");
    setUserRole({
      role: isAdminByEmail ? "admin" : "user",
      isAdmin: isAdminByEmail,
    });

    // Force refresh the token to get updated custom claims (like admin role set via service account)
    try {
      const tokenResult = await currentUser.getIdTokenResult(true);
      const claims = tokenResult.claims;
      
      // Check custom claims set by Firebase Admin SDK (via service account)
      if (claims.admin === true || claims.role === "admin") {
        setUserRole({
          role: "admin",
          isAdmin: true,
        });
        return; // Admin verified via custom claims, no need to check Firestore
      }
    } catch {
      // Token refresh failed, continue with other checks
    }

    // Then try to fetch from Firestore in background (non-blocking)
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore timeout")), 3000)
      );
      
      const fetchPromise = (async () => {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const role = data?.role as "admin" | "user" || "user";
          return { role, isAdmin: role === "admin" };
        }
        return null;
      })();

      const result = await Promise.race([fetchPromise, timeoutPromise]) as UserRole | null;
      if (result) {
        setUserRole(result);
      }
    } catch {
      // Silently fail - we already have the email-based role set
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      // Force refresh the token to get updated custom claims
      try {
        await user.getIdToken(true);
      } catch {
        // Token refresh failed
      }
      await fetchUserRole(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserRole(currentUser);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, refreshUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};
