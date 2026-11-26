import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/studio/Accounts";
import { about, company } from "@/lib/content";
import { getUser, homeOf } from "@/lib/server/session";

/** The sign-in page of /admin (admins only) or /studio (SEO specialists only) */
export default async function LoginScreen({ area, next }: { area: "ADMIN" | "SEO"; next?: string | string[] }) {
  const user = await getUser();
  if (user) redirect(homeOf(user.role));
  const home = homeOf(area);
  // only back to a page of this area, never to another site
  const back = typeof next === "string" && new RegExp(`^${home}(/[\w/-]*)?$`).test(next) ? next : home;
  const admin = area === "ADMIN";
  return (
    <main data-studio className="relative grid min-h-svh bg-navy-deep text-white lg:grid-cols-[1.25fr_1fr]">
      <div className="absolute inset-0 lg:static">
        <Image src={about.src} alt="" fill preload sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/45 to-navy-deep/25 max-lg:bg-navy-deep/75" />
        <div className="absolute inset-x-0 bottom-0 p-14 max-lg:hidden">
          <p className="display t-hero max-w-[9em]">
            Every horizon, <em>well found.</em>
          </p>
          <p className="mt-5 max-w-sm leading-relaxed text-white/80">
            {admin ? "Bookings, services and accounts of Sea Seakers." : "The words, pictures and Google results of the Sea Seakers website."}
          </p>
        </div>
      </div>
      <div className="relative grid place-items-center px-4 py-12">
        <div data-tone="foam" className="w-full max-w-md rounded-[1.4rem] bg-foam p-7 text-ink sm:p-10">
          <div className="mb-8 flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-full bg-navy-deep">
              <Image src={company.logo.src} alt="Sea Seakers" width={60} height={53} className="h-10 w-auto brightness-150" />
            </span>
            <h1 className="font-serif text-[1.8rem] leading-none">
              {admin ? (
                <>
                  Admin <em>Panel</em>
                </>
              ) : (
                <>
                  SEO <em>Studio</em>
                </>
              )}
            </h1>
          </div>
          <LoginForm next={back} area={area} />
        </div>
      </div>
    </main>
  );
}
