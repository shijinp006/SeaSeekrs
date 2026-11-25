"use client";

import { useSyncExternalStore } from "react";

const never = () => () => {};

/** Tells an editor that this page shows drafts. Not inside the studio's own preview frame, which says so itself. */
export default function PreviewBar() {
  const alone = useSyncExternalStore(
    never,
    () => window.self === window.top,
    () => false,
  );
  if (!alone) return null;
  const exit = async () => {
    await fetch("/api/studio/preview", { method: "DELETE" });
    window.location.reload();
  };
  return (
    <p role="status" className="fixed inset-x-0 bottom-4 z-[70] mx-auto w-max max-w-[calc(100vw-2rem)] flex items-center gap-4 rounded-full bg-navy-deep px-5 py-3 text-[0.875rem] text-white shadow-2xl">
      Preview: showing unpublished changes
      <button type="button" onClick={exit} className="text-gold underline underline-offset-4">
        Exit
      </button>
    </p>
  );
}
