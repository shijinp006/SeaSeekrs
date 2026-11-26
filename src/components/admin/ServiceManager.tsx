"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { blankItem, FieldInput, type Errors, type Value } from "@/components/studio/Fields";
import { useMedia } from "@/components/studio/media";
import Pager from "@/components/studio/Pager";
import { Badge, CARD, GOLD, Icon, ICON_BTN, INPUT, LINE, Modal, NAVY, Note } from "@/components/studio/ui";
import { send } from "@/lib/studio/client";
import type { Field } from "@/lib/studio/fields";

// The admin's list of services: a table to find, order and delete them, and a form in a window to add or change one.
// Every change is put on the website at once (the admin's PUT publishes the whole list).

const KEY = "services.items";
const PER_PAGE = 6; // the same as the search API
const WAIT = 350; // ms after the last key press before searching
const TIMEOUT = 8000; // ms before a search is given up

type Row = { index: number; item: Value };
type Found = { key: string; rows: Row[]; total: number; all: number; page: number; pages: number };

/** The value, once it has stopped changing for `ms` */
function useDebounced<T>(value: T, ms: number) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  },
});
const NAVY_BG = "var(--color-navy-deep)";
const RED = "#a52a2a";

/** yacht-rental from "Yacht Rental!" */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** The pictures of one service whose alt text was typed in the form and not saved yet */
const photosOf = (item: Value) => [...new Set((item.photos as string[]).filter(Boolean))];

type Editing = { index: number; item: Value; isNew: boolean; slugTouched: boolean };

