"use client";

import { createContext, use, useMemo, useState } from "react";
import type { MediaItem } from "@/lib/studio/client";

export type Alt = { id: string; alt: string; decorative: boolean };

type Media = {
  /** what is known of a picture, by its path */
  of: (path: string) => Alt | undefined;
  add: (item: MediaItem) => void;
  /** alt texts typed here and not saved yet, by path */
  typed: Record<string, string>;
  type: (path: string, alt: string) => void;
  forget: (paths: string[]) => void;
};

const Context = createContext<Media | null>(null);

/** The pictures of the website, for the alt text under each picture of a section */
export function MediaProvider({ media, children }: { media: Record<string, Alt>; children: React.ReactNode }) {
  const [added, setAdded] = useState<Record<string, Alt>>({});
  const [typed, setTyped] = useState<Record<string, string>>({});
  const value = useMemo<Media>(
    () => ({
      of: (path) => media[path] ?? added[path],
      add: (m) => setAdded((old) => ({ ...old, [m.path]: { id: m.id, alt: m.draftAlt ?? m.alt, decorative: m.decorative } })),
      typed,
      type: (path, alt) => setTyped((old) => ({ ...old, [path]: alt })),
      forget: (paths) => setTyped((old) => Object.fromEntries(Object.entries(old).filter(([p]) => !paths.includes(p)))),
    }),
    [media, added, typed],
  );
  return <Context value={value}>{children}</Context>;
}

/** Null where there is no provider: alt text is then edited on its own page only */
export const useMedia = () => use(Context);
