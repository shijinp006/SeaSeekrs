import type { Metadata } from "next";
import Sidebar from "@/components/studio/Sidebar";
import { countNewBookings } from "@/lib/server/bookings";
import { requireUser } from "@/lib/server/session";

// Every page here depends on who is signed in: wait for the session instead of streaming around it
export const instant = false;
export const metadata: Metadata = { title: { default: "Admin Panel", template: "%s | Admin Panel" }, robots: { index: false, follow: false } };

/** The admin panel: for admins only. SEO specialists work in /studio. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ADMIN");
  const newBookings = await countNewBookings();
  return (
    <div data-tone="foam" data-studio className="min-h-svh bg-foam text-ink">
      <Sidebar user={user} newBookings={newBookings} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-[110rem] px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
