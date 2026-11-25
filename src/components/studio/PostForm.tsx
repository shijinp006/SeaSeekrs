"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import type { PostData } from "@/lib/server/validate";
import { send } from "@/lib/studio/client";
import { ImageField, Picker } from "./ImagePicker";
import type { Look } from "./Preview";
import SeoPreview from "./SeoPreview";
import { CARD, DANGER, INPUT, LABEL, LINE, NAVY, Note, useLeaveGuard } from "./ui";

// loaded when they are first shown
const Markdown = dynamic(() => import("@/components/Markdown"));
const Preview = dynamic(() => import("./Preview"), { ssr: false });

const slugOf = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");

const marks = [
  
  { label: "Bold", before: "**", after: "**", sample: "bold text" },
  { label: "Italic", before: "*", after: "*", sample: "italic text" },
  { label: "Link", before: "[", after: "](https://)", sample: "link text" },
  { label: "List", before: "\n\n- ", after: "\n", sample: "First point" },
  { label: "Quote", before: "\n\n> ", after: "\n\n", sample: "Quote" },
];

export default function PostForm({
  id,
  value: initial,
  host,
  published,
}: {
  id?: string;
  value: PostData;
  host: string;
  /** address on the website, while it is there */
  published?: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [autoSlug, setAutoSlug] = useState(!id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState({ text: "", bad: false });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [picking, setPicking] = useState(false);
  const [look, setLook] = useState<Look>({ anchor: "", version: 0 });
  const area = useRef<HTMLTextAreaElement>(null);
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);
  useLeaveGuard(dirty && !busy);

  const set = <K extends keyof PostData>(key: K, v: PostData[K]) => setValue((old) => ({ ...old, [key]: v }));

  const insert = (before: string, sample: string, after: string) => {
    const el = area.current;
    const [a, b] = el ? [el.selectionStart, el.selectionEnd] : [value.body.length, value.body.length];
    const text = value.body.slice(a, b) || sample;
    set("body", value.body.slice(0, a) + before + text + after + value.body.slice(b));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(a + before.length, a + before.length + text.length);
    });
  };

  /** Makes the line the cursor is on a heading, or a paragraph again */
  const tagLine = (level: number) => {
    const el = area.current;
    const at = el?.selectionStart ?? value.body.length;
    const start = value.body.lastIndexOf("\n", at - 1) + 1;
    const end = value.body.indexOf("\n", at) < 0 ? value.body.length : value.body.indexOf("\n", at);
    const words = value.body.slice(start, end).replace(/^#{1,6} +/, "") || (level ? "Heading" : "");
    const line = (level ? `${"#".repeat(level)} ` : "") + words;
    set("body", value.body.slice(0, start) + line + value.body.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + line.length, start + line.length);
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await send<{ id?: string }>(id ? "PUT" : "POST", `/api/studio/posts${id ? `/${id}` : ""}`, value);
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fields ?? {});
      return setNote({ text: r.error, bad: true });
    }
    setErrors({});
    setSaved(value);
    setNote({ text: value.live ? "Saved as a draft. Confirm & Publish puts it on the website." : "Saved as a draft.", bad: false });
    setLook((l) => ({ ...l, version: l.version + 1 }));
    if (!id && r.data.id) router.replace(`/studio/blog/${r.data.id}`);
    router.refresh();
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${value.title}”${published ? " here and on the website" : ""}? This cannot be undone.`)) return;
    setBusy(true);
    const r = await send("DELETE", `/api/studio/posts/${id}`);
    if (!r.ok) {
      setBusy(false);
      return setNote({ text: r.error, bad: true });
    }
    router.replace("/studio/blog");
    router.refresh();
  };

  const row = (key: "title" | "slug" | "seoTitle", label: string, hint?: string, onChange?: (v: string) => void) => (
    <div>
      <label htmlFor={`post-${key}`} className={`${LABEL} mb-2 block`}>
        {label}
      </label>
      <input
        id={`post-${key}`}
        value={value[key]}
        onChange={(e) => (onChange ?? ((v) => set(key, v)))(e.target.value)}
        aria-invalid={!!errors[key]}
        className={INPUT}
      />
      <Under error={errors[key]} hint={hint} />
    </div>
  );
  const box = (key: "excerpt" | "seoDescription", label: string, hint?: string) => (
    <div>
      <label htmlFor={`post-${key}`} className={`${LABEL} mb-2 block`}>
        {label}
      </label>
      <textarea id={`post-${key}`} rows={3} value={value[key]} onChange={(e) => set(key, e.target.value)} aria-invalid={!!errors[key]} className={INPUT} />
      <Under error={errors[key]} hint={hint} />
    </div>
  );

  return (
    <form onSubmit={save} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className={`${CARD} space-y-6 p-5 sm:p-7`}>
        {row("title", "Title", undefined, (v) => setValue((old) => ({ ...old, title: v, slug: autoSlug ? slugOf(v) : old.slug })))}
        {row("slug", "Address", `${host}/blog/${value.slug || "…"}`, (v) => {
          setAutoSlug(false);
          set("slug", v.toLowerCase().replace(/\s+/g, "-"));
        })}
        {box("excerpt", "Summary", "Shown in the list of posts.")}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="post-body" className={LABEL}>
              Text
            </label>
            <button type="button" className="text-[0.875rem] text-(--accent) underline underline-offset-4" onClick={() => setPreview((p) => !p)}>
              {preview ? "Back to writing" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-80 rounded-[0.7rem] border border-(--rule) p-6">
              <Markdown text={value.body} />
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <select
                  aria-label="Tag of the line the cursor is on"
                  value=""
                  onChange={(e) => tagLine(Number(e.target.value))}
                  className={`${INPUT} w-auto! py-1.5!`}
                >
                  <option value="" disabled>
                    Tag of this line
                  </option>
                  <option value="0">P (paragraph)</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      H{n}
                    </option>
                  ))}
                </select>
                {marks.map((m) => (
                  <button key={m.label} type="button" className={LINE} onClick={() => insert(m.before, m.sample, m.after)}>
                    {m.label}
                  </button>
                ))}
                <button type="button" className={LINE} onClick={() => setPicking(true)}>
                  Picture
                </button>
              </div>
              <textarea
                id="post-body"
                ref={area}
                rows={20}
                value={value.body}
                onChange={(e) => set("body", e.target.value)}
                aria-invalid={!!errors.body}
                className={`${INPUT} leading-relaxed`}
              />
            </>
          )}
          <Under error={errors.body} />
        </div>
      </div>

      <div className="space-y-6">
        <div className={`${CARD} space-y-4 p-5`}>
          <label className="flex items-start gap-3 text-[0.9375rem]">
            <input type="checkbox" checked={value.live} onChange={(e) => set("live", e.target.checked)} className="mt-1 size-4 accent-[#08757a]" />
            <span>
              Show on the website
              <span className="block text-[0.8125rem] text-(--mute)">Takes effect with Confirm &amp; Publish.</span>
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={NAVY} disabled={busy || !dirty}>
              {busy ? "Saving…" : "Save draft"}
            </button>
            {published && (
              <a href={`/blog/${published}`} target="_blank" className={LINE}>
                See it
              </a>
            )}
            {id && (
              <button type="button" className={DANGER} disabled={busy} onClick={remove}>
                Delete
              </button>
            )}
          </div>
          <Note text={dirty && !note.bad ? "Not saved yet" : note.text} bad={note.bad} />
        </div>
        <div className={`${CARD} p-5`}>
          <p className={`${LABEL} mb-2`}>Cover picture</p>
          <ImageField value={value.cover} onChange={(p) => set("cover", p)} optional invalid={!!errors.cover} />
          <Under error={errors.cover} hint="Also the picture when the link is shared." />
        </div>
        <div className={`${CARD} space-y-5 p-5`}>
          {row("seoTitle", "Page title", "For Google. Empty: the title above.")}
          {box("seoDescription", "Meta description", "For Google. Empty: the summary above.")}
        </div>
        <div className={`${CARD} p-5`}>
          <SeoPreview title={value.seoTitle || value.title} description={value.seoDescription || value.excerpt} image={value.cover} url={`${host}/blog/${value.slug}`} />
        </div>
        {id && (
          <div className="h-[40rem]">
            <Preview path={`/blog/${saved.slug}`} device="phone" look={look} />
          </div>
        )}
      </div>
      {picking && (
        <Picker
          onClose={() => setPicking(false)}
          onPick={(m) => {
            setPicking(false);
            insert("\n\n", `![${(m.draftAlt ?? m.alt).replace(/[[\]]/g, "")}](${m.path})`, "\n\n");
          }}
        />
      )}
    </form>
  );
}

const Under = ({ error, hint }: { error?: string; hint?: string }) =>
  error ? (
    <p className="mt-1.5 text-[0.8125rem] text-[#a52a2a]">{error}</p>
  ) : hint ? (
    <p className="mt-1.5 text-[0.8125rem] text-(--mute) [overflow-wrap:anywhere]">{hint}</p>
  ) : null;
