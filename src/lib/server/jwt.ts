import { SignJWT, jwtVerify } from "jose";

// The session cookie is a signed JWT that carries the session id. The signature is checked in src/proxy.ts on every
// studio request; the session itself is then looked up in the database (session.ts), so it can be ended at any time.

export const COOKIE = "ss_session";
const ISSUER = "seaseekers";
const AUDIENCE = "seaseekers-studio";

function secret() {
  const value = process.env.AUTH_SECRET ?? "";
  if (value.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(value);
}

export const signSession = (sid: string, userId: string, expires: Date) =>
  new SignJWT({ sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());

export async function verifyToken(token: string | undefined) {
  if (!token) return null;
  const key = secret(); // a missing secret is a set-up error, not a bad token
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"], issuer: ISSUER, audience: AUDIENCE });
    return typeof payload.sid === "string" && payload.sub ? { sid: payload.sid, userId: payload.sub } : null;
  } catch {
    return null;
  }
}
