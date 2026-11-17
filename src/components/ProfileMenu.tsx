import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthProvider";

export function ProfileMenu() {
  const { email, role, credits, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={email ? "Account menu" : "Sign in"}
        onClick={() => {
          if (!email) {
            openAuth();
            return;
          }
          setOpen((value) => !value);
        }}
      >
        <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
      </button>
      {open && email ? (
        <div className="absolute right-0 top-10 z-[60] w-64 rounded-lg bg-surface-container-lowest shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-space-sm" role="menu">
          <p className="px-space-sm py-1 font-body-sm text-body-sm text-on-surface truncate">{email}</p>
          <p className="px-space-sm pb-2 font-label-sm text-label-sm text-on-surface-variant">
            {credits === null ? "Credits unavailable" : `${credits} credits`}
          </p>
          <Link className="flex items-center min-h-[40px] px-space-sm rounded-full hover:bg-surface-container text-on-surface font-label-md text-label-md" to="/library" role="menuitem" onClick={() => setOpen(false)}>
            My library
          </Link>
          {role === "admin" ? (
            <Link className="flex items-center min-h-[40px] px-space-sm rounded-full hover:bg-surface-container text-on-surface font-label-md text-label-md" to="/admin" role="menuitem" onClick={() => setOpen(false)}>
              Admin Studio
            </Link>
          ) : null}
          <button
            className="flex items-center w-full min-h-[40px] px-space-sm rounded-full hover:bg-surface-container text-on-surface font-label-md text-label-md"
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
