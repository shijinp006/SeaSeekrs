import { route } from "@/lib/server/api";
import { refreshSite } from "@/lib/server/site";
import { publishAll } from "@/lib/server/studio";

export const POST = route(async (_request, { user }) => {
  const published = await publishAll(user.email);
  refreshSite();
  return { published };
}, { role: "SEO" });
