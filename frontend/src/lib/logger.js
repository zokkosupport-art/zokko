/**
 * Tiny logger that only prints in development.
 * In production, errors should be sent to a real service (Sentry/LogRocket).
 */
const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  error: (...args) => { if (isDev) console.error(...args); },
  warn: (...args) => { if (isDev) console.warn(...args); },
  info: (...args) => { if (isDev) console.info(...args); },
};