export default function ServiceManager({ fields, initial }: { fields: Field[]; initial: Value }) {
  const router = useRouter();
  const media = useMedia();
  const list = fields.find((f) => f.key === "items")!;
  const of = list.of!;
  const [value, setValue] = useState(initial);
  const items = value.items as Value[];
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  // ── search, on the server ─────────────────────────────────────────────────
  // Typing waits until the keys stop (debounce); a newer search aborts the one still on its way, and a search that
  // takes longer than TIMEOUT is given up. `version` asks again after a change was saved.
  const [version, setVersion] = useState(0);
  const [found, setFound] = useState<Found | null>(null);
  const [searchError, setSearchError] = useState<{ key: string; text: string } | null>(null);
  const q = useDebounced(query.trim(), WAIT);
  const asking = `${q}|${page}|${version}`;

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(TIMEOUT)]);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    (async () => {
      try {
        const response = await fetch(`/api/studio/services?${params}`, { signal });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.error ?? "Search failed");
        setFound({ key: asking, ...json });
        setSearchError(null);
      } catch (error) {
        if (controller.signal.aborted) return; // a newer search took over: nothing to show
        const timedOut = error instanceof DOMException && error.name === "TimeoutError";
        setSearchError({ key: asking, text: timedOut ? "The search took too long. Try again." : error instanceof Error ? error.message : "Search failed" });
      }
    })();
    return () => controller.abort();
  }, [q, page, version, asking]);

  const typing = query.trim() !== q;
  const loading = typing || (found?.key !== asking && searchError?.key !== asking);
  const failed = searchError?.key === asking ? searchError.text : "";
  const rows = found?.rows ?? [];
  const shown = found?.page ?? 1;
  const pages = found?.pages ?? 1;
  const from = (shown - 1) * PER_PAGE;
  const searching = q !== "";

  /** Puts the list on the website; the answer of the server, for the caller to show */
  const publish = async (next: Value[]) => {
    const r = await send("PUT", `/api/studio/entries/${KEY}`, { ...value, items: next });
    if (r.ok) {
      setValue((v) => ({ ...v, items: next }));
      setVersion((n) => n + 1); // the list on the screen is asked for again
      router.refresh();
    }
    return r;
  };

  const fail = (error: string) => Swal.fire({ icon: "error", title: "Not saved", text: error, confirmButtonColor: NAVY_BG });

  // ── add and change ────────────────────────────────────────────────────────

  const open = (index: number | null) => {
    setErrors({});
    setProblem("");
    setEditing(
      index === null
        ? { index: items.length, item: blankItem(list), isNew: true, slugTouched: false }
        : { index, item: structuredClone(items[index]), isNew: false, slugTouched: true },
    );
  };

  const changed = editing !== null && JSON.stringify(editing.item) !== JSON.stringify(editing.isNew ? blankItem(list) : items[editing.index]);

  const close = () => {
    if (busy) return;
    // a SweetAlert would open behind the window, so the browser's own question is used here
    if (changed && !window.confirm("Close without saving? Your changes to this service will be lost.")) return;
    setEditing(null);
  };

  const setField = (key: string, v: unknown) =>
    setEditing((e) => {
      if (!e) return e;
      const item = { ...e.item, [key]: v };
      // a new service gets its address from its name, until the address is typed by hand
      if (key === "title" && e.isNew && !e.slugTouched) item.slug = slugify(String(v));
      return { ...e, item, slugTouched: e.slugTouched || key === "slug" };
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { index, item, isNew } = editing;
    const slug = String(item.slug ?? "");
    if (items.some((other, i) => i !== index && other.slug === slug)) {
      setErrors({ [`items.${index}.slug`]: "Another service has this address" });
      setProblem("Some fields need another look");
      return;
    }
    setBusy(true);
    const next = isNew ? [...items, item] : items.map((x, i) => (i === index ? item : x));
    const r = await publish(next);
    if (!r.ok) {
      setBusy(false);
      setErrors(r.fields ?? {});
      setProblem(r.error);
      return;
    }
    // alt text typed under the photos of this service
    const alts = media ? photosOf(item).filter((p) => media.typed[p] !== undefined && media.of(p) && media.typed[p].trim() !== media.of(p)!.alt) : [];
    for (const p of alts) await send("PATCH", `/api/studio/media/${media!.of(p)!.id}`, { alt: media!.typed[p] });
    if (alts.length) media!.forget(alts);
    setBusy(false);
    setEditing(null);
    if (isNew) {
      setQuery("");
      setPage(Math.ceil(next.length / PER_PAGE)); // where the new one is
    }
    toast.fire({ icon: "success", title: isNew ? `“${item.title}” added` : `“${item.title}” updated`, text: "It is on the website now." });
  };

  // ── delete and order ──────────────────────────────────────────────────────

  const remove = async (index: number) => {
    const name = String(items[index].title || "this service");
    const answer = await Swal.fire({
      icon: "warning",
      title: "Delete this service?",
      text: `“${name}” and its page will be removed from the website. Old links to it will stop working.`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: RED,
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        const r = await publish(items.filter((_, i) => i !== index));
        if (!r.ok) Swal.showValidationMessage(r.error);
        return r.ok;
      },
    });
    if (answer.isConfirmed) toast.fire({ icon: "success", title: `“${name}” deleted` });
  };

  const moveTo = async (index: number, to: number) => {
    const next = [...items];
    next.splice(to, 0, ...next.splice(index, 1));
    setBusy(true);
    const r = await publish(next);
    setBusy(false);
    if (!r.ok) return fail(r.error);
    if (Math.floor(to / PER_PAGE) + 1 !== shown) setPage(Math.floor(to / PER_PAGE) + 1); // follow it to the next page
    toast.fire({ icon: "success", title: "Order saved" });
  };

  // ── view ──────────────────────────────────────────────────────────────────

  const at = editing ? `items.${editing.index}` : "";
  const half = (f: Field) => f.key === "title" || f.key === "slug" || f.key === "yacht";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-(--mute)" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, address or summary"
            aria-label="Search services"
            className={`${INPUT} pl-10! pr-10!`}
          />
          {loading && (
            <span
              role="status"
              aria-label="Searching"
              className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-(--rule) border-t-(--accent)"
            />
          )}
        </div>
        <button type="button" className={`${GOLD} max-sm:w-full`} onClick={() => open(null)} disabled={items.length >= (list.maxItems ?? 50)}>
          <Icon name="plus" className="size-4" /> Add a service
        </button>
      </div>

      <div className={`${CARD} overflow-hidden transition-opacity ${loading && found ? "opacity-60" : ""}`} aria-busy={loading}>
        {failed ? (
          <div className="flex flex-wrap items-center justify-center gap-3 p-8 text-center">
            <Note text={failed} bad />
            <button type="button" className={LINE} onClick={() => setVersion((n) => n + 1)}>
              <Icon name="refresh" className="size-4" /> Try again
            </button>
          </div>
        ) : !found ? (
          <ul className="divide-y divide-(--rule)" aria-hidden>
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3.5">
                <span className="h-16 w-24 animate-pulse rounded-[0.6rem] bg-foam" />
                <span className="flex-1 space-y-2">
                  <span className="block h-4 w-1/3 animate-pulse rounded bg-foam" />
                  <span className="block h-3 w-2/3 animate-pulse rounded bg-foam" />
                </span>
              </li>
            ))}
          </ul>
        ) : rows.length ? (
          <ul className="divide-y divide-(--rule)">
            {rows.map(({ item, index }) => {
              const photo = (item.photos as string[])[0];
              // phones: picture and text on top, the buttons in a row of their own below; from sm on, one line
              const labelled = "max-sm:flex max-sm:w-auto max-sm:gap-1.5 max-sm:border max-sm:border-(--rule) max-sm:px-3 max-sm:text-[0.8125rem] max-sm:font-medium";
              return (
                <li
                  key={`${index}-${item.slug}`}
                  className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 px-4 py-4 transition-colors hover:bg-foam/60 sm:flex sm:items-center sm:gap-4 sm:px-5 sm:py-3.5"
                >
                  <span className="hidden w-7 shrink-0 text-center text-[0.8125rem] tabular-nums text-(--mute) sm:block">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => open(index)}
                    className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[0.6rem] bg-foam focus-visible:outline-2 focus-visible:outline-(--accent) sm:w-24"
                    aria-label={`Edit ${item.title}`}
                  >
                    {photo ? (
                      <Image src={photo} alt="" fill sizes="96px" className="object-cover" />
                    ) : (
                      <Icon name="image" className="absolute inset-0 m-auto size-5 text-(--mute)" />
                    )}
                    <span className="absolute left-1 top-1 rounded-full bg-navy-deep/75 px-1.5 text-[0.6875rem] tabular-nums text-white sm:hidden">{index + 1}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-2">
                      <button type="button" onClick={() => open(index)} className="min-w-0 truncate text-left font-medium hover:text-(--accent)">
                        {String(item.title) || "Untitled service"}
                      </button>
                      {item.yacht ? (
                        <span className="shrink-0 whitespace-nowrap">
                          <Badge tone="calm">{String(item.yacht)}</Badge>
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[0.875rem] leading-snug text-(--mute) sm:line-clamp-1">{String(item.summary)}</p>
                    <a
                      href={`/services/${item.slug}`}
                      target="_blank"
                      className="mt-0.5 flex max-w-full items-center gap-1 text-[0.8125rem] text-(--accent) underline-offset-4 hover:underline"
                    >
                      <span className="truncate">/services/{String(item.slug)}</span> <Icon name="link" className="size-3 shrink-0" />
                    </a>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 border-t border-(--rule) pt-3 sm:shrink-0 sm:gap-0.5 sm:border-0 sm:pt-0">
                    {!searching && (
                      <>
                        <button type="button" className={ICON_BTN} disabled={busy || index === 0} onClick={() => moveTo(index, index - 1)} aria-label={`Move ${item.title} up`} title="Move up">
                          <Icon name="up" className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={ICON_BTN}
                          disabled={busy || index === items.length - 1}
                          onClick={() => moveTo(index, index + 1)}
                          aria-label={`Move ${item.title} down`}
                          title="Move down"
                        >
                          <Icon name="down" className="size-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={`${ICON_BTN} ${labelled} max-sm:ml-auto max-sm:text-ink`}
                      onClick={() => open(index)}
                      aria-label={`Edit ${item.title}`}
                      title="Edit"
                    >
                      <Icon name="pen" className="size-4" />
                      <span className="sm:hidden">Edit</span>
                    </button>
                    <button
                      type="button"
                      className={`${ICON_BTN} ${labelled} max-sm:border-[#a52a2a]/30 max-sm:text-[#a52a2a] hover:bg-[#a52a2a]/10! hover:text-[#a52a2a]!`}
                      disabled={busy || items.length <= (list.minItems ?? 0)}
                      onClick={() => remove(index)}
                      aria-label={`Delete ${item.title}`}
                      title="Delete"
                    >
                      <Icon name="trash" className="size-4" />
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-8 text-center text-(--mute)">{searching ? "No service matches your search." : "No services yet."}</p>
        )}
      </div>

      {found && !failed && (
        <Pager
          page={shown}
          pages={pages}
          onPage={setPage}
          label="Pages of services"
          summary={found.total ? `${from + 1}–${from + rows.length} of ${found.total} services${searching ? ` found (${found.all} in all)` : ""}` : undefined}
        />
      )}

      {editing && (
        <Modal wide title={editing.isNew ? "Add a service" : `Edit “${String(items[editing.index].title)}”`} onClose={close}>
          <form onSubmit={save} className="space-y-6">
            <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
              {of.map((f) => (
                <div key={f.key} className={half(f) ? "" : "sm:col-span-2"}>
                  <FieldInput field={f} value={editing.item[f.key]} onChange={(v) => setField(f.key, v)} errors={errors} path={`${at}.${f.key}`} />
                </div>
              ))}
            </div>
            <div className="sticky -bottom-6 -mx-6 -mb-6 flex flex-wrap items-center gap-3 border-t border-(--rule) bg-white px-6 py-4">
              <Note text={problem} bad />
              <button type="button" className={`${LINE} ml-auto`} onClick={close} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className={NAVY} disabled={busy || (!editing.isNew && !changed)}>
                {busy ? "Saving…" : editing.isNew ? "Add service" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
