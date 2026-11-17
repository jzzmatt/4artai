import { Link } from "react-router-dom";
import { useStudio } from "../state/StudioProvider";

export function StudioNav({ current }: { current: "canvas" | "library" }) {
  const studio = useStudio();
  const item = "min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors";
  const active = `${item} text-primary font-medium`;
  const idle = `${item} text-on-surface-variant hover:text-on-surface`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 px-space-sm max-w-lg mx-auto">
        <Link aria-current={current === "canvas" ? "page" : undefined} className={current === "canvas" ? active : idle} to="/">
          <span className="material-symbols-outlined text-[20px]">draw</span>
          <span className="font-label-sm text-label-sm">Canvas</span>
        </Link>
        <button className={idle} type="button" onClick={() => studio.setStyleLibraryOpen(true)}>
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          <span className="font-label-sm text-label-sm">Styles</span>
        </button>
        <Link aria-current={current === "library" ? "page" : undefined} className={current === "library" ? active : idle} to="/library">
          <span className="material-symbols-outlined text-[20px]">museum</span>
          <span className="font-label-sm text-label-sm">Gallery</span>
        </Link>
        <span className={`${item} text-on-surface-variant`}>
          <span className="material-symbols-outlined text-[20px]">folder_special</span>
          <span className="font-label-sm text-label-sm">Archive</span>
        </span>
      </div>
    </nav>
  );
}
