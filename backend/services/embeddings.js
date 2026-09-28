const axios = require('axios');

/**
 * 向量化文本
 * @param {string[]} texts 文本数组
 * @returns {Promise<number[][]>} 向量化后的文本
 */
const embedTexts = async (texts) => {
  const base = (process.env.EMBEDDING_BASE_URL || '').replace(/\/$/, '');
  const key = process.env.EMBEDDING_API_KEY;
  const model = process.env.EMBEDDING_MODEL;

  if (!base || !key || !model) {
    throw new Error('缺少EMBEDDING_API_KEY / BASE_URL / MODEL');
  }

  const res = await axios.post(
    `${base}/embeddings`,
    { model, input: texts },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );

  const rows = res.data?.data;
  if (!Array.isArray(rows) || rows.length !== texts.length) {
    throw new Error('embedding返回数量与输入不一致');
  }

  // 按index排序后取embedding
  return rows.sort((a, b) => a.index - b.index).map((row) => row.embedding);
};

module.exports = { embedTexts };
