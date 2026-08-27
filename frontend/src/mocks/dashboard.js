export const familyMembers = [
  { id: 'fm-1', name: '我自己', relationship: '本人', avatarUrl: null },
  { id: 'fm-2', name: '王芳', relationship: '配偶', avatarUrl: null },
  { id: 'fm-3', name: '张建国', relationship: '父亲', avatarUrl: null },
  { id: 'fm-4', name: '李秀兰', relationship: '母亲', avatarUrl: null },
  { id: 'fm-5', name: '张小宝', relationship: '孩子', avatarUrl: null },
  { id: 'fm-shared', name: '家庭公用', relationship: '共用', avatarUrl: null }
]

export const medicines = [
  {
    id: 'med-1',
    name: '阿莫西林胶囊',
    specification: '0.25g×24粒/盒',
    dosage: '一次1粒，一日3次',
    category: '处方药',
    indication: '细菌感染（呼吸道、泌尿道等）',
    stock: 20,
    expirationDate: '2026-10-15',
    notes: '饭后服用，过敏者禁用',
    imageUrl: null,
    familyMemberId: 'fm-shared',
    familyMemberName: '家庭公用'
  },
  {
    id: 'med-2',
    name: '布洛芬缓释胶囊',
    specification: '0.3g×20粒/盒',
    dosage: '一次1粒，一日2次',
    category: '非处方药',
    indication: '头痛、牙痛、关节痛、发热',
    stock: 8,
    expirationDate: '2026-08-08',
    notes: '饭后服用，不宜长期使用',
    imageUrl: null,
    familyMemberId: 'fm-shared',
    familyMemberName: '家庭公用'
  },
  {
    id: 'med-3',
    name: '维生素C片',
    specification: '0.1g×100片/瓶',
    dosage: '一次2片，一日1次',
    category: '保健品',
    indication: '增强免疫力、预防感冒',
    stock: 60,
    expirationDate: '2027-03-01',
    notes: '',
    imageUrl: null,
    familyMemberId: 'fm-shared',
    familyMemberName: '家庭公用'
  },
  {
    id: 'med-4',
    name: '硝苯地平控释片',
    specification: '30mg×7片/盒',
    dosage: '一次1片，一日1次',
    category: '处方药',
    indication: '高血压',
    stock: 14,
    expirationDate: '2026-12-30',
    notes: '早晨空腹服用，不可掰开',
    imageUrl: null,
    familyMemberId: 'fm-3',
    familyMemberName: '张建国'
  },
  {
    id: 'med-5',
    name: '阿托伐他汀钙片',
    specification: '20mg×7片/盒',
    dosage: '一次1片，一日1次',
    category: '处方药',
    indication: '高血脂、高胆固醇',
    stock: 10,
    expirationDate: '2026-11-18',
    notes: '睡前服用，定期复查肝功能',
    imageUrl: null,
    familyMemberId: 'fm-3',
    familyMemberName: '张建国'
  },
  {
    id: 'med-6',
    name: '碳酸钙D3片',
    specification: '600mg×30片/瓶',
    dosage: '一次1片，一日1次',
    category: '保健品',
    indication: '骨质疏松、缺钙',
    stock: 30,
    expirationDate: '2027-06-10',
    notes: '饭后服用吸收更好',
    imageUrl: null,
    familyMemberId: 'fm-4',
    familyMemberName: '李秀兰'
  },
  {
    id: 'med-7',
    name: '小儿氨酚黄那敏颗粒',
    specification: '6g×10袋/盒',
    dosage: '一次半包，一日3次',
    category: '非处方药',
    indication: '儿童感冒、发热、流鼻涕',
    stock: 6,
    expirationDate: '2026-09-05',
    notes: '38.5°C以上再吃，38.5°C以下物理降温',
    imageUrl: null,
    familyMemberId: 'fm-5',
    familyMemberName: '张小宝'
  },
  {
    id: 'med-8',
    name: '氯雷他定片',
    specification: '10mg×6片/盒',
    dosage: '一次1片，一日1次',
    category: '非处方药',
    indication: '过敏性鼻炎、荨麻疹',
    stock: 12,
    expirationDate: '2027-01-22',
    notes: '可能会犯困，建议晚上吃',
    imageUrl: null,
    familyMemberId: 'fm-2',
    familyMemberName: '王芳'
  },
  {
    id: 'med-9',
    name: '蒙脱石散',
    specification: '3g×10袋/盒',
    dosage: '一次1袋，一日3次',
    category: '非处方药',
    indication: '急性腹泻、肠胃炎',
    stock: 3,
    expirationDate: '2026-08-20',
    notes: '饭前服用，和其他药隔2小时',
    imageUrl: null,
    familyMemberId: 'fm-shared',
    familyMemberName: '家庭公用'
  },
  {
    id: 'med-10',
    name: '双歧杆菌三联活菌散',
    specification: '1g×12袋/盒',
    dosage: '一次1袋，一日2次',
    category: '非处方药',
    indication: '肠道菌群失调、消化不良',
    stock: 5,
    expirationDate: '2026-08-25',
    notes: '冰箱冷藏，温水冲服',
    imageUrl: null,
    familyMemberId: 'fm-shared',
    familyMemberName: '家庭公用'
  }
]

