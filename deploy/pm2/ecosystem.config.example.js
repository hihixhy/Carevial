// Carevial PM2 示例（脱敏模板）
// 服务器上：pm2 start ecosystem.config.js
// 密钥只放 backend/.env，不要写进本文件

module.exports = {
  apps: [
    {
      name: 'carevial-api',
      cwd: '/var/www/Carevial/backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}