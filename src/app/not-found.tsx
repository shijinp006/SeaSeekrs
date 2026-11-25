import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { Footer } from "@/components/sections/Charter";
import { BTN_GOLD, LINK } from "@/lib/motion";
import { getSite } from "@/lib/server/site";

export const metadata: Metadata = { title: "Page not found | Sea Seakers", robots: { index: false } };

export default async function NotFound() {
  const site = await getSite();
  return (
    <>
      <SiteHeader site={site} home={false} />
      <main id="top" tabIndex={-1} className="outline-none">
        <section data-tone="deep" className="flex min-h-[70svh] items-center pb-20 pt-40">
          <div className="container-x">
            <h1 className="display t-hero">This page has sailed.</h1>
            <p className="mt-5 max-w-xl t-lead text-(--mute)">There is nothing at this address. Find your yacht from here instead.</p>
            <p className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/" className={BTN_GOLD}>
                Back to the home page
              </Link>
              <Link href="/services" className={LINK}>
                See our services
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer site={site} home={false} />
    </>
  );
}
