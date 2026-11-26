import type { Metadata } from "next";
import { PasswordForm } from "@/components/studio/Accounts";
import Heading from "@/components/studio/Heading";
import { requireUser } from "@/lib/server/session";

export const instant = false;
export const metadata: Metadata = { title: "Password" };

export default async function Account() {
  const user = await requireUser("ADMIN");
  return (
    <>
      <Heading title="Password" text={`Signed in as ${user.email}.`} />
      <PasswordForm />
    </>
  );
}
