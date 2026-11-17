import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthModal } from "../components/AuthModal";
import { supabase, type StudioRole } from "../lib/supabase";

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  email: string | null;
  role: StudioRole | null;
  credits: number | null;
  openAuth: () => void;
  setCredits: (value: number) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<StudioRole | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const applySession = (next: Session | null) => {
      setSession(next);
      if (next) setAuthOpen(false);
      if (!next) {
        setRole(null);
        setCredits(null);
        setReady(true);
        return;
      }
      void supabase
        .from("profiles")
        .select("role, credits_remaining")
        .eq("id", next.user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!active) return;
          if (error || !data || (data.role !== "admin" && data.role !== "user")) {
            setRole("user");
            setCredits(null);
          } else {
            setRole(data.role);
            setCredits(data.credits_remaining);
          }
          setReady(true);
        });
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (active) applySession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      window.setTimeout(() => {
        if (active) applySession(next);
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      email: session?.user.email ?? null,
      role,
      credits,
      openAuth: () => setAuthOpen(true),
      setCredits,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [credits, ready, role, session],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
