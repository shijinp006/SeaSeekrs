type Look = { title: string; highlight?: string; tag?: string; size?: string };

const SCALE: Record<string, number> = { xs: 0.7, sm: 0.85, lg: 1.15, xl: 1.3 };

/** Only the size, for headings that are put together differently: the .t-* sizes are multiplied by it (globals.css) */
export const headingStyle = (size?: string) => (size && SCALE[size] ? ({ "--h-scale": SCALE[size] } as React.CSSProperties) : undefined);

type AnyTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";

/** A text or a name in a list, with the tag chosen for it in the SEO studio */
export function Tagged({ tag, as, ...rest }: { tag: string; as: AnyTag } & React.HTMLAttributes<HTMLElement>) {
  const Tag = (tag || as) as AnyTag;
  return <Tag {...rest} />;
}

/** A heading as it was edited in the SEO studio: its lines, the highlighted words, its tag and its size */
export default function Title({ heading, as, ...rest }: { heading: Look; as: "h1" | "h2" } & React.HTMLAttributes<HTMLHeadingElement>) {
  const Tag = (heading.tag || as) as AnyTag;
  return (
    <Tag {...rest} style={headingStyle(heading.size)}>
      {heading.title.split("\n").map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}{" "}
        </span>
      ))}
      {heading.highlight && (
        <>
          {" "}
          <em className="heading-mark">{heading.highlight}</em>
        </>
      )}
    </Tag>
  );
}
