import type { Metadata } from "next";
import ServiceManager from "@/components/admin/ServiceManager";
import Heading from "@/components/studio/Heading";
import { MediaProvider } from "@/components/studio/media";
import { requireUser } from "@/lib/server/session";
import { getMedia, getSections } from "@/lib/server/studio";
import { sectionByKey } from "@/lib/studio/fields";

export const instant = false;
export const metadata: Metadata = { title: "Services" };

/** The services on the website. The admin's changes are published at once. */
export default async function Services() {
  await requireUser("ADMIN");
  const section = sectionByKey("services.items")!;
  const [sections, media] = await Promise.all([getSections(), getMedia()]);
  return (
    <>
      <Heading title="Services" text="Add, edit, reorder or delete the services on the website. Every change goes live as soon as you save it." />
      <MediaProvider media={Object.fromEntries(media.map((m) => [m.path, { id: m.id, alt: m.draftAlt ?? m.alt, decorative: m.decorative }]))}>
        <ServiceManager fields={section.fields} initial={sections["services.items"].value} />
      </MediaProvider>
    </>
  );
}
