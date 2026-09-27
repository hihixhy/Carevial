const pool = require('../config/db');
const crypto = require('crypto');
const AIMessage = require('./AIMessage');

// 生成随机public_id
const createPublicId = () => {
  return crypto.randomUUID().replace(/-/g, '');
};

// 格式化数据库查询结果
const formatConversationRow = (row) => {
  return {
    id: row.id,
    publicId: row.public_id,
    title: row.title,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
};

class AIConversation {
  // 根据用户ID查找对话列表
  static async findByUser(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );
      return rows.map((row) => formatConversationRow(row));
    } catch (err) {
      console.error('AIConversation.findByUser 数据库错误:', err);
      throw err;
    }
  }

  // 根据public_id查找对话(需要校验user_id)
  static async findByPublicId(publicId, userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM ai_conversations WHERE public_id = ? AND user_id = ?',
        [publicId, userId]
      );
      return rows[0] ? formatConversationRow(rows[0]) : null;
    } catch (err) {
      console.error('AIConversation.findByPublicId 数据库错误:', err);
      throw err;
    }
  }

  // 创建对话并添加第一条消息
  static async createWithFirstMessage({ userId, title = '新对话', firstUserMessage }) {
    // 获取数据库连接
    const connection = await pool.getConnection();
    const publicId = createPublicId();
    try {
      // 开启事务
      await connection.beginTransaction();

      const [result] = await connection.execute(
        'INSERT INTO ai_conversations (user_id, public_id, title) VALUES (?, ?, ?)',
        [userId, publicId, title]
      );
      const conversationId = result.insertId;

      await AIMessage.create(
        {
          conversationId,
          role: 'user',
          content: firstUserMessage
        },
        connection
      );

      // 更新对话更新时间
      await connection.execute(
        'UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );

      const [rows] = await connection.execute('SELECT * FROM ai_conversations WHERE id = ?', [
        conversationId
      ]);

      await connection.commit();
      return rows[0] ? formatConversationRow(rows[0]) : null;
    } catch (err) {
      // 如果事务执行失败，则回滚事务
      await connection.rollback();
      console.error('AIConversation.createWithFirstMessage 数据库错误:', err);
      throw err;
    } finally {
      // 释放数据库连接
      connection.release();
    }
  }

  static async updateTitle(publicId, userId, title) {
    try {
      const [result] = await pool.execute(
        'UPDATE ai_conversations SET title = ? WHERE public_id = ? AND user_id = ?',
        [title, publicId, userId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('AIConversation.updateTitle 数据库错误:', err);
      throw err;
    }
  }

  static async delete(publicId, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM ai_conversations WHERE public_id = ? AND user_id = ?',
        [publicId, userId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('AIConversation.delete 数据库错误:', err);
      throw err;
    }
  }

  // 有新消息时刷新updated_at
  static async touchUpdatedAt(id) {
    try {
      await pool.execute(
        'UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (err) {
      console.error('AIConversation.touchUpdatedAt 数据库错误:', err);
      throw err; // 仍抛出，由 Controller 决定吞不吞
    }
  }
}

module.exports = AIConversation;
