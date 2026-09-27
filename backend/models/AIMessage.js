const pool = require('../config/db');

// 解析json类型字段为对象
const parseJsonObject = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
};

// 格式化数据库查询结果
const formatMessageRow = (row) => {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    pendingAction: parseJsonObject(row.pending_action),
    actionStatus: row.action_status || null,
    createdAt: row.created_at
  };
};

class AIMessage {
  // 根据对话ID查找消息列表
  static async findByConversationId(conversationId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
      return rows.map((row) => formatMessageRow(row));
    } catch (err) {
      console.error('AIMessage.findByConversationId 数据库错误:', err);
      throw err;
    }
  }

  static async create(
    { conversationId, role, content, pendingAction, actionStatus },
    connection = null
  ) {
    try {
      const db = connection || pool;
      const pendingJson = pendingAction == null ? null : JSON.stringify(pendingAction);
      const status =
        actionStatus == null || actionStatus === '' ? null : String(actionStatus).trim();

      const [result] = await db.execute(
        'INSERT INTO ai_messages (conversation_id, role, content, pending_action, action_status) VALUES (?, ?, ?, ?, ?)',
        [conversationId, role, content, pendingJson, status]
      );
      const insertId = result.insertId;

      const [rows] = await db.execute('SELECT id, created_at FROM ai_messages WHERE id = ?', [
        insertId
      ]);

      return {
        id: insertId,
        createdAt: rows[0]?.created_at ?? null
      };
    } catch (err) {
      console.error('AIMessage.create 数据库错误:', err);
      throw err;
    }
  }

  // 更新确认卡状态
  static async updateActionStatus(id, conversationId, status) {
    try {
      const [result] = await pool.execute(
        'UPDATE ai_messages SET action_status = ? WHERE id = ? AND conversation_id = ?',
        [status, id, conversationId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('AIMessage.updateActionStatus 数据库错误:', err);
      throw err;
    }
  }
}

module.exports = AIMessage;
