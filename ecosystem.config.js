module.exports = {
  apps: [
    {
      name: 'urutix-backend',
      script: 'npm',
      args: 'run start:prod', // Runs "migration:check && node dist/main" automatically
      cwd: '/root/project/urutix/backend',
      instances: 2,           // Redundancy
      exec_mode: 'cluster',    // High-availability mode
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/root/project/urutix/logs/backend-error.log',
      out_file: '/root/project/urutix/logs/backend-out.log',
      log_file: '/root/project/urutix/logs/backend-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1.5G',
      node_args: '--max-old-space-size=2048',
      // Restart delay to allow database to be ready
      restart_delay: 4000,
      // Kill timeout for graceful shutdown of transactions
      kill_timeout: 5000,
    },
  ],
};
