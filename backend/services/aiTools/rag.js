const { searchMedicalKnowledge } = require('../medicalRag');

const searchMedicalKnowledgeTool = {
  name: 'search_medical_knowledge',
  kind: 'read',
  definition: {
    type: 'function',
    function: {
      name: 'search_medical_knowledge',
      description:
        '从私有医疗知识库检索片段（含 openFDA 药品说明书与中文主题卡）。用户问吃药、用药禁忌/用法/相互作用、病痛不适处理、护理、特殊人群、饭前饭后等时必须先调用。返回的 hits 含 content、title、sourceName、sourceUrl、sourceNote；有 hits 时必须依据 hits 作答并引用来源；无 hits 时按 hint 处理，禁止编造说明书细节。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '检索用的问题或关键词，尽量具体'
          },
          topK: {
            type: 'integer',
            description: '可选，返回条数，默认 3，最大 8'
          }
        },
        required: ['query'],
        additionalProperties: false
      }
    }
  },
  run: async (_userId, args) => {
    return searchMedicalKnowledge({
      query: args?.query,
      topK: args?.topK
    });
  }
};

module.exports = [searchMedicalKnowledgeTool];
