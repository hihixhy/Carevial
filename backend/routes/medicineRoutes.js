const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const authMiddleware = require('../middleware/auth');
const { uploadSingle } = require('../utils/upload');

router.use(authMiddleware);

// 获取用户药品列表
router.get('/', medicineController.getMedicines);
// 获取药品详情
router.get('/:id', medicineController.getMedicine);
router.post('/', uploadSingle, medicineController.addMedicine);
router.put('/:id', uploadSingle, medicineController.updateMedicine);
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
