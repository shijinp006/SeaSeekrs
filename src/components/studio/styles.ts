// Class names of the studio's buttons, cards and fields

const focus = "outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--accent)";
const btn = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[0.875rem] font-medium transition-colors disabled:opacity-45 ${focus}`;
export const GOLD = `${btn} bg-gold px-5 py-2.5 text-ink hover:bg-[#ffc94f]`;
export const NAVY = `${btn} bg-navy-deep px-6 py-2.5 text-white hover:bg-[#0d4a55]`;
export const LINE = `${btn} border border-(--rule) bg-white px-4 py-2 text-ink hover:border-(--accent) hover:text-(--accent)`;
export const PLAIN = `${btn} px-3 py-2 text-(--mute) hover:bg-ink/5 hover:text-ink`;
export const DANGER = `${btn} border border-[#a52a2a]/30 bg-white px-4 py-2 text-[#a52a2a] hover:bg-[#a52a2a] hover:text-white`;
export const ICON_BTN = `grid size-9 shrink-0 place-items-center rounded-full text-(--mute) transition-colors hover:bg-ink/8 hover:text-ink disabled:opacity-30 ${focus}`;
export const CARD = "rounded-[1.1rem] border border-(--rule) bg-white";
export const LABEL = "text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-(--mute)";
export const INPUT =
  "w-full rounded-[0.7rem] border border-[#06222b40] bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#4a646b99] focus:border-(--accent) focus:shadow-[0_0_0_3px_#08757a26] aria-invalid:border-[#a52a2a]";
