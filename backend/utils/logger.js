const LEVELS = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

function formatMeta(meta) {
  if (!meta) {
    return "";
  }

  if (typeof meta === "string") {
    return ` | ${meta}`;
  }

  try {
    return ` | ${JSON.stringify(meta)}`;
  } catch (err) {
    return "";
  }
}

function log(level, message, meta) {
  const prefix = LEVELS[level] || LEVELS.info;
  const line = `[${new Date().toISOString()}] [${prefix}] ${message}${formatMeta(meta)}`;

  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  debug: (message, meta) => log("debug", message, meta),
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
};
