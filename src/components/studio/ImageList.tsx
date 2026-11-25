"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { send, upload, type MediaItem } from "@/lib/studio/client";
import { altIssue } from "@/lib/studio/seo";
import { Badge, CARD, GOLD, Icon, ICON_BTN, INPUT, LINE, Note } from "./ui";

type Item = MediaItem & { uses: string[] };

function Row({ item }: { item: Item }) {
  const router = useRouter();
  const current = item.draftAlt ?? item.alt;
  const [alt, setAlt] = useState(current);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ text: "", bad: false });
  const issue = item.decorative ? null : altIssue(current);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await send("PATCH", `/api/studio/media/${item.id}`, { alt });
    setBusy(false);
    setNote(r.ok ? { text: "Saved as a draft", bad: false } : { text: r.fields?.alt ?? r.error, bad: true });
    if (r.ok) router.refresh();
  };
  const remove = async () => {
    if (!window.confirm(`Delete “${item.name}”? This cannot be undone.`)) return;
    const r = await send("DELETE", `/api/studio/media/${item.id}`);
    if (r.ok) router.refresh();
    else setNote({ text: r.error, bad: true });
  };

  return (
    <li className="grid gap-4 p-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
      <span className={`relative block aspect-[4/3] w-36 overflow-hidden rounded-[0.7rem] ${item.decorative ? "bg-[#07333b]" : "bg-ink/8"}`}>
        <Image src={item.path} alt="" fill sizes="10rem" className={item.decorative ? "object-contain p-5" : "object-cover"} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[0.9375rem] font-medium">{item.name}</p>
          {item.decorative ? <Badge tone="calm">Decorative, needs no alt text</Badge> : <Badge tone={issue ? "warn" : "good"}>{issue ? `Alt text: ${issue.toLowerCase()}` : "Alt text OK"}</Badge>}
          {item.draftAlt !== null && <Badge tone="calm">Draft</Badge>}
          {item.uploaded && (
            <button type="button" className={`${ICON_BTN} ml-auto`} aria-label={`Delete ${item.name}`} title="Delete" onClick={remove}>
              <Icon name="trash" className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-1 text-[0.8125rem] text-(--mute)">
          {item.width} × {item.height}, {Math.max(1, Math.round(item.size / 1024))} KB. {item.uses.length ? `Used in ${item.uses.join(", ")}` : "Not used yet"}
        </p>
        {!item.decorative && (
          <form onSubmit={save} className="mt-3 flex flex-wrap items-center gap-2">
            <input aria-label={`Alt text of ${item.name}`} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what the picture shows" className={`${INPUT} min-w-0 flex-1 basis-64`} />
            <button type="submit" className={LINE} disabled={busy || alt.trim() === current}>
              Save
            </button>
          </form>
        )}
        {note.text && (
          <div className="mt-2">
            <Note {...note} />
          </div>
        )}
      </div>
    </li>
  );
}

export default function ImageList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [only, setOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();
  const shown = items.filter((m) => {
    const alt = m.draftAlt ?? m.alt;
    return (!only || (!m.decorative && altIssue(alt))) && (!q || `${m.name} ${alt}`.toLowerCase().includes(q));
  });

  const add = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError("");
    const r = await upload(f);
    setBusy(false);
    if (file.current) file.current.value = "";
    if (r.ok) router.refresh();
    else setError(r.error);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <input aria-label="Search pictures" placeholder="Search by name or alt text" value={query} onChange={(e) => setQuery(e.target.value)} className={`${INPUT} max-w-xs`} />
        <label className="flex items-center gap-2 text-[0.875rem]">
          <input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} className="size-4 accent-[#08757a]" />
          Only those that need alt text
        </label>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => add(e.target.files?.[0])} />
        <button type="button" className={`${GOLD} sm:ml-auto`} disabled={busy} onClick={() => file.current?.click()}>
          <Icon name="upload" /> {busy ? "Uploading…" : "Upload a picture"}
        </button>
      </div>
      {error && (
        <div className="mt-3">
          <Note text={error} bad />
        </div>
      )}
      <ul className={`${CARD} mt-5 divide-y divide-(--rule)`}>
        {shown.map((m) => (
          <Row key={m.id} item={m} />
        ))}
        {!shown.length && <li className="p-6 text-(--mute)">No picture matches.</li>}
      </ul>
    </>
  );
}
