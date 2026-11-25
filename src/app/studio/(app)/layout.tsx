import type { Metadata } from "next";
import Sidebar from "@/components/studio/Sidebar";
import TopBar from "@/components/studio/TopBar";
import { countNewBookings } from "@/lib/server/bookings";
import { requireUser } from "@/lib/server/session";
import { getPending, lastPublished } from "@/lib/server/studio";

// Every page here depends on who is signed in: wait for the session instead of streaming around it
export const instant = false;
export const metadata: Metadata = { title: { default: "SEO Studio", template: "%s | SEO Studio" }, robots: { index: false, follow: false } };

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [pending, last, newBookings] = await Promise.all([getPending(), lastPublished(), user.role === "ADMIN" ? countNewBookings() : 0]);
  return (
    <div data-tone="foam" className="min-h-svh bg-foam text-ink">
      <Sidebar user={user} newBookings={newBookings} />
      <div className="lg:pl-64">
        <TopBar pending={pending} last={last && when.format(last.at)} />
        <main className="mx-auto max-w-[110rem] px-4 pb-20 pt-8 sm:px-6 lg:px-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
