"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { send } from "@/lib/studio/client";
import type { Field, Section } from "@/lib/studio/fields";
import { FieldInput, type Errors, type Value } from "./Fields";
import { useMedia } from "./media";
import SeoPreview from "./SeoPreview";
import { Badge, CARD, Icon, NAVY, Note, PLAIN, useLeaveGuard } from "./ui";

export type SectionState = { value: Value; original: Value; draft: boolean; edited: boolean };

/** The pictures that are chosen directly in a section or in its list items */
function picturesIn(fields: Field[], value: Value): string[] {
  return fields.flatMap((f) => {
    const v = value[f.key];
    if (f.type === "image") return [v as string];
    if (f.type === "images") return v as string[];
    if (f.type === "list") return (v as Value[]).flatMap((item) => picturesIn(f.of!, item));
    return [];
  });
}

/** Heading tag and font size stand in a box of their own */
function Look({ children }: { children: React.ReactNode }) {
  return (
    <fieldset className="col-span-full rounded-[0.7rem] border border-(--rule) bg-foam/60 p-4">
      <legend className="sr-only">Heading tag and font size</legend>
      <div className="grid gap-x-5 gap-y-4 @lg:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const half = (f: Field) => (f.type === "text" && (f.max ?? 160) <= 60) || f.type === "url";

export default function SectionForm({
  section,
  state,
  number,
  url,
  onSaved,
}: {
  section: Section;
  state: SectionState;
  number?: number;
  url: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const media = useMedia();
  const [value, setValue] = useState(state.value);
  const [saved, setSaved] = useState(state.value);
  const [errors, setErrors] = useState<Errors>({});
  const [note, setNote] = useState({ text: "", bad: false });
  const [busy, setBusy] = useState(false);

  // alt texts typed under the pictures of this section
  const alts = [...new Set(picturesIn(section.fields, value))].filter((p) => {
    const typed = media?.typed[p];
    return typed !== undefined && media?.of(p) && typed.trim() !== media.of(p)!.alt;
  });
  const changed = JSON.stringify(value) !== JSON.stringify(saved);
  const dirty = changed || alts.length > 0;
  useLeaveGuard(dirty);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fail = (error: string, fields?: Errors) => {
      setBusy(false);
      setErrors(fields ?? {});
      setNote({ text: error, bad: true });
    };
    if (changed) {
      const r = await send("PUT", `/api/studio/entries/${section.key}`, value);
      if (!r.ok) return fail(r.error, r.fields);
      setSaved(value);
    }
    for (const path of alts) {
      const r = await send("PATCH", `/api/studio/media/${media!.of(path)!.id}`, { alt: media!.typed[path] });
      if (!r.ok) return fail(r.fields?.alt ?? r.error);
    }
    setBusy(false);
    setErrors({});
    setNote({ text: "Saved as a draft. See it in the preview; Confirm & Publish puts it on the website.", bad: false });
    router.refresh();
    onSaved?.();
  };

  const set = (key: string, v: unknown) => setValue((old) => ({ ...old, [key]: v }));
  const input = (f: Field) => <FieldInput key={f.key} field={f} value={value[f.key]} onChange={(v) => set(f.key, v)} errors={errors} path={f.key} />;

  const rows: React.ReactNode[] = [];
  for (let i = 0; i < section.fields.length; i++) {
    const f = section.fields[i];
    if (f.type === "select") {
      const look = [f];
      while (section.fields[i + 1]?.type === "select") look.push(section.fields[++i]);
      rows.push(<Look key={f.key}>{look.map(input)}</Look>);
    } else
      rows.push(
        <div key={f.key} className={half(f) ? "" : "col-span-full"}>
          {input(f)}
        </div>,
      );
  }

  return (
    <form onSubmit={save} className={`${CARD} @container`}>
      <div className="flex flex-wrap items-center gap-3 px-5 pt-6 sm:px-7">
        {number !== undefined && (
          <span className="grid size-7 place-items-center rounded-full bg-[#d3e9e7] text-[0.8125rem] font-semibold text-[#08656b]">{number}</span>
        )}
        <h2 className="font-serif text-[1.4rem] leading-tight">{section.label}</h2>
        {state.edited && <Badge tone="good">Edited</Badge>}
        {state.draft && <Badge tone="calm">Draft</Badge>}
      </div>
      <div className={section.seo ? "grid gap-x-10 gap-y-8 p-5 sm:p-7 @2xl:grid-cols-2" : "p-5 sm:p-7"}>
        <div className="grid content-start gap-x-5 gap-y-6 @lg:grid-cols-2">{rows}</div>
        {section.seo && <SeoPreview title={String(value.title)} description={String(value.description)} image={String(value.image)} url={url} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-(--rule) px-5 py-4 sm:px-7">
        <button
          type="button"
          className={PLAIN}
          disabled={busy || JSON.stringify(value) === JSON.stringify(state.original)}
          onClick={() => {
            setValue(state.original);
            setErrors({});
            setNote({ text: "", bad: false });
          }}
        >
          <Icon name="undo" className="size-4" /> Reset to original
        </button>
        <Note text={dirty && !note.bad ? "Not saved yet" : note.text} bad={note.bad} />
        <button type="submit" className={`${NAVY} ml-auto`} disabled={busy || !dirty}>
          {busy ? "Saving…" : section.seo ? "Save" : "Save section"}
        </button>
      </div>
    </form>
  );
}
