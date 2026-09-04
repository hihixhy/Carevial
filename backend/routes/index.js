const authRoutes = require('./authRoutes');
const familyRoutes = require('./familyRoutes');
const healthRoutes = require('./healthRoutes');

module.exports = (app) => {
  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/family-members', familyRoutes);
  app.use('/api/health-profiles', healthRoutes);
};
