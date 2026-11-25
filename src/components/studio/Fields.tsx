"use client";

import { useId, useState } from "react";
import type { Field } from "@/lib/studio/fields";
import { descriptionIssue, titleIssue } from "@/lib/studio/seo";
import { ImageField } from "./ImagePicker";
import { Icon, ICON_BTN, INPUT, LABEL, LINE } from "./ui";

export type Value = Record<string, unknown>;
export type Errors = Record<string, string>;

const blank = (f: Field): unknown =>
  f.type === "list" || f.type === "strings" || f.type === "images" ? [] : f.type === "check" ? false : "";
const blankItem = (f: Field): Value => Object.fromEntries(f.of!.map((x) => [x.key, blank(x)]));
const under = (errors: Errors, path: string) => Object.keys(errors).some((k) => k === path || k.startsWith(`${path}.`));
const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

/** One field of a section, whatever its type. `path` is where it sits in the section, as the server names it in errors. */
export function FieldInput({
  field: f,
  value,
  onChange,
  errors,
  path,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  errors: Errors;
  path: string;
}) {
  const id = useId();
  const error = errors[path];
  const simple = f.type === "text" || f.type === "url" || f.type === "area";
  const google = GOOGLE[f.label]; // the two texts Google shows have a best length
  const issue = google?.issue(String(value ?? "").trim());
  if (f.type === "check") return <Check field={f} value={value === true} onChange={onChange} />;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        {simple || f.type === "select" ? (
          <label htmlFor={id} className={LABEL}>
            {f.label}
            {f.optional && <span className="font-normal normal-case tracking-normal"> (optional)</span>}
          </label>
        ) : (
          <p className={LABEL}>{f.label}</p>
        )}
        {simple && !google && f.max && String(value ?? "").length > f.max * 0.8 && (
          <span className={`text-[0.75rem] ${String(value).length > f.max ? "text-[#a52a2a]" : "text-(--mute)"}`}>
            {String(value).length} / {f.max}
          </span>
        )}
      </div>
      {f.hint && <p className="mt-0.5 text-[0.8125rem] text-(--mute)">{f.hint}</p>}
      <div className="h-2" />
      {f.type === "select" && (
        <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={INPUT}>
          {f.options!.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      )}
      {simple && f.type !== "area" && (
        <input
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : undefined}
          className={INPUT}
        />
      )}
      {f.type === "area" && (
        <textarea
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : undefined}
          rows={f.key === "title" ? 2 : 3}
          className={`${INPUT} [field-sizing:content] leading-relaxed`}
        />
      )}
      {f.type === "image" && (
        <ImageField value={String(value ?? "")} onChange={onChange} optional={f.optional} dark={f.key === "icon"} invalid={!!error} />
      )}
      {f.type === "strings" && <Strings field={f} value={value as string[]} onChange={onChange} errors={errors} path={path} />}
      {f.type === "images" && <Images field={f} value={value as string[]} onChange={onChange} errors={errors} path={path} />}
      {f.type === "list" && <List field={f} value={value as Value[]} onChange={onChange} errors={errors} path={path} />}
      {error && (
        <p id={`${id}-e`} className="mt-1.5 text-[0.8125rem] text-[#a52a2a]">
          {error}
        </p>
      )}
      {google && (
        <p className={`mt-1.5 flex justify-between gap-4 text-[0.8125rem] ${issue ? "text-[#7a4d00]" : "text-[#12633a]"}`}>
          <span>{issue ?? "Good length"}</span>
          <span>
            {String(value ?? "").trim().length} / {google.best}
          </span>
        </p>
      )}
    </div>
  );
}

const GOOGLE: Record<string, { best: number; issue: (s: string) => string | null }> = {
  "Page title": { best: 60, issue: titleIssue },
  "Meta description": { best: 160, issue: descriptionIssue },
};

