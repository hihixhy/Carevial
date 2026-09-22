const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const axios = require('axios');
const { ChromaClient } = require('chromadb');
const { embedTexts } = require('../../services/embeddings');

// 种子药表
const OPENFDA_SEED_DRUGS = [
  { genericName: 'ibuprofen', zhAliases: ['布洛芬', '芬必得'] },
  { genericName: 'acetaminophen', zhAliases: ['对乙酰氨基酚', '扑热息痛', '泰诺'] },
  { genericName: 'loratadine', zhAliases: ['氯雷他定', '开瑞坦'] },
  { genericName: 'diphenhydramine', zhAliases: ['苯海拉明'] },
  { genericName: 'loperamide', zhAliases: ['洛哌丁胺', '易蒙停'] },
  { genericName: 'aspirin', zhAliases: ['阿司匹林'] },
  { genericName: 'cetirizine', zhAliases: ['西替利嗪', '仙特明'] },
  { genericName: 'omeprazole', zhAliases: ['奥美拉唑'] },
  { genericName: 'famotidine', zhAliases: ['法莫替丁'] },
  { genericName: 'naproxen', zhAliases: ['萘普生'] },
  { genericName: 'chlorpheniramine', zhAliases: ['氯苯那敏', '扑尔敏'] },
  { genericName: 'dextromethorphan', zhAliases: ['右美沙芬'] },
  { genericName: 'metformin', zhAliases: ['二甲双胍'] },
  { genericName: 'amlodipine', zhAliases: ['氨氯地平'] },
  { genericName: 'atorvastatin', zhAliases: ['阿托伐他汀'] }
];

const SECTION_FIELDS = [
  'indications_and_usage', // 适应症与用途
  'warnings', // 警告
  'do_not_use', // 禁止使用
  'ask_doctor', // 咨询医师
  'dosage_and_administration', // 用法用量
  'pregnancy_or_breast_feeding', // 妊娠/哺乳期
  'drug_interactions', // 药物相互作用
  'contraindications', // 禁忌
  'adverse_reactions' // 不良反应
];

/**
 * 将字段值转换为文本
 * @param {string|string[]|null} v 字段值
 * @returns {string} 转换后的文本
 */
const asText = (v) => {
  if (v == null) return '';
  if (Array.isArray(v))
    return v
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join('\n');
  return String(v).trim();
};

/**
 * 按句子边界切块，尽量不把一句话劈成两半。
 * size: 目标块长；hardMax: 单句过长时的硬上限；overlapSentences: 块与块之间重叠几句。
 */
const chunkText = (text, size = 700, hardMax = 1000, overlapSentences = 1) => {
  const s = String(text || '').trim();
  if (!s) return [];
  if (s.length <= size) return [s];

  // 按句号/问叹号/换行拆，保留分隔符在句尾
  const sentences = s.match(/[^.!?\n]+[.!?]+(?:\s+|$)|[^\n]+(?:\n+|$)/g);
  const parts = (sentences || [s]).map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return [s];

  const chunks = [];
  let buf = [];
  let bufLen = 0;

  // 把缓冲区buf输出成一块chunk，并设置重叠句子
  const flush = () => {
    if (!buf.length) return;
    chunks.push(buf.join(' ').replace(/\s+/g, ' ').trim());
    // 下一块带上重叠句子
    const keep = buf.slice(-Math.max(overlapSentences, 0));
    buf = keep;
    bufLen = keep.reduce((n, t) => n + t.length + 1, 0);
  };

  for (const sentence of parts) {
    // 单句已超过hardMax，只能硬切，但尽量在空格处切断
    if (sentence.length > hardMax) {
      // 先把缓冲区输出
      flush();
      for (let i = 0; i < sentence.length;) {
        let end = Math.min(i + size, sentence.length);
        // 如果还没到文本末尾，找最近的空格
        if (end < sentence.length) {
          const sp = sentence.lastIndexOf(' ', end);
          // 保护判断：找到的空格不能离 i 太远,只有空格在范围后半段，才把截断点挪到空格处
          if (sp > i + size * 0.5) end = sp;
        }
        chunks.push(sentence.slice(i, end).trim());
        i = end;
      }
      buf = [];
      bufLen = 0;
      continue;
    }

    // 正常句子：如果现有缓冲区长度加上新句子会超过size，则先输出缓冲区
    if (bufLen + sentence.length + 1 > size && buf.length) {
      flush();
    }
    buf.push(sentence);
    // +1 是空格
    bufLen += sentence.length + 1;
  }
  flush();

  return chunks.filter(Boolean);
};

// 读取所有知识卡
const loadTopicCards = () => {
  const dir = path.join(__dirname, '../medical-kb/topics');
  // 读取目录下所有json文件
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (!files.length) throw new Error('topics目录下没有json文件');

  return files.map((file) => {
    // 读取文件内容
    const row = fs.readFileSync(path.join(dir, file), 'utf-8');
    const card = JSON.parse(row);
    if (!card.id || !card.content) {
      throw new Error(`${file}缺少id或content`);
    }
    return card;
  });
};

