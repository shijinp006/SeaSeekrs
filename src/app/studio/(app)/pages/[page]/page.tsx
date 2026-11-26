import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageEditor from "@/components/studio/PageEditor";
import { requireUser } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/site";
import { getMedia, getSections } from "@/lib/server/studio";
import type { SectionKey } from "@/lib/studio/defaults";
import { pages } from "@/lib/studio/fields";

export const instant = false;

type Props = { params: Promise<{ page: string }> };

const find = async ({ params }: Props) => {
  const { page } = await params;
  return pages.find((p) => p.id === page) ?? notFound();
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: (await find(props)).label };
}

export default async function EditPage(props: Props) {
  await requireUser("SEO");
  const page = await find(props);
  const [sections, media] = await Promise.all([getSections(), getMedia()]);
  return (
    <PageEditor
      key={page.id}
      page={page}
      title={page.label}
      url={siteUrl(page.path)}
      states={Object.fromEntries(page.sections.map((s) => [s.key, sections[s.key as SectionKey]]))}
      media={Object.fromEntries(media.map((m) => [m.path, { id: m.id, alt: m.draftAlt ?? m.alt, decorative: m.decorative }]))}
    />
  );
}
