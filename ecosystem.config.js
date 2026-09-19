module.exports = {
  apps: [
    {
      name: "warmhello",
      script: "./start.sh",
      cwd: "/home/admin/warmhello/warmhello-app/warmhello-app",
      exec_mode: "fork_mode",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
      },
      error_file: "/home/admin/.pm2/logs/warmhello-error-0.log",
      out_file: "/home/admin/.pm2/logs/warmhello-out-0.log",
      merge_logs: true,
      time: true,
    },
  ],
};
