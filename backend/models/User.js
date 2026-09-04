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
        'SELECT id, username, email, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0]; // 返回用户对象或undefined
    } catch (err) {
      console.error('User.findById 数据库错误：', err);
      throw err;
    }
  }
}

module.exports = User;
