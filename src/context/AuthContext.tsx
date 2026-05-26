"use client";

import { createContext, use, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { AuthUser } from "@/lib/auth-types";

interface UserRole {
  role: "admin" | "user";
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  userRole: UserRole | null;
  refreshUserRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ADMIN_EMAILS = ["karthik.nishanth06@gmail.com"];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  refreshUserRole: async () => {},
  signOut: async () => {},
});

export const useAuth = () => use(AuthContext);

function mapBetterAuthUser(
  sessionUser: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    createdAt: Date | number;
  } | null
): AuthUser | null {
  if (!sessionUser) return null;
  const createdAt =
    typeof sessionUser.createdAt === "number"
      ? sessionUser.createdAt
      : sessionUser.createdAt.getTime();
  return {
    uid: sessionUser.id,
    email: sessionUser.email ?? null,
    displayName: sessionUser.name ?? null,
    photoURL: sessionUser.image ?? null,
    metadata: { creationTime: new Date(createdAt).toISOString() },
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = authClient.useSession();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const ensureUser = useMutation(api.users.ensureUser);

  const user = mapBetterAuthUser(session?.user ?? null);
  const loading = isPending;

  const applyRole = useCallback(
    (role: "admin" | "user", isAdmin: boolean) => {
      setUserRole({ role, isAdmin });
    },
    []
  );

  const refreshUserRole = useCallback(async () => {
    if (!user) {
      setUserRole(null);
      return;
    }

    const isAdminByEmail = ADMIN_EMAILS.includes(user.email || "");
    if (isAdminByEmail) {
      applyRole("admin", true);
      return;
    }

    try {
      const result = await ensureUser();
      applyRole(result.role, result.isAdmin);
    } catch {
      applyRole("user", false);
    }
  }, [user, ensureUser, applyRole]);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      return;
    }

    const isAdminByEmail = ADMIN_EMAILS.includes(user.email || "");
    if (isAdminByEmail) {
      applyRole("admin", true);
      return;
    }

    ensureUser()
      .then((result) => applyRole(result.role, result.isAdmin))
      .catch(() => applyRole("user", false));
  }, [user?.uid, user?.email, ensureUser, applyRole]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setUserRole(null);
  }, []);

  const contextValue = useMemo(
    () => ({ user, loading, userRole, refreshUserRole, signOut }),
    [user, loading, userRole, refreshUserRole, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
