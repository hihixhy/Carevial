const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', reminderController.getReminders);
router.get('/medicine/:medicineId', reminderController.getRemindersByMedicine);
router.post('/', reminderController.addReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
