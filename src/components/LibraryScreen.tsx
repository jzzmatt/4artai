import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hideFusionRecord, listSavedFusions, openOutput, type SavedFusion } from "../lib/library";
import { useAuth } from "../state/AuthProvider";
import { ProfileMenu } from "./ProfileMenu";
import { ShareSheet } from "./ShareSheet";
import { StudioNav } from "./StudioNav";
import { StyleLibraryModal } from "./StyleLibraryModal";

export function LibraryScreen() {
  const { email, openAuth } = useAuth();
  const [items, setItems] = useState<SavedFusion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [share, setShare] = useState<SavedFusion | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!email) {
      setItems([]);
      return;
    }
    let active = true;
    setLoading(true);
    listSavedFusions()
      .then((next) => {
        if (active) {
          setItems(next);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "The library could not be opened.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [email]);

  const remove = async (id: string) => {
    try {
      await hideFusionRecord(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That fusion could not be removed.");
    }
  };

  const openShare = async (item: SavedFusion) => {
    const fresh = await openOutput(item.imageUrl);
    setShare(item);
    setShareUrl(fresh || item.imageUrl);
  };

  return (
    <div className="bg-surface-container-low text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-gutter-mobile flex items-center justify-between gap-space-sm">
          <Link className="flex flex-col min-w-0" to="/">
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface truncate">QuadreStudio</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest truncate">Personal library</span>
          </Link>
          <ProfileMenu />
        </div>
      </header>
      <main className="flex-1 pt-20 pb-24 px-margin-mobile sm:px-gutter">
        <h1 className="font-headline-md text-headline-md text-on-surface">Saved fusions</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-xl">
          Portraits you save after generation stay here. Styles published by an admin appear in the Style Library.
        </p>
        {!email ? (
          <button className="mt-6 min-h-[44px] px-space-md rounded-full bg-primary text-on-primary font-label-md text-label-md" type="button" onClick={openAuth}>
            Sign in to see your library
          </button>
        ) : null}
        {error ? <p className="mt-4 font-label-sm text-label-sm text-error">{error}</p> : null}
        {email && loading ? <p className="mt-6 font-label-sm text-label-sm text-on-surface-variant">Opening your library…</p> : null}
        {email && !loading && items.length === 0 ? (
          <p className="mt-6 font-body-sm text-body-sm text-on-surface-variant">No saved fusions yet. Generate one on the canvas, then save it.</p>
        ) : null}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <article className="bg-surface-container-lowest rounded shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)] p-3" key={item.id}>
              <img alt={item.title} className="w-full aspect-[3/4] object-cover rounded-sm" src={item.imageUrl} />
              <p className="mt-3 font-label-md text-label-md text-on-surface">{item.title}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString()}</p>
              <div className="mt-3 flex gap-2">
                <button className="min-h-[40px] px-space-sm rounded-full bg-primary text-on-primary font-label-sm text-label-sm" type="button" onClick={() => void openShare(item)}>
                  Share
                </button>
                <button className="min-h-[40px] px-space-sm rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm" type="button" onClick={() => void remove(item.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
      <StudioNav current="library" />
      <StyleLibraryModal />
      <ShareSheet open={share !== null} title={share?.title ?? "Fusion"} url={shareUrl} onClose={() => setShare(null)} />
    </div>
  );
}
