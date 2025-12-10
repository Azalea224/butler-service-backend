// ===========================================
// Butler Service Backend - PM2 Configuration
// ===========================================
// Usage:
//   pm2 start ecosystem.config.js           # Start app
//   pm2 start ecosystem.config.js --env production  # Start with production env
//   pm2 reload ecosystem.config.js          # Zero-downtime reload
//   pm2 stop butler-backend                 # Stop app
//   pm2 logs butler-backend                 # View logs
//   pm2 monit                               # Monitor dashboard

module.exports = {
  apps: [
    {
      name: 'butler-backend',
      script: 'dist/index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode for load balancing
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Environment variables (development)
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      
      // Environment variables (production)
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logging
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true, // Add timestamps to logs
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};

