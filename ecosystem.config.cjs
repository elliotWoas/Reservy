module.exports = {
  apps: [
    {
      name: 'reservy-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      interpreter: 'bun',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
