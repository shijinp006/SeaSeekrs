"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { send, upload, type MediaItem } from "@/lib/studio/client";
import { GOLD, Icon, INPUT, Modal, Note } from "./ui";

export default function Picker({ onPick, onClose }: { onPick: (item: MediaItem) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let gone = false;
    send<MediaItem[]>("GET", "/api/studio/media").then((r) => {
      if (gone) return;
      if (r.ok) setItems(r.data);
      else setError(r.error);
    });
    return () => {
      gone = true;
    };
  }, []);

  const add = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError("");
    const r = await upload(f);
    setBusy(false);
    if (r.ok) onPick(r.data);
    else setError(r.error);
  };

  const q = query.trim().toLowerCase();
  const shown = items?.filter((m) => !q || `${m.name} ${m.draftAlt ?? m.alt}`.toLowerCase().includes(q));

  return (
    <Modal title="Choose a picture" onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-3">
        <input aria-label="Search pictures" placeholder="Search by name or alt text" value={query} onChange={(e) => setQuery(e.target.value)} className={`${INPUT} max-w-xs`} />
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => add(e.target.files?.[0])}
        />
        <button type="button" className={GOLD} disabled={busy} onClick={() => file.current?.click()}>
          <Icon name="upload" /> {busy ? "Uploading…" : "Upload a picture"}
        </button>
        <span className="text-[0.8125rem] text-(--mute)">JPG, PNG, WebP or AVIF</span>
      </div>
      {error && (
        <div className="mt-3">
          <Note text={error} bad />
        </div>
      )}
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {shown?.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onPick(m)}
              title={m.name}
              className="block w-full text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--accent)"
            >
              <span className={`relative block aspect-[4/3] overflow-hidden rounded-[0.7rem] ${m.decorative ? "bg-[#07333b]" : "bg-ink/8"}`}>
                <Image src={m.path} alt={m.alt} fill sizes="12rem" className={m.decorative ? "object-contain p-4" : "object-cover"} />
              </span>
              <span className="mt-1.5 block truncate text-[0.8125rem] text-(--mute)">{m.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {!items && !error && <Note text="Loading…" />}
      {shown?.length === 0 && <Note text="No picture matches." />}
    </Modal>
  );
}
