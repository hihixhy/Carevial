const pool = require('../config/db');
const HealthProfile = require('./HealthProfile');

class FamilyMember {
  // 根据用户ID查找家庭成员
  static async findByUser(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM family_members WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows; // 返回家庭成员数组
    } catch (err) {
      console.error('FamilyMember.findByUser 数据库错误:', err);
      throw err;
    }
  }

  // 根据ID查找家庭成员(需要校验user_id)
  static async findById(id, userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM family_members WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return rows[0] || null; // 返回家庭成员对象或null
    } catch (err) {
      console.error('FamilyMember.findById 数据库错误：', err);
      throw err;
    }
  }

  // 创建家庭成员
  static async create(data) {
    // 获取数据库连接
    const connection = await pool.getConnection();
    try {
      // 开启事务
      await connection.beginTransaction();

      const { user_id, name, age, relationship } = data;
      const [result] = await connection.execute(
        'INSERT INTO family_members (user_id, name, age, relationship) VALUES (?, ?, ?, ?)',
        [user_id, name, age == null ? null : age, relationship]
      );
      const memberId = result.insertId;

      // 创建家庭成员对应的健康档案
      await HealthProfile.create(user_id, memberId, connection);

      await connection.commit();
      return memberId;
    } catch (err) {
      // 如果事务执行失败，则回滚事务
      await connection.rollback();
      console.error('FamilyMember.create 数据库错误：', err);
      throw err;
    } finally {
      // 释放数据库连接
      connection.release();
    }
  }

  // 更新家庭成员
  static async update(id, userId, data) {
    try {
      const { name, age, relationship } = data;
      const [result] = await pool.execute(
        'UPDATE family_members SET name = ?, age = ?, relationship = ? WHERE id = ? AND user_id = ?',
        [name, age == null ? null : age, relationship, id, userId]
      );
      return result.affectedRows > 0; // 返回是否更新成功
    } catch (err) {
      console.error('FamilyMember.update 数据库错误：', err);
      throw err;
    }
  }

  // 删除家庭成员（健康档案由FK级联删除）
  static async delete(id, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM family_members WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return result.affectedRows > 0; // 返回是否删除成功
    } catch (err) {
      console.error('FamilyMember.delete 数据库错误：', err);
      throw err;
    }
  }
}

module.exports = FamilyMember;
