const isProd = process.env.NODE_ENV === "production";

function fmt(level, message, meta) {
  const entry = { level, message, ts: new Date().toISOString(), ...meta };
  return isProd
    ? JSON.stringify(entry)
    : `[${level.toUpperCase()}] ${message}` + (Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "");
}

export const logger = {
  info:  (msg, meta = {}) => console.log(fmt("info", msg, meta)),
  warn:  (msg, meta = {}) => console.warn(fmt("warn", msg, meta)),
  error: (msg, meta = {}) => console.error(fmt("error", msg, meta)),
};
