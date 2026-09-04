const pool = require('../config/db');

// 解析json类型字段为数组
const parseJsonArray = (value) => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      // JSON.parse如果传入的字符串不是有效的JSON格式，会抛出错误
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// 格式化数据库查询结果
const formatProfileRow = (row) => {
  return {
    id: row.profile_id,
    memberId: row.member_id,
    name: row.name,
    relationship: row.relationship,
    age: row.age,
    bloodType: row.blood_type || '',
    allergies: parseJsonArray(row.allergies),
    chronicConditions: parseJsonArray(row.chronic_conditions),
    contraindications: parseJsonArray(row.contraindications),
    medicalNotes: row.medical_notes || ''
  };
};

class HealthProfile {
  // 创建健康档案
  static async create(userId, memberId, connection = null) {
    const db = connection || pool;
    const [result] = await db.execute(
      `INSERT INTO health_profiles
        (user_id, member_id, blood_type, allergies, chronic_conditions, contraindications, medical_notes)
       VALUES (?, ?, NULL, NULL, NULL, NULL, NULL)`,
      [userId, memberId]
    );
    return result.insertId;
  }

  static async findByUser(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT
          fm.id AS member_id,
          fm.name,
          fm.relationship,
          fm.age,
          hp.id AS profile_id,
          hp.blood_type,
          hp.allergies,
          hp.chronic_conditions,
          hp.contraindications,
          hp.medical_notes
        FROM family_members fm
        LEFT JOIN health_profiles hp
          ON hp.member_id = fm.id AND hp.user_id = fm.user_id
        WHERE fm.user_id = ?
        ORDER BY fm.created_at DESC`,
        [userId]
      );
      return rows.map((row) => formatProfileRow(row));
    } catch (err) {
      console.error('HealthProfile.findByUser 数据库错误：', err);
      throw err;
    }
  }

  static async update(memberId, userId, data) {
    try {
      const { blood_type, allergies, chronic_conditions, contraindications, medical_notes } = data;
      const [result] = await pool.execute(
        `UPDATE health_profiles SET
          blood_type = ?,
          allergies = ?,
          chronic_conditions = ?,
          contraindications = ?,
          medical_notes = ?
        WHERE member_id = ? AND user_id = ?`,
        [
          blood_type,
          JSON.stringify(allergies), // 将数组转换为JSON字符串
          JSON.stringify(chronic_conditions),
          JSON.stringify(contraindications),
          medical_notes,
          memberId,
          userId
        ]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('HealthProfile.update 数据库错误：', err);
      throw err;
    }
  }
}

module.exports = HealthProfile;
