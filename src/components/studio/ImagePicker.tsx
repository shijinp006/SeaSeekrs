"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import { altIssue } from "@/lib/studio/seo";
import { useMedia } from "./media";

import { Icon, ICON_BTN, INPUT, LINE } from "./ui";

// the library of pictures is loaded when it is first opened
export const Picker = dynamic(() => import("./Picker"), { ssr: false });

const DARK = "bg-[#07333b]"; // icons are white

export function ImageField({
  value,
  onChange,
  optional,
  dark,
  invalid,
}: {
  value: string;
  onChange: (path: string) => void;
  optional?: boolean;
  dark?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const media = useMedia();
  const known = value ? media?.of(value) : undefined;
  const alt = media?.typed[value] ?? known?.alt ?? "";
  const issue = altIssue(alt);
  return (
    <div className="w-full">
      <div className={`flex w-full flex-wrap items-center gap-4 rounded-[0.7rem] ${invalid ? "outline-2 outline-[#a52a2a]" : ""}`}>
        <span className={`relative block h-20 w-32 shrink-0 overflow-hidden rounded-[0.7rem] ${dark ? DARK : "bg-ink/8"}`}>
          {value && <Image src={value} alt="" fill sizes="8rem" className={dark ? "object-contain p-3" : "object-cover"} />}
        </span>
        <button type="button" className={LINE} onClick={() => setOpen(true)}>
          <Icon name="upload" className="size-4" /> {value ? "Replace photo" : "Upload photo"}
        </button>
        {optional && value && (
          <button type="button" className={ICON_BTN} aria-label="Remove the picture" onClick={() => onChange("")}>
            <Icon name="trash" className="size-4" />
          </button>
        )}
      </div>
      {media && known && !known.decorative && !dark && (
        <label className="mt-2.5 block text-[0.8125rem] text-(--mute)">
          Alt text: what the picture shows, for Google and screen readers
          <input value={alt} onChange={(e) => media.type(value, e.target.value)} className={`${INPUT} mt-1`} />
          <span className={`mt-1 block ${issue ? "text-[#7a4d00]" : "text-[#12633a]"}`}>{issue ?? "Good"}</span>
        </label>
      )}
      {open && (
        <Picker
          onClose={() => setOpen(false)}
          onPick={(m) => {
            media?.add(m);
            onChange(m.path);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
