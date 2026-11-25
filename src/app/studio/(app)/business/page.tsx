import type { Metadata } from "next";
import Heading from "@/components/studio/Heading";
import SectionForm from "@/components/studio/SectionForm";
import { requireUser } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/site";
import { getSections } from "@/lib/server/studio";
import { businessSection } from "@/lib/studio/fields";

export const instant = false;
export const metadata: Metadata = { title: "Business Info" };

export default async function Business() {
  await requireUser();
  const state = (await getSections()).business;
  return (
    <>
      <Heading title="Business Info" text="Used in the header, the footer, every WhatsApp button, and in the business details Google reads." />
      <SectionForm section={businessSection} state={state} url={siteUrl()} />
    </>
  );
}
