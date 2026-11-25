import Image from "next/image";
import type { ReactNode } from "react";

// The small part of Markdown that blog posts use, turned into React elements: no HTML from the text ever reaches the page.
// # to ###### heading (H1 to H6) · - list · 1. list · > quote · ![alt](/media/…) · **bold** · *italic* · [text](link)

const SAFE = /^(https?:\/\/|mailto:|tel:|\/(?![/\\])|#)/i;
const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^()\s]+)\)/g;

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    last = m.index + m[0].length;
    const [whole, bold, italic, label, href] = m;
    if (bold) out.push(<strong key={m.index}>{inline(bold)}</strong>);
    else if (italic) out.push(<em key={m.index}>{inline(italic)}</em>);
    else if (SAFE.test(href)) {
      const away = /^https?:/i.test(href);
      out.push(
        <a key={m.index} href={href} {...(away && { target: "_blank", rel: "noopener noreferrer" })}>
          {label}
        </a>,
      );
    } else out.push(whole);
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const PICTURE = /^!\[([^\]]*)\]\((\/(?:site|media)\/[a-z0-9-]+\.webp)\)$/;

function block(text: string, key: number): ReactNode {
  const lines = text.split("\n");
  const heading = lines.length === 1 && /^(#{1,6}) (.+)$/.exec(text);
  if (heading) {
    const H = `h${heading[1].length}` as "h2";
    return <H key={key}>{inline(heading[2])}</H>;
  }
  const picture = PICTURE.exec(text);
  if (picture) return <Image key={key} src={picture[2]} alt={picture[1]} width={1600} height={1000} sizes="(min-width: 768px) 46rem, 100vw" />;
  if (lines.every((l) => /^[-*] /.test(l))) return <ul key={key}>{lines.map((l, i) => <li key={i}>{inline(l.slice(2))}</li>)}</ul>;
  if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\. /, ""))}</li>)}</ol>;
  if (lines.every((l) => /^> ?/.test(l))) return <blockquote key={key}>{inline(lines.map((l) => l.replace(/^> ?/, "")).join(" "))}</blockquote>;
  return <p key={key}>{lines.flatMap((l, i) => (i ? [<br key={`br${i}`} />, ...inline(l)] : inline(l)))}</p>;
}

export default function Markdown({ text }: { text: string }) {
  // a heading or picture is a block of its own even without an empty line around it
  const blocks = text
    .replace(/\r\n?/g, "\n")
    .replace(/^(#{1,6} .+|!\[.*)$/gm, "\n\n$1\n\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return <div className="prose-sea">{blocks.map(block)}</div>;
}
