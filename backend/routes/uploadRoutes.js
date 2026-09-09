const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadSingle } = require('../utils/upload');
const { uploadImageBuffer } = require('../utils/cosUpload');

router.post('/image', authMiddleware, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件',
        data: null
      });
    }

    const fileUrl = await uploadImageBuffer(req.file.buffer);

    return res.status(200).json({
      code: 200,
      message: '图片上传成功',
      data: {
        url: fileUrl
      }
    });
  } catch (err) {
    console.error('上传图片失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
});

module.exports = router;
