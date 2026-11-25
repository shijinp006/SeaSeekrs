/** On server start: list the site's own pictures in the database and create the first accounts */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const [{ bootstrap, refreshOnce }, { log }] = await Promise.all([import("@/lib/server/bootstrap"), import("@/lib/server/log")]);
  try {
    await bootstrap();
    // Vercel makes the pages anew with every deployment, and there is no server of our own to call
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) setTimeout(refreshOnce, 1500);
  } catch (error) {
    log.error({ err: error }, "could not prepare the database: is it running, and migrated?");
  }
}
