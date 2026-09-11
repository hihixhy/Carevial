const pool = require('../config/db');
const { toDateString } = require('../utils/date');

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

const formatLogRow = (row) => {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    medicineId: row.medicine_id,
    userId: row.user_id,
    scheduledTime: formatTime(row.scheduled_time),
    logDate: toDateString(row.log_date),
    takenAt: row.taken_at,
    status: row.status
  };
};

class MedicineLog {
  // 创建打卡记录
  static async create(data) {
    try {
      const { reminder_id, medicine_id, user_id, scheduled_time, log_date } = data;
      const [result] = await pool.execute(
        `INSERT INTO medicine_logs
          (reminder_id, medicine_id, user_id, scheduled_time, log_date, status)
        VALUES (?, ?, ?, ?, ?, 'taken')`,
        [reminder_id, medicine_id, user_id, scheduled_time, log_date]
      );
      return result.insertId;
    } catch (err) {
      console.error('MedicineLog.create 数据库错误:', err);
      throw err;
    }
  }

  // 按日期查找打卡记录
  static async findByDate(userId, logDate) {
    try {
      const [rows] = await pool.execute(
        `SELECT id, reminder_id, medicine_id, user_id, scheduled_time, log_date, taken_at, status
        FROM medicine_logs
        WHERE user_id = ? AND log_date = ?`,
        [userId, logDate]
      );
      return rows.map((row) => formatLogRow(row));
    } catch (err) {
      console.error('MedicineLog.findByDate 数据库错误:', err);
      throw err;
    }
  }

  // 按提醒ID和日期查找打卡记录，防止重复打卡
  static async findByReminderAndDate(reminderId, userId, logDate) {
    try {
      const [rows] = await pool.execute(
        `SELECT id, reminder_id, medicine_id, user_id, scheduled_time, log_date, taken_at, status
        FROM medicine_logs
        WHERE reminder_id = ? AND user_id = ? AND log_date = ?
        LIMIT 1`,
        [reminderId, userId, logDate]
      );
      return rows[0] ? formatLogRow(rows[0]) : null;
    } catch (err) {
      console.error('MedicineLog.findByReminderAndDate 数据库错误:', err);
      throw err;
    }
  }

  // 删除打卡记录
  static async delete(id, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM medicine_logs WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('MedicineLog.delete 数据库错误:', err);
      throw err;
    }
  }
}

module.exports = MedicineLog;
