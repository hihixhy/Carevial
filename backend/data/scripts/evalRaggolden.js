const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { searchMedicalKnowledge } = require('../../services/medicalRag');

const K = 5;
const goldenPath = path.join(__dirname, '../medical-kb/eval/golden.json');
const cases = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));

(async () => {
  const recalls = [];
  // 负例总数
  let missTotal = 0;
  // 负例误召回数
  let missFalse = 0;
  const failures = [];

  for (const c of cases) {
    const res = await searchMedicalKnowledge({ query: c.query, topK: K });
    const hits = res.hits || [];
    const retrievedIds = hits.map((h) => h.id);

    if (c.expect === 'miss') {
      missTotal += 1;
      if (hits.length > 0) {
        missFalse += 1;
        failures.push({ id: c.id, type: 'false_positive', retrievedIds });
      }
      continue;
    }

    // 应该被召回的chunk id
    const relevant = Array.isArray(c.relevantIds) ? c.relevantIds : [];
    if (!relevant.length) {
      failures.push({ id: c.id, type: 'bad_label', message: '正例缺少 relevantIds' });
      continue;
    }

    // 真正召回的相关chunk
    const hitCount = relevant.filter((id) => retrievedIds.includes(id)).length;
    const recall = hitCount / relevant.length;
    recalls.push(recall);

    if (recall < 1) {
      failures.push({
        id: c.id,
        type: 'partial_or_miss',
        recall,
        relevantIds: relevant,
        retrievedIds,
        distances: hits.map((h) => ({ id: h.id, d: h.distance, title: h.title }))
      });
    }
  }

  // 平均召回率：全部正例 Recall@5 的算术平均值
  const avgRecall = recalls.length ? recalls.reduce((a, b) => a + b, 0) / recalls.length : 0;
  // 误召回率
  const fpRate = missTotal ? missFalse / missTotal : 0;

  console.log(`正例数: ${recalls.length}`);
  console.log(`平均 Recall@${K}: ${(avgRecall * 100).toFixed(1)}%`);
  console.log(`各题 Recall: ${recalls.map((r) => (r * 100).toFixed(0) + '%').join(', ')}`);
  console.log(`误召回率: ${missFalse}/${missTotal} = ${(fpRate * 100).toFixed(1)}%`);

  if (failures.length) {
    console.log('details:', JSON.stringify(failures, null, 2));
  }

  // 有正例完全没召回、或负例误召回，可按需 exit 1；这里先始终打印数字
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
