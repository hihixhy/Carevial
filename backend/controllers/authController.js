const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validate = require('../utils/validate');
const User = require('../models/User');
const {
  generateCode,
  canSend,
  saveCode,
  checkCode,
  consumeCode,
  verifyCode
} = require('../utils/emailCode');
const { sendCodeEmail } = require('../utils/mail');
const { createCaptcha, verifyCaptcha } = require('../utils/captcha');

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE
  });
};

// 获取图形验证码
exports.getCaptcha = async (req, res) => {
  try {
    const { captchaId, image } = await createCaptcha();
    return res.status(200).json({
      code: 200,
      message: '获取图形验证码成功',
      data: {
        captchaId,
        image
      }
    });
  } catch (err) {
    console.error('获取图形验证码失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

// 发送验证码
exports.sendCode = async (req, res) => {
  const { purpose } = req.body;
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  const { captchaId, captchaCode } = req.body;

  // 参数校验
  if (!email || !purpose) {
    return res.status(400).json({
      code: 400,
      message: '邮箱、场景不能为空',
      data: null
    });
  }
  if (!validate.isEmail(email)) {
    return res.status(400).json({
      code: 400,
      message: '邮箱格式不正确',
      data: null
    });
  }
  if (!validate.isPurposeValid(purpose)) {
    return res.status(400).json({
      code: 400,
      message: '场景格式不正确',
      data: null
    });
  }

  try {
    // 校验图形验证码
    const captchaResult = await verifyCaptcha(captchaId, captchaCode);
    if (!captchaResult.ok) {
      return res.status(400).json({
        code: 400,
        message: '图形验证码错误或已过期',
        data: null
      });
    }

    // 注册场景：检查邮箱是否已注册；登录场景：检查邮箱是否未注册
    if (purpose === 'register') {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: '邮箱已注册',
          data: null
        });
      }
    } else if (purpose === 'login') {
      const existingUser = await User.findByEmail(email);
      if (!existingUser) {
        return res.status(400).json({
          code: 400,
          message: '邮箱未注册',
          data: null
        });
      }
    }

    // 生成验证码
    const code = generateCode();
    // 检查是否允许发送
    const allowSend = await canSend(purpose, email);
    if (!allowSend) {
      return res.status(400).json({
        code: 400,
        message: '发送过于频繁，请稍后再试',
        data: null
      });
    }

    // 发送邮件
    await sendCodeEmail(email, purpose, code);
    // 保存验证码
    await saveCode(purpose, email, code);
    return res.status(200).json({
      code: 200,
      message: '验证码发送成功',
      data: null
    });
  } catch (err) {
    console.error('发送验证码失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

exports.register = async (req, res) => {
  const { password, confirmPassword, code } = req.body;
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();

  // 参数校验
  if (!username || !email || !password || !confirmPassword || !code) {
    return res.status(400).json({
      code: 400,
      message: '用户名、邮箱、密码、确认密码、验证码不能为空',
      data: null
    });
  }
  if (!validate.isUsernameValid(username)) {
    return res.status(400).json({
      code: 400,
      message: '用户名长度需在1-10位之间',
      data: null
    });
  }
  if (!validate.isEmail(email)) {
    return res.status(400).json({
      code: 400,
      message: '邮箱格式不正确，请输入有效的邮箱地址',
      data: null
    });
  }
  if (!validate.isPasswordValid(password)) {
    return res.status(400).json({
      code: 400,
      message: '密码需6-12位，且包含大小写字母和数字',
      data: null
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({
      code: 400,
      message: '两次输入的密码不一致',
      data: null
    });
  }
  if (!validate.isCodeValid(code)) {
    return res.status(400).json({
      code: 400,
      message: '验证码格式不正确',
      data: null
    });
  }

  try {
    // 检查邮箱是否已注册
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '邮箱已注册',
        data: null
      });
    }

    // 校验验证码
    const checkResult = await checkCode('register', email, code);
    if (!checkResult.ok) {
      return res.status(400).json({
        code: 400,
        message: checkResult.message,
        data: null
      });
    }

    // 创建用户
    const userId = await User.create({ username, email, password });
    // 核销验证码（注册成功才删除）
    await consumeCode('register', email);

    return res.status(200).json({
      code: 200,
      message: '注册成功',
      data: { userId }
    });
  } catch (err) {
    console.error('注册失败:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        code: 400,
        message: '邮箱已注册',
        data: null
      });
    }
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

// 密码登录
exports.loginByPassword = async (req, res) => {
  const { password } = req.body;
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();

  // 参数校验
  if (!email || !password) {
    return res.status(400).json({
      code: 400,
      message: '邮箱、密码不能为空',
      data: null
    });
  }
  if (!validate.isEmail(email)) {
    return res.status(400).json({
      code: 400,
      message: '邮箱格式不正确，请输入有效的邮箱地址',
      data: null
    });
  }

  try {
    // 查询用户是否存在
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: '邮箱或密码错误，请重新输入',
        data: null
      });
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({
        code: 400,
        message: '邮箱或密码错误，请重新输入',
        data: null
      });
    }

    // 生成 JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    return res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

// 验证码登录
exports.loginByCode = async (req, res) => {
  const { code } = req.body;
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();

  // 参数校验
  if (!email || !code) {
    return res.status(400).json({
      code: 400,
      message: '邮箱、验证码不能为空',
      data: null
    });
  }
  if (!validate.isEmail(email)) {
    return res.status(400).json({
      code: 400,
      message: '邮箱格式不正确，请输入有效的邮箱地址',
      data: null
    });
  }
  if (!validate.isCodeValid(code)) {
    return res.status(400).json({
      code: 400,
      message: '验证码格式不正确',
      data: null
    });
  }

  try {
    // 查询用户是否存在
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: '该邮箱未注册',
        data: null
      });
    }

    // 校验验证码
    const verifyResult = await verifyCode('login', email, code);
    if (!verifyResult.ok) {
      return res.status(400).json({
        code: 400,
        message: verifyResult.message,
        data: null
      });
    }

    // 生成JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    return res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // 查询用户是否存在
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    res.status(200).json({
      code: 200,
      message: '查询用户信息成功',
      data: user
    });
  } catch (err) {
    console.error('查询用户信息失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/'
  });
  return res.status(200).json({
    code: 200,
    message: '退出登录成功',
    data: null
  });
};