export const reminders = [
  {
    id: 'rem-1',
    medicineId: 'med-4',
    medicineName: '硝苯地平控释片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 2,
    time: '08:00',
    enabled: true
  },
  {
    id: 'rem-2',
    medicineId: 'med-4',
    medicineName: '硝苯地平控释片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 3,
    time: '08:00',
    enabled: true
  },
  {
    id: 'rem-3',
    medicineId: 'med-4',
    medicineName: '硝苯地平控释片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 4,
    time: '08:00',
    enabled: true
  },
  {
    id: 'rem-4',
    medicineId: 'med-4',
    medicineName: '硝苯地平控释片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 5,
    time: '08:00',
    enabled: true
  },
  {
    id: 'rem-5',
    medicineId: 'med-4',
    medicineName: '硝苯地平控释片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 6,
    time: '08:00',
    enabled: true
  },
  {
    id: 'rem-6',
    medicineId: 'med-5',
    medicineName: '阿托伐他汀钙片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 2,
    time: '21:00',
    enabled: true
  },
  {
    id: 'rem-7',
    medicineId: 'med-5',
    medicineName: '阿托伐他汀钙片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 4,
    time: '21:00',
    enabled: true
  },
  {
    id: 'rem-8',
    medicineId: 'med-5',
    medicineName: '阿托伐他汀钙片',
    familyMemberId: 'fm-3',
    familyMemberName: '张建国',
    dayOfWeek: 6,
    time: '21:00',
    enabled: true
  },
  {
    id: 'rem-9',
    medicineId: 'med-6',
    medicineName: '碳酸钙D3片',
    familyMemberId: 'fm-4',
    familyMemberName: '李秀兰',
    dayOfWeek: 2,
    time: '10:00',
    enabled: true
  },
  {
    id: 'rem-10',
    medicineId: 'med-6',
    medicineName: '碳酸钙D3片',
    familyMemberId: 'fm-4',
    familyMemberName: '李秀兰',
    dayOfWeek: 4,
    time: '10:00',
    enabled: true
  },
  {
    id: 'rem-11',
    medicineId: 'med-6',
    medicineName: '碳酸钙D3片',
    familyMemberId: 'fm-4',
    familyMemberName: '李秀兰',
    dayOfWeek: 6,
    time: '10:00',
    enabled: true
  },
  {
    id: 'rem-12',
    medicineId: 'med-1',
    medicineName: '阿莫西林胶囊',
    familyMemberId: null,
    familyMemberName: '我自己',
    dayOfWeek: 2,
    time: '08:00',
    enabled: true
  },
  {
    id: 'rem-13',
    medicineId: 'med-1',
    medicineName: '阿莫西林胶囊',
    familyMemberId: null,
    familyMemberName: '我自己',
    dayOfWeek: 2,
    time: '14:00',
    enabled: true
  },
  {
    id: 'rem-14',
    medicineId: 'med-1',
    medicineName: '阿莫西林胶囊',
    familyMemberId: null,
    familyMemberName: '我自己',
    dayOfWeek: 2,
    time: '20:00',
    enabled: true
  }
]

export const todayReminders = reminders.filter((r) => r.dayOfWeek === 2 && r.enabled)

export const expiringMedicines = medicines.filter((m) => {
  if (!m.expirationDate) return false
  const expiry = new Date(m.expirationDate)
  const now = new Date()
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 30
})
