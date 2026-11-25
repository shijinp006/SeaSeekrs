"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ICON_BTN } from "./styles";

export * from "./styles";

const paths = {
  gauge: "M4 18a8 8 0 1 1 16 0M12 18l4-6",
  page: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01",
  store: "M4 10v10h16V10M3 10l2-6h14l2 6zM9 20v-5h6v5",
  pen: "M4 20l1-4L16 5l3 3L8 19zM14 7l3 3",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6.5 6.5 0 0 1 3.5 5.5",
  key: "M14.5 9.5a4.5 4.5 0 1 0-4 4.5l1.5 1.5h2v2h2v2h3v-3z",
  out: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
  wave: "M3 9c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 15c3 0 3 2 6 2s3-2 6-2 3 2 6 2",
  warn: "M12 4 2.5 20h19zM12 10v4M12 17h.01",
  check: "m5 12.5 4.5 4.5L19 7.5",
  arrow: "M4 12h16M14 6l6 6-6 6",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  link: "M14 4h6v6M20 4 10 14M18 14v6H4V6h6",
  menu: "M4 7h16M4 12h16M4 17h16",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v4h16v-4",
  undo: "M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeoff: "M4 4l16 16M9.5 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.6M6 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9M10 10a3 3 0 0 0 4 4",
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
  screen: "M3 5h18v11H3zM9 20h6M12 16v4",
  refresh: "M20 11a8 8 0 0 0-14.5-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 4l1.5-2M20 20v-5h-5",
  calendar: "M4 6h16v14H4zM4 10.5h16M8.5 3.5V8M15.5 3.5V8M8.5 14.5h3",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
};
export type IconName = keyof typeof paths;

export const Icon = ({ name, className = "size-[1.15rem]" }: { name: IconName; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden
    className={`shrink-0 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={paths[name]} />
  </svg>
);

export function Badge({ tone, children }: { tone: "good" | "warn" | "calm"; children: React.ReactNode }) {
  const look = { good: "bg-[#def3e6] text-[#12633a]", warn: "bg-[#fdefcb] text-[#7a4d00]", calm: "bg-ink/6 text-(--mute)" }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-medium leading-none ${look}`}>
      {tone === "good" && <Icon name="check" className="size-3.5" />}
      {tone === "warn" && <Icon name="warn" className="size-3.5" />}
      {children}
    </span>
  );
}

/** Message under a form. Announced to screen readers when it changes. */
export const Note = ({ text, bad }: { text: string; bad?: boolean }) => (
  <p role="status" className={`text-[0.875rem] ${bad ? "text-[#a52a2a]" : "text-(--mute)"}`}>
    {text}
  </p>
);

const never = () => () => {};
const useInBrowser = () =>
  useSyncExternalStore(
    never,
    () => true,
    () => false,
  );

/** Rendered in <body>, so it is never inside another form */
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const ready = useInBrowser();
  useEffect(() => {
    if (ready && !ref.current?.open) ref.current?.showModal();
  }, [ready]);
  if (!ready) return null;
  return createPortal(
    <dialog
      ref={ref}
      data-tone="foam"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`m-auto max-h-[86svh] w-[calc(100vw-2rem)] overflow-hidden rounded-[1.3rem] bg-white p-0 text-ink shadow-2xl backdrop:bg-navy-deep/70 ${wide ? "max-w-5xl" : "max-w-lg"}`}
    >
      <div className="flex max-h-[86svh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-(--rule) px-6 py-4">
          <h2 className="font-serif text-[1.35rem] leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={ICON_BTN}>
            <Icon name="close" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}

// Several forms can be open on a page: they are asked about together, once
const unsaved = new Set<symbol>();
const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href]");
      if (!a || a.getAttribute("target") === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (!window.confirm("Leave without saving your changes?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

/** Asks before leaving with unsaved text */
export function useLeaveGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const me = Symbol();
    if (!unsaved.size) {
      window.addEventListener("beforeunload", onUnload);
      document.addEventListener("click", onClick, true);
    }
    unsaved.add(me);
    return () => {
      unsaved.delete(me);
      if (unsaved.size) return;
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
