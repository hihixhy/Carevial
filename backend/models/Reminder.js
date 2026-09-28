const pool = require('../config/db');
const { dayjs } = require('../utils/date');

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

  // 查找需要通知的提醒
  static async findDueCandidates(weekday, userIds) {
    try {
      // 无人在线就不查
      if (Array.isArray(userIds) && userIds.length === 0) {
        return [];
      }

      let sql = `
        SELECT
          r.id,
          r.user_id,
          r.medicine_id,
          r.time,
          r.days,
          m.name AS medicine_name,
          u.sound_enabled,
          u.reminder_before_minutes
        FROM reminders r
        JOIN medicines m
          ON m.id = r.medicine_id AND m.user_id = r.user_id
        JOIN users u
          ON u.id = r.user_id
        WHERE r.enabled = 1
          AND u.notification_enabled = 1
          AND r.days = ?
      `;
      const params = [weekday];

      if (Array.isArray(userIds) && userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(', ');
        sql += ` AND r.user_id IN (${placeholders})`;
        params.push(...userIds);
      }

      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('Reminder.findDueCandidates 数据库错误:', err);
      throw err;
    }
  }

  static async findDueNow(userIds) {
    try {
      const weekday = dayjs().day(); // 今天星期0-6
      const nowHm = dayjs().format('HH:mm'); // 当前时间HH:mm

      const rows = await Reminder.findDueCandidates(weekday, userIds);
      const due = [];

      for (const row of rows) {
        const timeStr = formatTime(row.time);
        if (!timeStr) continue;

        const before = Number(row.reminder_before_minutes) || 0;

        // 通知时刻 = 服药时间 - 提前分钟
        const notifyHm = dayjs(`2000-01-01 ${timeStr}`).subtract(before, 'minute').format('HH:mm');

        if (notifyHm !== nowHm) continue;

        due.push({
          reminderId: row.id,
          userId: row.user_id,
          medicineName: row.medicine_name || '',
          time: timeStr,
          notifyHm,
          soundEnabled: Boolean(row.sound_enabled)
        });
      }

      return due;
    } catch (err) {
      console.error('Reminder.findDueNow 数据库错误:', err);
      throw err;
    }
  }
}

module.exports = Reminder;