const Check = ({ field: f, value, onChange }: { field: Field; value: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-start gap-3 rounded-[0.7rem] border border-(--rule) bg-foam/60 p-4 text-[0.9375rem] font-medium">
    <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-[#08757a]" />
    <span>
      {f.label}
      {f.hint && <span className="block text-[0.8125rem] font-normal text-(--mute)">{f.hint}</span>}
    </span>
  </label>
);

type Many<T> = { field: Field; value: T[]; onChange: (value: T[]) => void; errors: Errors; path: string };

function Tools({ i, n, what, min, onMove, onRemove }: { i: number; n: number; what: string; min: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <span className="flex shrink-0">
      <button type="button" className={ICON_BTN} disabled={i === 0} aria-label={`Move ${what} up`} onClick={() => onMove(i - 1)}>
        <Icon name="up" className="size-4" />
      </button>
      <button type="button" className={ICON_BTN} disabled={i === n - 1} aria-label={`Move ${what} down`} onClick={() => onMove(i + 1)}>
        <Icon name="down" className="size-4" />
      </button>
      <button type="button" className={ICON_BTN} disabled={n <= min} aria-label={`Delete ${what}`} onClick={onRemove}>
        <Icon name="trash" className="size-4" />
      </button>
    </span>
  );
}

const Add = ({ label, off, onClick }: { label: string; off: boolean; onClick: () => void }) => (
  <button type="button" className={`${LINE} mt-3`} disabled={off} onClick={onClick}>
    <Icon name="plus" className="size-4" /> {label}
  </button>
);

function Strings({ field: f, value, onChange, errors, path }: Many<string>) {
  const long = (f.max ?? 0) > 200;
  return (
    <div>
      <ul className="space-y-2">
        {value.map((s, i) => {
          const props = {
            value: s,
            "aria-label": `${f.label} ${i + 1}`,
            "aria-invalid": !!errors[`${path}.${i}`],
            onChange: (e: { target: { value: string } }) => onChange(value.map((x, n) => (n === i ? e.target.value : x))),
          };
          return (
            <li key={i}>
              <div className="flex items-start gap-2 max-sm:flex-col max-sm:items-end">
                {long ? <textarea {...props} rows={Math.max(3, Math.ceil(s.length / 80))} className={`${INPUT} [field-sizing:content] leading-relaxed`} /> : <input {...props} className={INPUT} />}
                <Tools
                  i={i}
                  n={value.length}
                  min={f.minItems ?? 0}
                  what={`${f.label} ${i + 1}`}
                  onMove={(to) => onChange(move(value, i, to))}
                  onRemove={() => onChange(value.filter((_, n) => n !== i))}
                />
              </div>
              {errors[`${path}.${i}`] && <p className="mt-1 text-[0.8125rem] text-[#a52a2a]">{errors[`${path}.${i}`]}</p>}
            </li>
          );
        })}
      </ul>
      <Add label="Add a line" off={value.length >= (f.maxItems ?? 50)} onClick={() => onChange([...value, ""])} />
    </div>
  );
}

function Images({ field: f, value, onChange, errors, path }: Many<string>) {
  return (
    <div>
      <ul className="space-y-2">
        {value.map((src, i) => (
          <li key={i} className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-end">
            <ImageField value={src} onChange={(p) => onChange(value.map((x, n) => (n === i ? p : x)))} invalid={!!errors[`${path}.${i}`]} />
            <Tools
              i={i}
              n={value.length}
              min={f.minItems ?? 0}
              what={`photo ${i + 1}`}
              onMove={(to) => onChange(move(value, i, to))}
              onRemove={() => onChange(value.filter((_, n) => n !== i))}
            />
          </li>
        ))}
      </ul>
      <Add label="Add a photo" off={value.length >= (f.maxItems ?? 50)} onClick={() => onChange([...value, ""])} />
    </div>
  );
}

function List({ field: f, value, onChange, errors, path }: Many<Value>) {
  const [open, setOpen] = useState<number | null>(null);
  const of = f.of!;
  const row = of.length === 2 && of.every((x) => x.type === "text" || x.type === "url");
  const fixed = f.minItems === f.maxItems;
  const set = (i: number, key: string, v: unknown) => onChange(value.map((x, n) => (n === i ? { ...x, [key]: v } : x)));
  const tools = (i: number) =>
    !fixed && (
      <Tools
        i={i}
        n={value.length}
        min={f.minItems ?? 0}
        what={`${f.item} ${i + 1}`}
        onMove={(to) => {
          onChange(move(value, i, to));
          setOpen((o) => (o === i ? to : o === to ? i : o));
        }}
        onRemove={() => {
          const title = String(value[i][of[0].key] || `${f.item} ${i + 1}`);
          if (!row && !window.confirm(`Delete “${title}”?`)) return;
          onChange(value.filter((_, n) => n !== i));
          setOpen(null);
        }}
      />
    );
  return (
    <div>
      <ul className={row ? "space-y-3" : "divide-y divide-(--rule) overflow-hidden rounded-[0.9rem] border border-(--rule)"}>
        {value.map((item, i) => {
          const at = `${path}.${i}`;
          const bad = under(errors, at);
          if (row)
            return (
              <li key={i} className="flex items-end gap-2 max-sm:flex-col">
                <div className="grid w-full flex-1 gap-2 sm:grid-cols-2">
                  {of.map((x) => (
                    <FieldInput
                      key={x.key}
                      field={i ? { ...x, hint: undefined } : x}
                      value={item[x.key]}
                      onChange={(v) => set(i, x.key, v)}
                      errors={errors}
                      path={`${at}.${x.key}`}
                    />
                  ))}
                </div>
                {tools(i)}
              </li>
            );
          const title = String(item[of[0].key] || `New ${f.item?.toLowerCase()}`);
          return (
            <li key={i} className={open === i ? "bg-foam/60" : ""}>
              <div className="flex items-center gap-2 py-1 pl-4 pr-2">
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left text-[0.9375rem]"
                >
                  <Icon name="arrow" className={`size-4 text-(--accent) transition-[rotate] duration-200 ${open === i ? "rotate-90" : ""}`} />
                  <span className="truncate">{title}</span>
                  {bad && <span className="shrink-0 text-[0.8125rem] text-[#a52a2a]">Needs another look</span>}
                </button>
                {tools(i)}
              </div>
              {open === i && (
                <div className="space-y-5 px-4 pb-6 pt-2">
                  {of.map((x) => (
                    <FieldInput key={x.key} field={x} value={item[x.key]} onChange={(v) => set(i, x.key, v)} errors={errors} path={`${at}.${x.key}`} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!fixed && (
        <Add
          label={`Add ${/^[aeiou]/i.test(f.item ?? "") ? "an" : "a"} ${f.item?.toLowerCase()}`}
          off={value.length >= (f.maxItems ?? 50)}
          onClick={() => {
            onChange([...value, blankItem(f)]);
            setOpen(value.length);
          }}
        />
      )}
    </div>
  );
}
