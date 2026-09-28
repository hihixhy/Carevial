const app = require('./app');
const reminderNotifyJob = require('./jobs/reminderNotifyJob');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  reminderNotifyJob.start();
});
