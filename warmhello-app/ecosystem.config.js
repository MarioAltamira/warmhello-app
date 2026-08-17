const path = require("node:path");
const fs = require("node:fs");

const envFile = path.resolve(__dirname, ".env");
if (fs.existsSync(envFile)) {
  try {
    require("dotenv").config({ path: envFile });
  } catch {
    const raw = fs.readFileSync(envFile, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      let key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

const maxOldSpace = process.env.NODE_OPTIONS?.includes("--max-old-space-size")
  ? undefined
  : "--max-old-space-size=4096";

module.exports = {
  apps: [
    {
      name: "warmhello",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 8080",
      interpreter: "none",
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || "production",
      },
      node_args: maxOldSpace,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
    },
  ],
};
