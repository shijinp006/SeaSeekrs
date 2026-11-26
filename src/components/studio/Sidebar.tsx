"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { company } from "@/lib/content";
import { send } from "@/lib/studio/client";
import { pages } from "@/lib/studio/fields";
import { Icon, type IconName } from "./ui";

type Item = { href: string; label: string; icon: IconName; exact?: boolean; count?: number };

/** The admin panel: bookings, services and accounts */
const adminGroups = (newBookings: number): { title?: string; items: Item[] }[] => [
  {
    items: [
      { href: "/admin", label: "Overview", icon: "gauge", exact: true },
      { href: "/admin/bookings", label: "Bookings", icon: "calendar", count: newBookings },
      { href: "/admin/services", label: "Services", icon: "wave" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/admin/users", label: "Users", icon: "users" },
      { href: "/admin/account", label: "Password", icon: "key" },
    ],
  },
];

/** The SEO studio: text, Google results, images and blog */
const studioGroups = (): { title?: string; items: Item[] }[] => [
  {
    items: [{ href: "/studio", label: "Overview", icon: "gauge", exact: true }],
  },
  {
    title: "Pages",
    items: pages.map((p) => ({ href: `/studio/pages/${p.id}`, label: p.label, icon: "page", exact: true })),
  },
  
  {
    title: "Site",
    items: [
      { href: "/studio/images", label: "Images & Alt Text", icon: "image" },
      { href: "/studio/business", label: "Business Info", icon: "store" },
      { href: "/studio/blog", label: "Blog posts", icon: "pen" },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/studio/account", label: "Password", icon: "key" }],
  },
];

export default function Sidebar({ user, newBookings = 0 }: { user: { name: string; role: "ADMIN" | "SEO" }; newBookings?: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const admin = user.role === "ADMIN";
  const home = admin ? "/admin" : "/studio";

  const signOut = async () => {
    await send("POST", "/api/studio/auth/logout");
    // a full load, so nothing of the studio stays in memory
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${home}/login`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="fixed left-3 top-3 z-30 grid size-10 place-items-center rounded-full bg-navy-deep text-white lg:hidden"
      >
        <Icon name="menu" />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-navy-deep/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy-deep text-white transition-[translate,visibility] duration-300 lg:visible lg:translate-x-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/12 px-5 py-4">
          <Image src={company.logo.src} alt="" width={52} height={46} className="h-10 w-auto brightness-150" />
          <div>
            <p className="font-serif text-[1.25rem] leading-none">
              {admin ? (
                <>
                  Admin <em>Panel</em>
                </>
              ) : (
                <>
                  SEO <em>Studio</em>
                </>
              )}
            </p>
            <p className="mt-1.5 text-[0.75rem] text-white/60">Sea Seakers</p>
          </div>
        </div>
        <nav aria-label={admin ? "Admin" : "Studio"} className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:#ffffff33_transparent] [scrollbar-width:thin]">
          {(admin ? adminGroups(newBookings) : studioGroups()).map((g, i) => (
            <div key={i} className={i ? "mt-5" : ""}>
              {g.title && <p className="px-3 pb-1.5 text-[0.75rem] text-aqua/90">{g.title}</p>}
              <ul>
                {g.items.map((item) => {
                  const here = item.exact ? path === item.href : path.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={here ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-[0.7rem] px-3 py-2 text-[0.875rem] outline-offset-[-2px] transition-colors focus-visible:outline-2 focus-visible:outline-gold ${
                          here ? "bg-[#0d4a55] text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <Icon name={item.icon} className={`size-4 ${here ? "text-gold" : ""}`} />
                        {item.label}
                        {item.count ? (
                          <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[0.75rem] font-semibold leading-tight text-ink">
                            {item.count}
                            <span className="sr-only"> new</span>
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-3 border-t border-white/12 px-6 py-3 text-[0.875rem] text-white/75 outline-offset-[-3px] hover:text-white focus-visible:outline-2 focus-visible:outline-gold"
        >
          <Icon name="link" className="size-4" /> View website
        </a>
        <div className="flex items-center justify-between gap-3 border-t border-white/12 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-[0.875rem]">{user.name}</p>
            <p className="text-[0.75rem] text-white/60">{user.role === "ADMIN" ? "Admin" : "SEO specialist"}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid size-9 place-items-center rounded-full text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-gold"
          >
            <Icon name="out" />
          </button>
        </div>
      </aside>
    </>
  );
}
