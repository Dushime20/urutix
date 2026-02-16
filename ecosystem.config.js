module.exports = {
  apps: [
    {
      name: 'urutix-backend',
      script: './dist/main.js',
      cwd: '/root/project/urutix/backend',
      instances: 1,
      exec_mode: 'fork',
      // Pre-start hook to check migrations
      pre_start: 'npm run migration:check',
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
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=2048',
      // Restart delay to allow database to be ready
      restart_delay: 3000,
      // Kill timeout
      kill_timeout: 5000,
    },
    {
      name: 'urutix-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/root/project/urutix/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5713,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5713,
      },
      error_file: '/root/project/urutix/logs/frontend-error.log',
      out_file: '/root/project/urutix/logs/frontend-out.log',
      log_file: '/root/project/urutix/logs/frontend-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};

