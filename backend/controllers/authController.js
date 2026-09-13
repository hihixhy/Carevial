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
const { uploadImageBuffer } = require('../utils/cosUpload');
const { deleteCosByUrl } = require('../utils/deleteCos');

// Cookie过期时间 7天
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

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatar_url || null,
  notificationEnabled: Boolean(user.notification_enabled),
  soundEnabled: Boolean(user.sound_enabled),
  reminderBeforeMinutes: Number(user.reminder_before_minutes)
});

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
    } else if (purpose === 'change_email') {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: '该邮箱已被注册',
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
    // 防止并发
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
        user: formatUser(user)
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
        user: formatUser(user)
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
      data: formatUser(user)
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

// 更新用户名
exports.updateProfile = async (req, res) => {
  const username = String(req.body.username || '').trim();
  if (!username) {
    return res.status(400).json({
      code: 400,
      message: '用户名不能为空',
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

  try {
    const updated = await User.updateUsername(req.userId, username);
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在或无权限更新',
        data: null
      });
    }
    const user = await User.findById(req.userId);
    return res.status(200).json({
      code: 200,
      message: '用户名更新成功',
      data: formatUser(user)
    });
  } catch (err) {
    console.error('更新用户名失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

// 修改通知设置
exports.updateSettings = async (req, res) => {
  let { notificationEnabled, soundEnabled, reminderBeforeMinutes } = req.body;
  if (!validate.isBooleanValid(notificationEnabled)) {
    return res.status(400).json({
      code: 400,
      message: '启用通知参数格式不正确',
      data: null
    });
  }
  if (!validate.isBooleanValid(soundEnabled)) {
    return res.status(400).json({
      code: 400,
      message: '声音提醒参数格式不正确',
      data: null
    });
  }
  if (!validate.isReminderBeforeValid(reminderBeforeMinutes)) {
    return res.status(400).json({
      code: 400,
      message: '提前提醒分钟数仅支持 0/5/10/15/30',
      data: null
    });
  }

  try {
    const updated = await User.updateSettings(req.userId, {
      notificationEnabled,
      soundEnabled,
      reminderBeforeMinutes
    });
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在或无权限更新',
        data: null
      });
    }
    const user = await User.findById(req.userId);
    return res.status(200).json({
      code: 200,
      message: '用户通知设置更新成功',
      data: formatUser(user)
    });
  } catch (err) {
    console.error('更新用户通知设置失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      code: 400,
      message: '旧密码、新密码、确认密码不能为空',
      data: null
    });
  }
  if (!validate.isPasswordValid(newPassword)) {
    return res.status(400).json({
      code: 400,
      message: '新密码需6-12位，且包含大小写字母和数字',
      data: null
    });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      code: 400,
      message: '两次输入的新密码不一致',
      data: null
    });
  }
  if (oldPassword === newPassword) {
    return res.status(400).json({
      code: 400,
      message: '新密码不能与旧密码相同',
      data: null
    });
  }

  try {
    // 校验旧密码
    const row = await User.findByIdWithPassword(req.userId);
    if (!row) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    const valid = await bcrypt.compare(oldPassword, row.password_hash);
    if (!valid) {
      return res.status(400).json({
        code: 400,
        message: '旧密码错误',
        data: null
      });
    }

    await User.updatePassword(req.userId, newPassword);
    return res.status(200).json({
      code: 200,
      message: '密码修改成功',
      data: null
    });
  } catch (err) {
    console.error('修改密码失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

exports.changeEmail = async (req, res) => {
  const { code, password } = req.body;
  const newEmail = String(req.body.newEmail || '')
    .trim()
    .toLowerCase();
  if (!newEmail || !code || !password) {
    return res.status(400).json({
      code: 400,
      message: '新邮箱、验证码、当前密码不能为空',
      data: null
    });
  }
  if (!validate.isEmail(newEmail)) {
    return res.status(400).json({
      code: 400,
      message: '新邮箱格式不正确，请输入有效的邮箱地址',
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
    // 校验当前登录密码
    const row = await User.findByIdWithPassword(req.userId);
    if (!row) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(400).json({
        code: 400,
        message: '密码错误',
        data: null
      });
    }
    // 不能改成和现在一样的邮箱
    const current = await User.findById(req.userId);
    if (!current) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    if (current.email === newEmail) {
      return res.status(400).json({
        code: 400,
        message: '新邮箱不能与当前邮箱相同',
        data: null
      });
    }

    const existing = await User.findByEmail(newEmail);
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '该邮箱已被注册',
        data: null
      });
    }

    // 校验验证码
    const checkResult = await checkCode('change_email', newEmail, code);
    if (!checkResult.ok) {
      return res.status(400).json({
        code: 400,
        message: checkResult.message,
        data: null
      });
    }
    const updated = await User.updateEmail(req.userId, newEmail);
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在或无权限更新',
        data: null
      });
    }
    // 核销验证码(修改邮箱成功才删除)
    await consumeCode('change_email', newEmail);

    const user = await User.findById(req.userId);
    return res.status(200).json({
      code: 200,
      message: '邮箱修改成功',
      data: formatUser(user)
    });
  } catch (err) {
    console.error('修改邮箱失败:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        code: 400,
        message: '该邮箱已被注册',
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

// 上传头像
exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      code: 400,
      message: '请选择要上传的头像',
      data: null
    });
  }

  let newUrl = null;
  try {
    const current = await User.findById(req.userId);
    if (!current) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    const oldUrl = current.avatar_url || null;

    newUrl = await uploadImageBuffer(req.file.buffer);

    const updated = await User.updateAvatarUrl(req.userId, newUrl);
    if (!updated) {
      // 上传成功但是update失败，需要删除图片
      if (newUrl) await deleteCosByUrl(newUrl);

      return res.status(404).json({
        code: 404,
        message: '用户不存在或无权限更新',
        data: null
      });
    }

    // 写库成功再删旧图
    if (oldUrl && oldUrl !== newUrl) {
      await deleteCosByUrl(oldUrl);
    }

    const user = await User.findById(req.userId);
    return res.status(200).json({
      code: 200,
      message: '头像上传成功',
      data: formatUser(user)
    });
  } catch (err) {
    // 上传成功但是update失败，需要删除图片
    if (newUrl) await deleteCosByUrl(newUrl);
    console.error('上传头像失败:', err);
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
