const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 从 cookie 中获取 token
  const token = req.cookies?.token;

  // 校验：如果没有 token，说明未登录
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未登录',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 将解密后的用户id存储在 req.userId 中，供后续中间件或路由处理函数使用
    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.error('JWT 验证失败:', err);
    return res.status(401).json({
      code: 401,
      message: '登录令牌无效，请重新登录',
      data: null
    });
  }
};
