import { whatsapp } from "@/lib/links";
import type { Site } from "@/lib/server/site";

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

const fill = { fill: "currentColor" } as const;

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-6" {...fill}>
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.17-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.07.9.92-2.99-.2-.31a8.2 8.2 0 1 1 6.83 3.73Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-1.98-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5l.37-.43c.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44l-.76-1.83c-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.65.3 2.74 2.74 0 0 0-.85 2.04 4.76 4.76 0 0 0 1 2.53 10.9 10.9 0 0 0 4.17 3.68c.58.25 1.04.4 1.39.52.58.18 1.12.16 1.54.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.17-.47-.29Z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-6" {...fill}>
    <path d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm6.1-8.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.3 8.1c-.07-1.5-.4-2.83-1.5-3.92S17.4 2.77 15.9 2.7c-1.55-.09-6.2-.09-7.75 0-1.5.07-2.83.41-3.93 1.5S2.78 6.6 2.7 8.1c-.09 1.55-.09 6.2 0 7.75.07 1.5.41 2.83 1.51 3.92s2.42 1.43 3.93 1.5c1.55.09 6.2.09 7.75 0 1.5-.07 2.83-.4 3.92-1.5 1.1-1.09 1.43-2.42 1.5-3.92.09-1.55.09-6.2 0-7.75Zm-2 9.4a3.2 3.2 0 0 1-1.8 1.8c-1.25.5-4.22.38-5.5.38s-4.26.11-5.5-.38a3.2 3.2 0 0 1-1.8-1.8c-.5-1.25-.38-4.22-.38-5.5s-.11-4.26.38-5.5a3.2 3.2 0 0 1 1.8-1.8c1.25-.5 4.22-.38 5.5-.38s4.26-.11 5.5.38a3.2 3.2 0 0 1 1.8 1.8c.5 1.25.38 4.22.38 5.5s.12 4.26-.38 5.5Z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-6" {...fill}>
    <path d="M22 12.06A10 10 0 1 0 10.44 22v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33V22A10 10 0 0 0 22 12.06Z" />
  </svg>
);

/**
 * WhatsApp, Instagram and Facebook, held at the right edge of the screen on every page of the website.
 * Each shows only when its link is set (Studio: Business).
 */
export default function FloatingSocial({ site }: { site: Site }) {
  const b = site.content.business;
  const facebook = b.facebook ?? "";
  const links = [
    { href: whatsapp(b), label: "Chat with us on WhatsApp", icon: <WhatsAppIcon />, tone: "bg-[#25d366]" },
    b.instagram && {
      href: b.instagram,
      label: "Sea Seakers on Instagram",
      icon: <InstagramIcon />,
      tone: "bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285aeb_90%)]",
    },
    facebook && { href: facebook, label: "Sea Seakers on Facebook", icon: <FacebookIcon />, tone: "bg-[#1877f2]" },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; tone: string }[];
  return (
    <nav aria-label="Follow and chat" className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2.5 md:right-5 md:gap-3">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          {...out}
          aria-label={l.label}
          title={l.label}
          className={`grid size-11 place-items-center rounded-xl text-white shadow-[0_8px_24px_-10px_rgb(8_19_32/0.6)] ring-1 ring-white/20 transition-transform duration-300 hover:-translate-x-1 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:size-12 ${l.tone}`}
        >
          {l.icon}
        </a>
      ))}
    </nav>
  );
}
