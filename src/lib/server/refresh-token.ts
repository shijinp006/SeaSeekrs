import { createHmac } from "node:crypto";

/** Lets the server call its own /api/refresh; nobody without AUTH_SECRET can make this */
export const refreshToken = () => createHmac("sha256", process.env.AUTH_SECRET ?? "").update("refresh pages").digest("hex");
