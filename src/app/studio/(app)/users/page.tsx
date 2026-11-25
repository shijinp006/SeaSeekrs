import type { Metadata } from "next";
import { UserList } from "@/components/studio/Accounts";
import Heading from "@/components/studio/Heading";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/session";

export const instant = false;
export const metadata: Metadata = { title: "Users" };

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });

export default async function Users() {
  const me = await requireUser("ADMIN");
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" }, omit: { passwordHash: true } });
  return (
    <>
      <Heading title="Users" text="Admins and SEO specialists can edit, add, delete and publish everything. Only admins see this page." />
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
    </>
  );
}
