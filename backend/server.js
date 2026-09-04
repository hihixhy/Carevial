const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// // 导入并启动过期检查定时任务（让定时任务随服务启动）
// const expiryCheckJob = require('./utils/expiryCheck');
// expiryCheckJob.start();

// // 导入并初始化 WebSocket 服务（让 WebSocket 服务随 HTTP 服务启动）
// const initWebSocket = require('./utils/reminderSocket');
// initWebSocket(server);
