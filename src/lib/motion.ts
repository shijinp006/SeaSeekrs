/** Pill buttons: lift and a soft shadow on hover, settle when pressed */
export const BTN =
  "inline-block cursor-pointer rounded-full text-[0.9rem] font-medium transition-[translate,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-14px_rgba(4,22,30,0.6)] active:translate-y-0 active:shadow-none";

/** The main action, in the yellow of the cushions on board */
export const BTN_GOLD = `${BTN} bg-gold px-7 py-3.5 text-ink hover:bg-[#ffc94f]`;

/** Text links whose line draws itself back on hover */
export const LINK =
  "inline-block cursor-pointer bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-[position:0%_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 hover:bg-[length:0%_1px]";

/** How a piece of the page comes in as it is scrolled to: <div data-aos="fade-up" data-aos-delay="120"> (see MotionRoot) */
export type Aos = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in";
