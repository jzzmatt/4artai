import { useState } from "react";

interface ShareSheetProps {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}

function networkUrl(kind: "whatsapp" | "x" | "facebook", title: string, url: string) {
  const text = `${title} — QuadreStudio`;
  if (kind === "whatsapp") return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  if (kind === "x") return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function ShareSheet({ open, title, url, onClose }: ShareSheetProps) {
  const [note, setNote] = useState<string | null>(null);
  if (!open) return null;

  const nativeShare = async () => {
    setNote(null);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "quadrestudio-fusion.png", { type: blob.type || "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: `${title} — QuadreStudio`, files: [file] });
        onClose();
        return;
      }
      if (navigator.share) {
        await navigator.share({ title, text: `${title} — QuadreStudio`, url });
        onClose();
        return;
      }
      setNote("This browser cannot open the share sheet. Use one of the links below.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNote("The image could not be shared from this browser. Copy the link instead.");
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setNote("Link copied.");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-primary/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-margin-mobile">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.16)] p-space-lg" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="flex items-start justify-between gap-space-sm mb-space-md">
          <div>
            <h2 id="share-title" className="font-headline-sm text-headline-sm text-on-surface">Share fusion</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Send this portrait to a social app or copy the link.</p>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface" type="button" onClick={onClose} aria-label="Close share">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button className="min-h-[44px] rounded-full bg-primary text-on-primary font-label-md text-label-md" type="button" onClick={() => void nativeShare()}>
            Share image
          </button>
          <a className="min-h-[44px] rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center" href={networkUrl("whatsapp", title, url)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="min-h-[44px] rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center" href={networkUrl("x", title, url)} target="_blank" rel="noreferrer">
            X
          </a>
          <a className="min-h-[44px] rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center" href={networkUrl("facebook", title, url)} target="_blank" rel="noreferrer">
            Facebook
          </a>
          <button className="min-h-[44px] rounded-full bg-surface-container text-on-surface font-label-md text-label-md" type="button" onClick={() => void copyLink()}>
            Copy link
          </button>
        </div>
        {note ? <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">{note}</p> : null}
      </div>
    </div>
  );
}
