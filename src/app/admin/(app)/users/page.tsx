import type { Metadata } from "next";
import { UserList } from "@/components/studio/Accounts";
import Heading from "@/components/studio/Heading";
import Pager from "@/components/studio/Pager";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/session";

export const instant = false;
export const metadata: Metadata = { title: "Users" };

const PER_PAGE = 10;
const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
const href = (page: number) => (page > 1 ? `/admin/users?page=${page}` : "/admin/users");

export default async function Users({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const me = await requireUser("ADMIN");
  const asked = Number((await searchParams).page);
  const total = await db.user.count();
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  // past the last page (after a delete, say): the last one
  const page = Math.min(pages, Number.isInteger(asked) && asked > 0 ? asked : 1);
  const users = await db.user.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
    omit: { passwordHash: true },
  });
  const first = (page - 1) * PER_PAGE + 1;
  return (
    <>
      <Heading
        title="Users"
        text="Admins sign in at /admin and manage bookings, services and users. SEO specialists sign in at /studio and edit the website's text, Google results, images and blog."
      />
      <UserList
        me={me.id}
        accounts={users.map(({ id, name, email, role, active, lastLoginAt }) => ({
          id,
          name,
          email,
          role,
          active,
          lastLogin: lastLoginAt && when.format(lastLoginAt),
        }))}
      />
      <Pager
        page={page}
        pages={pages}
        href={href}
        label="Pages of users"
        summary={`${first}–${first + users.length - 1} of ${total} users`}
      />
    </>
  );
}
