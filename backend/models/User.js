const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // 注册用户
  static async create({ username, email, password }) {
    try {
      // 加密密码 异步
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      // 返回新增用户的自增ID（供控制器生成JWT/返回给前端）
      return result.insertId;
    } catch (err) {
      console.error('User.create 数据库错误:', err);
      throw err;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0]; // 返回用户对象或undefined
    } catch (err) {
      console.error('User.findByEmail 数据库错误:', err);
      throw err;
    }
  }

  // 根据ID查找用户
  static async findById(id) {
    try {
      // 只查必要字段 隐藏密码敏感信息
      const [rows] = await pool.execute(
        `SELECT id, username, email, avatar_url, 
          notification_enabled, sound_enabled, reminder_before_minutes
        FROM users WHERE id = ?`,
        [id]
      );
      return rows[0]; // 返回用户对象或undefined
    } catch (err) {
      console.error('User.findById 数据库错误：', err);
      throw err;
    }
  }

  // 修改用户名
  static async updateUsername(id, username) {
    try {
      const [result] = await pool.execute('UPDATE users SET username = ? WHERE id = ?', [
        username,
        id
      ]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('User.updateUsername 数据库错误：', err);
      throw err;
    }
  }

  // 修改用户设置 启用通知、声音提醒、提前提醒分钟数
  static async updateSettings(id, { notificationEnabled, soundEnabled, reminderBeforeMinutes }) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET notification_enabled = ?, sound_enabled = ?, reminder_before_minutes = ? WHERE id = ?',
        [notificationEnabled ? 1 : 0, soundEnabled ? 1 : 0, reminderBeforeMinutes, id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('User.updateSettings 数据库错误：', err);
      throw err;
    }
  }

  // 修改密码
  static async updatePassword(id, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
        hashedPassword,
        id
      ]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('User.updatePassword 数据库错误：', err);
      throw err;
    }
  }

  // 用于校验当前密码（改密码/改邮箱时）
  static async findByIdWithPassword(id) {
    try {
      const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (err) {
      console.error('User.findByIdWithPassword 数据库错误：', err);
      throw err;
    }
  }

  // 修改邮箱
  static async updateEmail(id, email) {
    try {
      const [result] = await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('User.updateEmail 数据库错误：', err);
      throw err;
    }
  }

  // 修改头像URL
  static async updateAvatarUrl(id, avatarUrl) {
    try {
      const [result] = await pool.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [
        avatarUrl,
        id
      ]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('User.updateAvatarUrl 数据库错误：', err);
      throw err;
    }
  }
}

module.exports = User;
