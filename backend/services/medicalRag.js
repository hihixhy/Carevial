const { ChromaClient } = require('chromadb');
const { embedTexts } = require('./embeddings');

// 缓存集合 避免每次查询都重复连接，新建集合
let cachedCollection = null;

// 问句里出现这些中文/英文，才启用「药名救援」
const DRUG_ALIASES = [
  { genericName: 'ibuprofen', aliases: ['ibuprofen', '布洛芬', '芬必得'] },
  { genericName: 'acetaminophen', aliases: ['acetaminophen', '对乙酰氨基酚', '扑热息痛', '泰诺'] },
  { genericName: 'loratadine', aliases: ['loratadine', '氯雷他定', '开瑞坦'] },
  { genericName: 'diphenhydramine', aliases: ['diphenhydramine', '苯海拉明'] },
  { genericName: 'loperamide', aliases: ['loperamide', '洛哌丁胺', '易蒙停'] },
  { genericName: 'aspirin', aliases: ['aspirin', '阿司匹林'] },
  { genericName: 'cetirizine', aliases: ['cetirizine', '西替利嗪', '仙特明'] },
  { genericName: 'omeprazole', aliases: ['omeprazole', '奥美拉唑'] },
  { genericName: 'famotidine', aliases: ['famotidine', '法莫替丁'] },
  { genericName: 'naproxen', aliases: ['naproxen', '萘普生'] },
  { genericName: 'chlorpheniramine', aliases: ['chlorpheniramine', '氯苯那敏', '扑尔敏'] },
  { genericName: 'dextromethorphan', aliases: ['dextromethorphan', '右美沙芬'] },
  { genericName: 'metformin', aliases: ['metformin', '二甲双胍'] },
  { genericName: 'amlodipine', aliases: ['amlodipine', '氨氯地平'] },
  { genericName: 'atorvastatin', aliases: ['atorvastatin', '阿托伐他汀'] }
];

// 找到问句里提到的药名
const findMentionedDrugs = (query) => {
  const q = String(query || '').toLowerCase();
  return DRUG_ALIASES.filter((d) => d.aliases.some((a) => q.includes(String(a).toLowerCase())));
};

/**
 * 判断检索返回的知识库片段是否与药名匹配
 * @param {Object} hit - 知识库片段
 * @param {Object} drug - 药名对象
 * @returns {boolean} 是否匹配
 */
const hitMatchesDrug = (hit, drug) => {
  const names = String(hit.drugNames || '').toLowerCase();
  if (!names) return false;
  return drug.aliases.some((a) => names.includes(String(a).toLowerCase()));
};

const getCollection = async () => {
  if (cachedCollection) return cachedCollection;

  const client = new ChromaClient({
    host: 'localhost',
    port: 8000,
    ssl: false
  });

  const name = process.env.CHROMA_COLLECTION || 'carevial_medical';
  const embeddingFunction = {
    generate: async (texts) => embedTexts(texts)
  };

  cachedCollection = await client.getOrCreateCollection({
    name,
    embeddingFunction
  });
  return cachedCollection;
};

// topK:最多返回多少条知识库片段
const searchMedicalKnowledge = async ({ query, topK = 3 } = {}) => {
  const q = String(query || '').trim();
  if (!q) {
    return { ok: false, hits: [], hint: 'query不能为空' };
  }

  const collection = await getCollection();
  // 将query转换为向量
  const [queryEmbedding] = await embedTexts([q]);

  // 最少1条，最多8条，默认3条
  const want = Math.min(Math.max(Number(topK) || 3, 1), 8);

  // 执行向量检索 返回值所有字段都是二维数组
  const result = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: Math.min(Math.max(want * 3, 10), 20)
  });

  const ids = result.ids?.[0] || [];
  const documents = result.documents?.[0] || [];
  const metadatas = result.metadatas?.[0] || [];
  const distances = result.distances?.[0] || [];

  const hits = [];
  for (let i = 0; i < ids.length; i++) {
    const sourceUrl = metadatas[i]?.sourceUrl || '';
    const title = metadatas[i]?.title || '';
    // distance越小，相似度越高
    const distance = distances[i];
    hits.push({
      id: ids[i],
      content: documents[i],
      title,
      category: metadatas[i]?.category || '',
      section: metadatas[i]?.section || '',
      sourceName: metadatas[i]?.sourceName || '',
      sourceNote: metadatas[i]?.sourceNote || '',
      sourceUrl,
      drugNames: metadatas[i]?.drugNames || '',
      // 给模型抄进回答
      cite: sourceUrl ? `[${title}](${sourceUrl})` : `应用内知识卡：${title || ids[i]}`,
      distance
    });
  }

  const maxDistance = Number(process.env.RAG_MAX_DISTANCE);
  const drugMaxDistance = Number(process.env.RAG_DRUG_MAX_DISTANCE);
  const baseMax = Number.isFinite(maxDistance) && maxDistance > 0 ? maxDistance : Infinity;
  const drugMax = Number.isFinite(drugMaxDistance) && drugMaxDistance > 0 ? drugMaxDistance : 1.0;

  const mentioned = findMentionedDrugs(q);

  let filtered = hits.filter((h) => Number(h.distance) <= baseMax);

  // 如果问句里提到了药名，可以用更宽阈值救援回来
  if (mentioned.length) {
    const rescued = hits.filter(
      (h) => Number(h.distance) < drugMax && mentioned.some((d) => hitMatchesDrug(h, d))
    );
    // 去重，保留 distance 更小的，排序
    const byId = new Map();
    for (const h of [...filtered, ...rescued]) {
      const prev = byId.get(h.id);
      if (!prev || Number(prev.distance) > Number(h.distance)) {
        byId.set(h.id, h);
      }
    }
    filtered = [...byId.values()].sort((a, b) => Number(a.distance) - Number(b.distance));
  }

  filtered = filtered.slice(0, want);

  // 打印日志，看被过滤了几条
  console.log(
    `[RAG] query="${q}" mentioned=${mentioned.map((d) => d.genericName).join(',') || '-'} ` +
      `raw=${hits.length} kept=${filtered.length} baseMax=${baseMax} drugMax=${drugMax}`
  );
  if (filtered.length) {
    console.log(
      filtered.map((h) => `  ${Number(h.distance).toFixed(4)} ${h.id} | ${h.title}`).join('\n')
    );
  }

  const allowedCites = filtered.map((h) => h.cite).filter(Boolean);
  const allowedSourceUrls = filtered.map((h) => h.sourceUrl).filter(Boolean);

  if (!filtered.length) {
    return {
      ok: true,
      hits: [],
      hint: '当前私有知识库未检索到相关条目。请明确告知用户「知识库没有收录」；可作简短一般科普，但禁止声称依据知识库或说明书；末行使用统一免责声明。'
    };
  }

  return {
    ok: true,
    hits: filtered,
    allowedCites,
    allowedSourceUrls,
    citeHint:
      '「依据」一节只能使用 allowedCites 中的条目原样粘贴；禁止自造 URL；若 allowedSourceUrls 为空则只写「应用内知识卡：标题」，不要用 Markdown 链接。'
  };
};

module.exports = { searchMedicalKnowledge };
