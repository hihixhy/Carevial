const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// 获取用户家庭成员列表
router.get('/', familyController.getMembers);
// 新增家庭成员
router.post('/', familyController.addMember);
// 更新家庭成员
router.put('/:id', familyController.updateMember);
// 删除家庭成员
router.delete('/:id', familyController.deleteMember);

module.exports = router;
