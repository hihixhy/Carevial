export const familyHealthProfiles = [
  {
    id: 'fp-1',
    familyMemberId: 'fm-1',
    name: '我自己',
    relationship: '本人',
    allergies: ['青霉素类抗生素', '花粉（季节性）'],
    chronicConditions: ['过敏性鼻炎（春秋季发作）'],
    contraindications: ['含酒精药物（服用期间避免）'],
    bloodType: 'O型',
    medicalNotes: '每年春季需备氯雷他定，花粉季外出建议戴口罩。体健，无重大手术史。'
  },
  {
    id: 'fp-2',
    familyMemberId: 'fm-2',
    name: '王芳',
    relationship: '配偶',
    allergies: ['头孢类抗生素', '芒果', '海鲜（虾、蟹）'],
    chronicConditions: ['偏头痛（压力大时发作）', '轻度贫血'],
    contraindications: ['头孢类所有药物', '阿司匹林（胃肠不适）'],
    bloodType: 'A型',
    medicalNotes: '偏头痛发作时服用布洛芬有效，注意避免空腹服药。海鲜过敏为轻度皮疹反应。'
  },
  {
    id: 'fp-3',
    familyMemberId: 'fm-3',
    name: '张建国',
    relationship: '父亲',
    allergies: ['磺胺类药物'],
    chronicConditions: ['高血压（2级）', '高血脂', '2型糖尿病（口服降糖药控制）'],
    contraindications: ['含麻黄碱感冒药', '非甾体抗炎药（肾功能影响）'],
    bloodType: 'B型',
    medicalNotes:
      '每日监测血压，早晚各一次。空腹血糖控制在7.0以下。饮食低盐低脂，每天散步30分钟。2025年曾因血压波动住院调整用药方案。'
  },
  {
    id: 'fp-4',
    familyMemberId: 'fm-4',
    name: '李秀兰',
    relationship: '母亲',
    allergies: ['无已知药物过敏'],
    chronicConditions: ['骨质疏松', '膝关节退行性变', '偶发性失眠'],
    contraindications: ['激素类药物（遵医嘱谨慎使用）'],
    bloodType: 'O型',
    medicalNotes:
      '每日补充钙片和维生素D3。膝关节注意保暖，阴雨天可做热敷。失眠时偶尔服用地西泮（医生处方，不超过每周2次）。2024年曾因摔倒导致左手腕骨折，已愈合。'
  },
  {
    id: 'fp-5',
    familyMemberId: 'fm-5',
    name: '张小宝',
    relationship: '孩子',
    allergies: ['牛奶蛋白（1岁前确诊，现已脱敏）'],
    chronicConditions: ['轻度哮喘（运动诱发型）'],
    contraindications: ['阿司匹林（Reye综合征风险）'],
    bloodType: 'A型',
    medicalNotes:
      '体育课前使用沙丁胺醇吸入剂预防。感冒期间需密切关注呼吸情况，如有喘息加重及时就医。已完成全部国家免疫规划疫苗接种。'
  }
]
