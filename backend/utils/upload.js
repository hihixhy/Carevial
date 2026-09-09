const multer = require('multer');
const storage = multer.memoryStorage(); // 使用内存存储

// 文件过滤，只允许上传图片文件
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true); // 允许上传
  } else {
    const error = new Error('只支持上传图片文件');
    error.code = 'INVALID_FILE_TYPE'; // 自定义错误码，前端可根据码做提示
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过5MB限制',
        data: null
      });
    }
    if (err.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        code: 400,
        message: '只支持上传图片文件',
        data: null
      });
    }
    return res.status(400).json({
      code: 400,
      message: '文件上传失败，请稍后再试',
      data: null
    });
  });
};

module.exports = { uploadSingle };
