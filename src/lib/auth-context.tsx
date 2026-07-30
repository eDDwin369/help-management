import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role, User } from "./types";

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const ROLE_PRIORITY: Role[] = ["admin", "sub_admin", "customer"];

/**
 * Role is ALWAYS resolved from the backend `user_roles` table, protected by
 * row-level security. It is never read from client storage or from any
 * client-supplied value, so it cannot be forged in the browser.
 */
async function loadUser(userId: string, email: string): Promise<User> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_color").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const granted = (roles ?? []).map((r) => r.role as Role);
  const role = ROLE_PRIORITY.find((r) => granted.includes(r)) ?? "customer";

  return {
    id: userId,
    email,
    name: profile?.full_name || email.split("@")[0],
    role,
    tenantId: "tenant-omnieye",
    avatarColor: profile?.avatar_color || COLORS[email.length % COLORS.length],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const sync = async (userId?: string, email?: string) => {
      if (!userId || !email) {
        if (active) setUser(null);
        return;
      }
      const next = await loadUser(userId, email);
      if (active) setUser(next);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // defer supabase calls out of the callback
      setTimeout(() => void sync(session?.user?.id, session?.user?.email ?? undefined), 0);
    });

    void (async () => {
      const { data } = await supabase.auth.getUser();
      await sync(data.user?.id, data.user?.email ?? undefined);
      if (active) setIsLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) return { ok: false, error: error?.message ?? "Invalid credentials" };
    setUser(await loadUser(data.user.id, data.user.email ?? email));
    return { ok: true };
  };

  const signUp: AuthCtx["signUp"] = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: fullName },
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, isLoading, login, signUp, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
