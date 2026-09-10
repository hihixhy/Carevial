const pool = require('../config/db');

const formatTime = (value) => {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    const h = String(value.getHours()).padStart(2, '0');
    const m = String(value.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  const s = String(value);
  return s.slice(0, 5);
};

const formatReminderRow = (row) => {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    medicineName: row.medicine_name || '',
    time: formatTime(row.time),
    days: Number(row.days),
    enabled: Boolean(row.enabled),
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
};

class Reminder {
  // 根据用户ID查找提醒
  static async findByUser(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, m.name AS medicine_name
        FROM reminders r
        JOIN medicines m ON m.id = r.medicine_id AND m.user_id = r.user_id
        WHERE r.user_id = ?
        ORDER BY r.time ASC, r.days ASC`,
        [userId]
      );
      return rows.map((row) => formatReminderRow(row));
    } catch (err) {
      console.error('Reminder.findByUser 数据库错误:', err);
      throw err;
    }
  }

  // 根据ID查找提醒(需要校验user_id)
  static async findById(id, userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, m.name AS medicine_name
        FROM reminders r
        JOIN medicines m ON m.id = r.medicine_id AND m.user_id = r.user_id
        WHERE r.id = ? AND r.user_id = ?`,
        [id, userId]
      );
      return rows[0] ? formatReminderRow(rows[0]) : null;
    } catch (err) {
      console.error('Reminder.findById 数据库错误:', err);
      throw err;
    }
  }

  // 根据药品ID查找提醒(需要校验user_id)
  static async findByMedicine(medicineId, userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, m.name AS medicine_name
        FROM reminders r
        JOIN medicines m ON m.id = r.medicine_id AND m.user_id = r.user_id
        WHERE r.medicine_id = ? AND r.user_id = ?
        ORDER BY r.days ASC, r.time ASC`,
        [medicineId, userId]
      );
      return rows.map((row) => formatReminderRow(row));
    } catch (err) {
      console.error('Reminder.findByMedicine 数据库错误:', err);
      throw err;
    }
  }

  // 创建提醒（一天一行）
  static async create(data) {
    try {
      const { medicine_id, user_id, time, days, enabled } = data;
      const [result] = await pool.execute(
        `INSERT INTO reminders (medicine_id, user_id, time, days, enabled)
        VALUES (?, ?, ?, ?, ?)`,
        [medicine_id, user_id, time, Number(days), enabled === undefined ? true : Boolean(enabled)]
      );
      return result.insertId;
    } catch (err) {
      console.error('Reminder.create 数据库错误:', err);
      throw err;
    }
  }

  // 批量创建提醒（多天多行）
  static async createMany(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }

    const connection = await pool.getConnection();
    try {
      // 开启事务
      await connection.beginTransaction();

      const ids = [];
      for (const item of list) {
        const [result] = await connection.execute(
          `INSERT INTO reminders (medicine_id, user_id, time, days, enabled)
          VALUES (?, ?, ?, ?, ?)`,
          [
            item.medicine_id,
            item.user_id,
            item.time,
            Number(item.days),
            item.enabled === undefined ? true : Boolean(item.enabled)
          ]
        );
        ids.push(result.insertId);
      }
      await connection.commit();
      return ids;
    } catch (err) {
      await connection.rollback();
      console.error('Reminder.createMany 数据库错误:', err);
      throw err;
    } finally {
      connection.release();
    }
  }

  static async update(id, userId, data) {
    try {
      const { medicine_id, time, days, enabled } = data;
      const [result] = await pool.execute(
        `UPDATE reminders
        SET medicine_id = ?, time = ?, days = ?, enabled = ?
        WHERE id = ? AND user_id = ?`,
        [
          medicine_id,
          time,
          Number(days),
          enabled === undefined ? true : Boolean(enabled),
          id,
          userId
        ]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Reminder.update 数据库错误:', err);
      throw err;
    }
  }

  static async delete(id, userId) {
    try {
      const [result] = await pool.execute('DELETE FROM reminders WHERE id = ? AND user_id = ?', [
        id,
        userId
      ]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Reminder.delete 数据库错误:', err);
      throw err;
    }
  }
}

module.exports = Reminder;
