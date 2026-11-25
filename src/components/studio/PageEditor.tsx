"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Page } from "@/lib/studio/fields";
import { MediaProvider, type Alt } from "./media";
import type { Device, Look } from "./Preview";
import SectionForm, { type SectionState } from "./SectionForm";
import { CARD, Icon, ICON_BTN, LABEL, LINE, NAVY } from "./ui";

// loaded when it is first shown
const Preview = dynamic(() => import("./Preview"), { ssr: false });

const WIDE = "(min-width: 1080px)"; // room for the preview beside the form
const watchWide = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const useWide = () =>
  useSyncExternalStore(
    watchWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );

/** Its content is put together when it comes near the screen, and stays from then on */
function Lazy({ id, now, children }: { id: string; now: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "700px 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} id={id} className="scroll-mt-36 lg:scroll-mt-56">
      {near || now ? children : <div className={`${CARD} min-h-[28rem]`} aria-busy />}
    </div>
  );
}

export default function PageEditor({
  page,
  states,
  media,
  url,
  title,
}: {
  page: Page;
  states: Record<string, SectionState>;
  media: Record<string, Alt>;
  url: string;
  title: string;
}) {
  const wide = useWide();
  const [device, setDevice] = useState<Device | null>("phone"); // null: no preview beside the form
  const [drawer, setDrawer] = useState(false); // on smaller screens the preview lies over the form
  const [look, setLook] = useState<Look>({ anchor: page.sections.find((s) => s.anchor)?.anchor ?? "", version: 0 });
  const [jump, setJump] = useState<string | null>(null); // a section asked for: every card is needed to know where it is
  const asked = useRef<string | null>(null);

  const go = (key: string) => {
    asked.current = key;
    setJump(key);
    const anchor = page.sections.find((s) => s.key === key)?.anchor;
    if (anchor) setLook((l) => ({ ...l, anchor }));
    if (jump) document.getElementById(key)?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (jump && asked.current === jump) document.getElementById(jump)?.scrollIntoView({ behavior: "smooth" });
  }, [jump]);

  const saved = useCallback((anchor: string | undefined) => setLook((l) => ({ anchor: anchor ?? l.anchor, version: l.version + 1 })), []);

  const beside = wide && device !== null;
  const pick = (d: Device | null) => {
    setDevice(d);
    setDrawer(d !== null);
  };
  const toggles: { d: Device | null; icon: "phone" | "screen" | "eyeoff"; label: string }[] = [
    { d: "phone", icon: "phone", label: "Phone preview" },
    { d: "desktop", icon: "screen", label: "Desktop preview" },
    { d: null, icon: "eyeoff", label: "Hide the preview" },
  ];
  const on = (d: Device | null) => (wide || drawer ? device === d : d === null);

  return (
    <MediaProvider media={media}>
      <div className="z-10 -mx-4 lg:sticky lg:top-16 -mt-8 border-b border-(--rule) bg-foam px-4 pb-3 pt-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={LABEL}>Page</p>
            <h1 className="display mt-1 text-[1.9rem]">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Preview" className="flex overflow-hidden rounded-[0.6rem] border border-(--rule) bg-white">
              {toggles.map((t) => (
                <button
                  key={t.icon}
                  type="button"
                  aria-label={t.label}
                  title={t.label}
                  aria-pressed={on(t.d)}
                  onClick={() => pick(t.d)}
                  className={`grid h-10 w-11 place-items-center outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-(--accent) ${
                    on(t.d) ? "bg-navy-deep text-white" : "text-(--mute) hover:bg-foam"
                  }`}
                >
                  <Icon name={t.icon} />
                </button>
              ))}
            </div>
            <a href={page.path} target="_blank" className={LINE}>
              <span className="max-sm:sr-only">Open page</span> <Icon name="link" className="size-4" />
            </a>
          </div>
        </div>
        <nav aria-label="Sections" className="mt-4 flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:thin]">
          {page.sections.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(s.key)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-(--rule) bg-white px-4 py-1.5 text-[0.8125rem] font-medium transition-colors hover:border-(--accent) hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent)"
            >
              {s.seo && <Icon name="search" className="size-3.5" />}
              {s.label}
              {states[s.key].draft && <span title="Draft" className="size-1.5 rounded-full bg-gold" />}
            </button>
          ))}
        </nav>
      </div>

      <div
        className={`mt-7 grid items-start gap-6 xl:gap-8 ${
          beside ? (device === "phone" ? "grid-cols-[minmax(0,1fr)_clamp(17rem,25vw,23rem)]" : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]") : "grid-cols-1"
        }`}
      >
        <div className="min-w-0 space-y-7">
          {page.sections.map((s, i) => (
            <Lazy key={s.key} id={s.key} now={i < 2 || jump !== null}>
              <SectionForm
                section={s}
                state={states[s.key]}
                number={s.seo ? undefined : page.sections.slice(0, i + 1).filter((x) => !x.seo).length}
                url={url}
                onSaved={() => saved(s.anchor)}
              />
            </Lazy>
          ))}
        </div>
        {beside && (
          <aside className="sticky top-60 h-[calc(100svh-16.5rem)] min-h-[26rem]">
            <Preview path={page.path} device={device} look={look} />
          </aside>
        )}
      </div>

      {!beside && !drawer && (
        <button
          type="button"
          onClick={() => pick(device ?? "phone")}
          className={`${NAVY} fixed bottom-5 right-5 z-30 shadow-[0_16px_28px_-12px_rgba(4,22,30,0.6)]`}
        >
          <Icon name="eye" /> Preview
        </button>
      )}
      {!wide && drawer && device && (
        <div className="fixed inset-0 z-40 flex justify-end bg-navy-deep/60" onClick={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <div className="flex h-full w-full max-w-lg flex-col gap-2 bg-foam p-4">
            <button type="button" aria-label="Close the preview" className={`${ICON_BTN} self-end`} onClick={() => setDrawer(false)}>
              <Icon name="close" />
            </button>
            <div className="min-h-0 flex-1">
              <Preview path={page.path} device={device} look={look} />
            </div>
          </div>
        </div>
      )}
    </MediaProvider>
  );
}
