import { draftMode } from "next/headers";
import { route } from "@/lib/server/api";

const quiet = { changes: false, role: "SEO" as const };

/** Preview on: this browser sees drafts on the website, while it is signed in */
export const POST = route(async () => {
  (await draftMode()).enable();
}, quiet);

export const DELETE = route(async () => {
  (await draftMode()).disable();
}, quiet);
