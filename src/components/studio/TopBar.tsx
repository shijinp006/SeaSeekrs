"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Pending } from "@/lib/server/studio";
import { send } from "@/lib/studio/client";
import { GOLD, Icon, ICON_BTN, LINE, Modal, Note } from "./ui";

const draftUrl = (p: Pending) =>
  p.kind === "section" ? `/api/studio/entries/${p.id}` : `/api/studio/${p.kind === "image" ? "media" : "posts"}/${p.id}?draft=1`;

export default function TopBar({ pending, last }: { pending: Pending[]; last: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  
  const n = pending.length;
  const count = `${n} change${n === 1 ? "" : "s"}`;

  const publish = async () => {
    setBusy(true);
    const r = await send("POST", "/api/studio/publish");
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setOpen(false);
    
    router.refresh();
  };

  const discard = async (p: Pending) => {
    if (!window.confirm(`Throw away the draft of “${p.label}”?`)) return;
    const r = await send("DELETE", draftUrl(p));
    if (!r.ok) return setError(r.error);
    window.location.reload(); // an open form may still hold the draft
  };

  return (
    <div
      className={`sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b py-2.5 pl-16 pr-4 text-[0.875rem] sm:pr-6 lg:pl-8 xl:pl-10 ${
        n ? "border-[#e8c468] bg-[#fff6de] text-[#5c3b00]" : "border-(--rule) bg-foam text-(--mute)"
      }`}
    >
      <p role="status" className="flex items-center gap-2.5">
        <span className={`size-2 rounded-full ${n ? "bg-gold" : "bg-[#2c9a68]"}`} />
        <span>
          {n ? `${count} not on the website yet` : "Published: the website shows the latest values"}
          {last && <span className="opacity-70 max-xl:hidden"> · last published {last}</span>}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={LINE} onClick={() => router.refresh()}>
          <Icon name="refresh" className="size-4" /> <span className="max-sm:sr-only">Refresh</span>
        </button>
        <button
          type="button"
          className={GOLD}
          disabled={!n}
          onClick={() => {
            setError("");
            setOpen(true);
          }}
        >
          Confirm &amp; Publish
        </button>
      </div>
      {open && (
        <Modal title={`Publish ${count}?`} onClose={() => setOpen(false)}>
          <p className="text-[0.9375rem] text-(--mute)">Visitors and Google see these as soon as you publish.</p>
          <ul className="mt-4 divide-y divide-(--rule) border-y border-(--rule)">
            {pending.map((p) => (
              <li key={p.kind + p.id} className="flex items-center justify-between gap-3 py-1.5">
                <Link href={p.href} onClick={() => setOpen(false)} className="min-w-0 truncate py-1 text-[0.9375rem] hover:text-(--accent)">
                  {p.label}
                </Link>
                {p.discardable && (
                  <button type="button" className={ICON_BTN} aria-label={`Discard ${p.label}`} title="Discard this draft" onClick={() => discard(p)}>
                    <Icon name="trash" className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className={GOLD} disabled={busy || !n} onClick={publish}>
              {busy ? "Publishing…" : "Publish now"}
            </button>
            <button type="button" className={LINE} onClick={() => setOpen(false)}>
              Not yet
            </button>
            {error && <Note text={error} bad />}
          </div>
        </Modal>
      )}
    </div>
  );
}
