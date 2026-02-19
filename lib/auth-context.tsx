"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser, UserRole } from "@/lib/auth";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: AppUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<AppUser | null>(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const meta = session.user.app_metadata;
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          role: (meta.role as UserRole) ?? "member",
          guildId: meta.guildId ?? null,
          accessStatus: meta.accessStatus ?? null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext value={{ user, loading }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
