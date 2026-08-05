import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "./types";
import { DEMO_ACCOUNTS } from "./demo-accounts";

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

// Hardcoded mock user to bypass the need for a backend database
const MOCK_USER: User = {
  id: "mock-user-123",
  email: "demo@example.com",
  name: "Demo User",
  role: "admin",
  tenantId: "tenant-omnieye",
  avatarColor: COLORS[0],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial load (auto-login the mock user after 500ms for realism)
  useEffect(() => {
    const timer = setTimeout(() => {
      // If you want it to start logged out, change MOCK_USER to null here.
      setUser(null);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    // Instantly succeed with any credentials
    const demo = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase());
    setUser({
      ...MOCK_USER,
      email: email.trim(),
      name: demo ? demo.name : email.split("@")[0],
      role: demo ? demo.role : "customer",
      avatarColor: COLORS[email.length % COLORS.length],
    });
    return { ok: true };
  };

  const signUp: AuthCtx["signUp"] = async (email, password, fullName) => {
    // Instantly succeed
    setUser({
      ...MOCK_USER,
      email: email.trim(),
      name: fullName,
      avatarColor: COLORS[email.length % COLORS.length],
    });
    return { ok: true };
  };

  const logout = async () => {
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
