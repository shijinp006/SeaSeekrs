const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const Arrow = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...line}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const Check = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...line}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** Round arrow in the corner of a picture card; fills with gold when its card is hovered */
export const CardArrow = () => (
  <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/50 text-white transition-[background-color,border-color,color] duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ink group-focus-visible:border-gold group-focus-visible:bg-gold group-focus-visible:text-ink">
    <Arrow className="size-5 -rotate-45 transition-[rotate] duration-500 group-hover:rotate-0" />
  </span>
);
