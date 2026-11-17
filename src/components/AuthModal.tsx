import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

type Mode = "sign-in" | "create" | "magic";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const redirectTo = window.location.origin;
    try {
      if (mode === "magic") {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (authError) throw authError;
        setNotice("Check your inbox for the sign-in link.");
        return;
      }
      if (mode === "create") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (authError) throw authError;
        if (!data.session) {
          setNotice("Account created. Confirm the email, then sign in.");
        }
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-primary/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-margin-mobile">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.16)] p-space-lg" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="flex items-start justify-between gap-space-sm mb-space-md">
          <div>
            <h2 id="auth-title" className="font-headline-sm text-headline-sm text-on-surface">
              Studio Access
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Sign in to keep your atelier and credits with this account.</p>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors" type="button" onClick={onClose} aria-label="Close sign in">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex gap-1 p-1 rounded-full bg-surface-container-low mb-space-md">
          {(
            [
              ["sign-in", "Sign in"],
              ["create", "Create account"],
              ["magic", "Magic link"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`flex-1 min-h-[36px] px-2 rounded-full font-label-sm text-label-sm ${mode === id ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant"}`}
              type="button"
              onClick={() => {
                setMode(id);
                setError(null);
                setNotice(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="flex flex-col gap-space-sm" onSubmit={(event) => void submit(event)}>
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Email</span>
            <input
              className="min-h-[44px] rounded-full bg-surface-container px-space-md font-body-sm text-body-sm text-on-surface outline-none"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {mode === "magic" ? null : (
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Password</span>
              <input
                className="min-h-[44px] rounded-full bg-surface-container px-space-md font-body-sm text-body-sm text-on-surface outline-none"
                type="password"
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}
          {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}
          {notice ? <p className="font-body-sm text-body-sm text-on-surface">{notice}</p> : null}
          <button className="min-h-[44px] rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-neutral-800 transition-colors disabled:opacity-60" type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "create" ? "Create account" : mode === "magic" ? "Send magic link" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
