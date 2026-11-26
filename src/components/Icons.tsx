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
  <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/50 text-white transition-[background-color,border-color,color] duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ink group-focus-visible:border-gold group-focus-visible:bg-gold group-focus-visible:text-ink">
    <Arrow className="size-5 -rotate-45 transition-[rotate] duration-500 group-hover:rotate-0" />
  </span>
);

/** Small line icons for the links of the menu, chosen by where a link goes (or what it is called) */
const MENU_ICONS: [RegExp, React.ReactNode][] = [
  // about: a compass
  [/about/i, <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" /></>],
  // services: an anchor
  [/service/i, <><circle cx="12" cy="5.5" r="2" /><path d="M12 7.5V20M8 10.5h8M5 13a7 7 0 0 0 14 0" /></>],
  // tours: a map pin
  [/tour/i, <><path d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.9 6.5 11 6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>],
  // yachts: a boat
  [/yacht|boat|fleet/i, <><path d="M12 3v11M12 4l5.5 9H12M3.5 16h17l-2 3.5H5.5z" /></>],
  // reviews: a star
  [/review/i, <path key="star" d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />],
  // questions: a question in a circle
  [/faq|question/i, <><circle cx="12" cy="12" r="8.5" /><path d="M9.8 9.6a2.3 2.3 0 1 1 3.4 2c-.8.4-1.2 1-1.2 1.9M12 16.6v.1" /></>],
  // contact: a phone
  [/contact|call|phone/i, <path key="phone" d="M6.5 3.5h3l1.5 4-2 1.3a10.5 10.5 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />],
];

export const MenuIcon = ({ link, className = "size-6" }: { link: { href: string; label: string }; className?: string }) => {
  const found = MENU_ICONS.find(([test]) => test.test(link.href) || test.test(link.label));
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line}>
      {found ? found[1] : <path d="M4 12h16M14 6l6 6-6 6" />}
    </svg>
  );
};
