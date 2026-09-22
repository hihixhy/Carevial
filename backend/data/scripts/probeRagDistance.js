const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { searchMedicalKnowledge } = require('../../services/medicalRag');

const queries = [
  // 应强相关（中文卡 / 种子药）
  '布洛芬饭前还是饭后吃',
  '感冒了在家怎么护理',
  '发烧什么情况要去医院',
  '老人用药要注意什么',
  // 应弱相关 / 未收录
  '量子纠缠怎么治感冒',
  '今天股市怎么样',
  '给家里猫做绝育要注意什么'
];

(async () => {
  for (const q of queries) {
    const res = await searchMedicalKnowledge({ query: q, topK: 3 });
    console.log('\n===', q, '===');
    if (!res.hits?.length) {
      console.log('(无 hits)', res.hint?.slice(0, 40));
      continue;
    }
    for (const h of res.hits) {
      console.log(`  d=${Number(h.distance).toFixed(4)}  |  ${h.title || h.id}`);
    }
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
