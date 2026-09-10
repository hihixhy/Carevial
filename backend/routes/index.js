const authRoutes = require('./authRoutes');
const familyRoutes = require('./familyRoutes');
const healthRoutes = require('./healthRoutes');
const medicineRoutes = require('./medicineRoutes');
const uploadRoutes = require('./uploadRoutes');
const reminderRoutes = require('./reminderRoutes');

module.exports = (app) => {
  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/family-members', familyRoutes);
  app.use('/api/health-profiles', healthRoutes);
  app.use('/api/medicines', medicineRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/reminders', reminderRoutes);
};
