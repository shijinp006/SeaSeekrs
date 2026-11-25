import "server-only";
import { revalidateTag } from "next/cache";

/** On everything the studio keeps from the database */
export const STUDIO_TAG = "studio";
export const refreshStudio = () => revalidateTag(STUDIO_TAG, { expire: 0 });
