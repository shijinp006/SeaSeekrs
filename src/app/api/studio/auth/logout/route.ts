import { openRoute } from "@/lib/server/api";
import { endSession } from "@/lib/server/session";

export const POST = openRoute(() => endSession());
