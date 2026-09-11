const express = require('express');
const router = express.Router();
const medicineLogController = require('../controllers/medicineLogController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// 获取指定日期的打卡记录
router.get('/', medicineLogController.getDayLogs); // ?date=YYYY-MM-DD
// 打卡
router.post('/', medicineLogController.addLog);
// 取消打卡
router.delete('/:id', medicineLogController.deleteLog);

module.exports = router;
