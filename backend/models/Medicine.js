const pool = require('../config/db');
const { toDateString, calcExpiryStatus } = require('../utils/date');

const formatMedicineRow = (row) => {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name || null,
    name: row.name,
    specification: row.specification || '',
    expiryDate: toDateString(row.expiry_date),
    expiryStatus: calcExpiryStatus(row.expiry_date),
    dosage: row.dosage || '',
    indications: row.indications || '',
    medicineType: row.medicine_type,
    remark: row.remark || '',
    photoUrl: row.photo_url || '',
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
};

class Medicine {
  // 根据用户ID查找药品
  static async findByUser(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT m.*, fm.name AS member_name
        FROM medicines m
        LEFT JOIN family_members fm
          ON fm.id = m.member_id AND fm.user_id = m.user_id
        WHERE m.user_id = ?
        ORDER BY m.created_at DESC`,
        [userId]
      );
      return rows.map((row) => formatMedicineRow(row));
    } catch (err) {
      console.error('Medicine.findByUser 数据库错误：', err);
      throw err;
    }
  }

  // 根据ID查找药品(需要校验user_id)
  static async findById(id, userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT m.*, fm.name AS member_name
         FROM medicines m
         LEFT JOIN family_members fm
           ON fm.id = m.member_id AND fm.user_id = m.user_id
         WHERE m.id = ? AND m.user_id = ?`,
        [id, userId]
      );
      return rows[0] ? formatMedicineRow(rows[0]) : null;
    } catch (err) {
      console.error('Medicine.findById 数据库错误：', err);
      throw err;
    }
  }

  // 创建药品
  static async create(data) {
    try {
      const {
        user_id,
        member_id,
        name,
        specification,
        expiry_date,
        dosage,
        indications,
        medicine_type,
        remark,
        photo_url
      } = data;

      const expiry_status = calcExpiryStatus(expiry_date);

      const [result] = await pool.execute(
        `INSERT INTO medicines
          (user_id, member_id, name, specification, expiry_date, expiry_status,
          dosage, indications, medicine_type, remark, photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          member_id == null ? null : member_id,
          name,
          specification == null || specification === '' ? null : specification,
          expiry_date,
          expiry_status,
          dosage == null || dosage === '' ? null : dosage,
          indications == null || indications === '' ? null : indications,
          medicine_type,
          remark == null || remark === '' ? null : remark,
          photo_url == null || photo_url === '' ? null : photo_url
        ]
      );
      return result.insertId;
    } catch (err) {
      console.error('Medicine.create 数据库错误：', err);
      throw err;
    }
  }

  // 更新药品
  static async update(id, userId, data) {
    try {
      const {
        member_id,
        name,
        specification,
        expiry_date,
        dosage,
        indications,
        medicine_type,
        remark,
        photo_url,
        touchPhoto
      } = data;

      const expiry_status = calcExpiryStatus(expiry_date);

      // 公共字段
      const baseParams = [
        member_id == null ? null : member_id,
        name,
        specification == null || specification === '' ? null : specification,
        expiry_date,
        expiry_status,
        dosage == null || dosage === '' ? null : dosage,
        indications == null || indications === '' ? null : indications,
        medicine_type,
        remark == null || remark === '' ? null : remark
      ];

      let sql;
      let params;

      // 判断要不要改photo_url
      if (touchPhoto) {
        sql = `UPDATE medicines SET
          member_id = ?, name = ?, specification = ?, expiry_date = ?, expiry_status = ?,
          dosage = ?, indications = ?, medicine_type = ?, remark = ?, photo_url = ?
          WHERE id = ? AND user_id = ?`;
        params = [
          ...baseParams,
          photo_url == null || photo_url === '' ? null : photo_url,
          id,
          userId
        ];
      } else {
        sql = `UPDATE medicines SET
          member_id = ?, name = ?, specification = ?, expiry_date = ?, expiry_status = ?,
          dosage = ?, indications = ?, medicine_type = ?, remark = ?
          WHERE id = ? AND user_id = ?`;
        params = [...baseParams, id, userId];
      }

      const [result] = await pool.execute(sql, params);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Medicine.update 数据库错误：', err);
      throw err;
    }
  }

  // 删除药品
  static async delete(id, userId) {
    try {
      const [result] = await pool.execute('DELETE FROM medicines WHERE id = ? AND user_id = ?', [
        id,
        userId
      ]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Medicine.delete 数据库错误：', err);
      throw err;
    }
  }

  // 根据成员ID统计药品数量
  static async countByMember(memberId, userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) AS cnt FROM medicines WHERE member_id = ? AND user_id = ?',
        [memberId, userId]
      );
      return Number(rows[0].cnt);
    } catch (err) {
      console.error('Medicine.countByMember 数据库错误：', err);
      throw err;
    }
  }
}

module.exports = Medicine;
