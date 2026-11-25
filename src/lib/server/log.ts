import "server-only";
import pino from "pino";

/**
 * Server log: one line of JSON per event on stdout, for `docker logs` or a log service. LOG_LEVEL: debug, info (the
 * default), warn, error or silent. Secrets never get in, even when a whole object is logged by mistake.
 */
export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  base: undefined, // no process id and host name on every line
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
  redact: {
    paths: ["password", "current", "passwordHash", "token", "cookie", "authorization", "*.password", "*.passwordHash", "*.token", "*.cookie", "*.authorization"],
    censor: "[hidden]",
  },
});