// 从OpenFDA获取药品说明书 genericName:英文通用药名
const fetchOpenFdaLabel = async (genericName) => {
  const url = 'https://api.fda.gov/drug/label.json';
  const params = {
    search: `openfda.generic_name:"${genericName}"`,
    limit: 1
  };
  if (process.env.OPENFDA_API_KEY) {
    params.api_key = process.env.OPENFDA_API_KEY;
  }

  const res = await axios.get(url, { params, timeout: 30000 });
  return res.data?.results?.[0] || null;
};

/**
 * 将OpenFDA的药品说明书转换为Chunk
 * @param {string} genericName 英文通用药名
 * @param {string[]} zhAliases 中文别名
 * @param {Object} label OpenFDA的药品说明书
 * @returns {Object[]} 转换后的Chunk
 */
const labelToChunks = (genericName, zhAliases, label) => {
  const brand = asText(label.openfda?.brand_name) || genericName;
  const sourceUrl =
    'https://api.fda.gov/drug/label.json?search=' +
    encodeURIComponent(`openfda.generic_name:"${genericName}"`) +
    '&limit=1';
  const aliasStr = [genericName, ...zhAliases].join(',');
  const rows = [];

  for (const section of SECTION_FIELDS) {
    const body = asText(label[section]);
    if (!body) continue;

    const parts = chunkText(body);
    parts.forEach((part, idx) => {
      // 生成唯一ID，并把非字母数字、下划线、横杠的字符全部替换成下划线
      const id = `openfda_${genericName}_${section}_${idx}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const title = `openFDA ${genericName} / ${section}`;
      const document =
        `Drug: ${genericName} (${zhAliases.join('、')})\n` +
        `Brand example: ${brand}\n` +
        `Section: ${section}\n` +
        `Text:\n${part}`;

      rows.push({
        id,
        document,
        metadata: {
          title,
          category: 'drug_label',
          section,
          sourceName: 'openFDA',
          sourceNote: 'US FDA drug label via openFDA. May differ from China NMPA labeling.',
          sourceUrl,
          drugNames: aliasStr,
          locale: 'en',
          tags: aliasStr
        }
      });
    });
  }
  return rows;
};

// 将中文知识卡片统一格式
const topicCardsToRows = (cards) =>
  cards.map((card) => {
    const tags = Array.isArray(card.tags) ? card.tags.join('、') : '';
    const document = `标题：${card.title}\n标签：${tags}\n正文：${card.content}`;
    return {
      id: card.id,
      document,
      metadata: {
        title: String(card.title || ''),
        category: String(card.category || ''),
        section: '',
        sourceName: String(card.sourceName || 'internal_curated'),
        sourceNote: String(card.sourceNote || '应用内整理的一般提示'),
        sourceUrl: '',
        drugNames: '',
        locale: 'zh',
        tags: Array.isArray(card.tags) ? card.tags.join(',') : ''
      }
    };
  });

(async () => {
  const rows = [];

  // 中文卡
  const cards = loadTopicCards();
  rows.push(...topicCardsToRows(cards));
  console.log('中文卡条数：', cards.length);

  // openFDA
  for (const drug of OPENFDA_SEED_DRUGS) {
    console.log('拉取openFDA：', drug.genericName);
    const label = await fetchOpenFdaLabel(drug.genericName);
    if (!label) {
      console.warn('未找到标签，跳过：', drug.genericName);
      continue;
    }
    const chunks = labelToChunks(drug.genericName, drug.zhAliases, label);
    console.log(' -> chunk 数：', chunks.length);
    rows.push(...chunks);
    // 降低限流风险
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log('合计写入条数', rows.length);
  if (!rows.length) throw new Error('没有条目可灌库');

  const documents = rows.map((r) => r.document);
  const ids = rows.map((r) => r.id);
  const metadatas = rows.map((r) => r.metadata);

  // 分批embedding
  const embeddings = [];
  // 每批最多16段文本调用embedding
  const batchSize = 16;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const part = await embedTexts(batch);
    embeddings.push(...part);
    console.log(`embedding ${Math.min(i + batchSize, documents.length)}/${documents.length}`);
  }
  console.log('embedding 维度示例：', embeddings[0]?.length);

  const client = new ChromaClient({
    host: 'localhost',
    port: 8000,
    ssl: false
  });

  const name = process.env.CHROMA_COLLECTION || 'carevial_medical';

  // 全量重灌，若集合已存在先删除
  try {
    await client.deleteCollection({ name });
    console.log('已删除旧集合', name);
  } catch (_) {
    // 不存在就忽略
  }

  // 自定义embeddingFunction
  const embeddingFunction = {
    generate: async (texts) => embedTexts(texts)
  };

  // 创建集合
  const collection = await client.getOrCreateCollection({
    name,
    embeddingFunction
  });

  await collection.add({
    ids,
    documents,
    embeddings,
    metadatas
  });
  console.log('灌库完成，count=', await collection.count());
})().catch((err) => {
  console.log('ingest failed:', err.response?.data || err.message || err);
  process.exit(1);
});
