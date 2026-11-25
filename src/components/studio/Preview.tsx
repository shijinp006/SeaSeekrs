"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { send } from "@/lib/studio/client";
import { Icon, LABEL } from "./ui";

export type Device = "phone" | "desktop";
/** Where to look; a new `version` loads the page again */
export type Look = { anchor: string; version: number };

const WIDTH = { phone: 390, desktop: 1280 };

// One after another, so that the last one asked for is the one that counts
let last: Promise<unknown> = Promise.resolve();
function turn(method: "POST" | "DELETE") {
  const next = last.then(() => send(method, "/api/studio/preview"));
  last = next;
  return next;
}
const turnOn = () => turn("POST");
const turnOff = () => turn("DELETE");

/** The website with the saved drafts, in a frame the size of a phone or a desktop screen */
export default function Preview({ path, device, look }: { path: string; device: Device; look: Look }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const shown = useRef(look);

  // Drafts are shown while preview is on for this browser. It is on only while the frame loads: everywhere else, the
  // website stays the cached, published one.
  useEffect(() => {
    let gone = false;
    turnOn().then((r) => {
      if (gone) return;
      if (r.ok) setSrc(path);
      else setError(r.error);
    });
    return () => {
      gone = true;
      turnOff();
    };
  }, [path]);

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Never by the address (#faq): a browser would scroll the studio around the frame along with it
  const showSection = useCallback((anchor: string) => {
    const win = frame.current?.contentWindow;
    const doc = frame.current?.contentDocument;
    const el = doc?.getElementById(anchor);
    if (!win || !doc || !el) return;
    if (!doc.documentElement.classList.contains("lenis")) return win.scrollTo(0, el.getBoundingClientRect().top + win.scrollY);
    // a click on a link of the page itself: its own smooth scrolling knows where a section begins
    const a = doc.createElement("a");
    a.href = `#${anchor}`;
    doc.body.append(a);
    a.click();
    a.remove();
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const r = await turnOn();
    setError(r.ok ? "" : r.error);
    const win = frame.current?.contentWindow;
    if (!r.ok || !win) return setLoading(false);
    // back to the page being edited, should a link in the preview have led away
    if (win.location.pathname === path) win.location.reload();
    else win.location.assign(path);
  }, [path]);

  const settle = useRef(0);
  const loaded = () => {
    setLoading(false);
    turnOff();
    window.clearTimeout(settle.current);
    // once the page has set up its scrolling
    if (shown.current.anchor !== "top") settle.current = window.setTimeout(() => showSection(shown.current.anchor), 700);
  };
  useEffect(() => () => window.clearTimeout(settle.current), []);

  useEffect(() => {
    const before = shown.current;
    shown.current = look;
    if (look === before) return;
    if (look.version !== before.version) reload();
    else showSection(look.anchor);
  }, [look, reload, showSection]);

  const scale = size.w / WIDTH[device] || 1;
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className={`${LABEL} flex items-center gap-2`}>
          <Icon name="eye" className="size-4" /> Preview (saved changes)
        </p>
        <button type="button" onClick={reload} className="text-[0.8125rem] text-(--accent) underline-offset-4 hover:underline">
          Reload
        </button>
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden rounded-[0.9rem] border border-(--rule) bg-navy-deep">
        {src && (
          <iframe
            ref={frame}
            src={src}
            title="Preview of the page with the saved changes"
            loading="lazy"
            onLoad={loaded}
            className="absolute left-0 top-0 origin-top-left border-0"
            style={{ width: WIDTH[device], height: size.h / scale, transform: `scale(${scale})` }}
          />
        )}
        {(loading || error) && (
          <p role="status" className="absolute inset-0 grid place-items-center bg-navy-deep p-6 text-center text-[0.875rem] text-white/75">
            {error || "Loading the preview…"}
          </p>
        )}
      </div>
    </div>
  );
}
