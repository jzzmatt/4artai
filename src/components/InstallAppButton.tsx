import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  return (
    <button
      className="min-h-[44px] min-w-[44px] px-space-sm rounded-full bg-surface-container text-on-surface flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors"
      type="button"
      aria-label="Install App"
      onClick={() => {
        const pending = promptEvent;
        setPromptEvent(null);
        void pending.prompt().then(() => pending.userChoice);
      }}
    >
      <span className="material-symbols-outlined text-[18px]">install_mobile</span>
      <span className="hidden md:inline font-label-md text-label-md">Install App</span>
    </button>
  );
}
