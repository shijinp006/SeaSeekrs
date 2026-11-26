import FloatingSocial from "@/components/FloatingSocial";
import Header from "@/components/Header";
import PreviewBar from "@/components/PreviewBar";
import { company } from "@/lib/content";
import type { Site } from "@/lib/server/site";

export default function SiteHeader({ site, home }: { site: Site; home?: boolean }) {
  const { business, "layout.header": header } = site.content;
  return (
    <>
      {site.preview && <PreviewBar />}
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-gold focus:px-6 focus:py-3 focus:text-ink"
      >
        Skip to the content
      </a>
      <Header
        links={header.links}
        cta={header.cta}
        email={business.email}
        mobile={business.mobile}
        logoAlt={site.alts[company.logo.src] || business.name}
        home={home}
      />
      {/* WhatsApp, Instagram and Facebook at the right edge, on every page */}
      <FloatingSocial site={site} />
    </>
  );
}
