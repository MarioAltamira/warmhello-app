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

// PM2 memory restart threshold: safely above the configured heap ceiling (4096 MB)
// to avoid premature process recycling during normal peak traffic. Keep below the
// Lightsail Nano instance total memory (512MB? → NO, actually Nano is 512MB. Wait.
// Our node_args heap is 4096MB (4GB). That requires at least a 2GB or larger instance
// size. Lightsail Nano is 512MB RAM + 1GB swap → heap 4096 will thrash swap.
// Scale down: Runtime heap 1536 MB. Max memory restart 2048 MB.
const runtimeHeap = "--max-old-space-size=1536";

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
      node_args: maxOldSpace ?? runtimeHeap,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1900M",
      error_file: "~/.pm2/logs/warmhello-error-0.log",
      out_file: "~/.pm2/logs/warmhello-out-0.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      min_uptime: "60s",
      restart_delay: 4000,
      listen_timeout: 60000,
    },
  ],
};
