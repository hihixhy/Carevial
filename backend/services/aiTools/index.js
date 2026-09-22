const familyTools = require('./family');
const healthTools = require('./health');
const medicineTools = require('./medicines');
const reminderTools = require('./reminders');
const checkinTools = require('./checkin');
const ragTools = require('./rag');

const tools = [
  ...familyTools,
  ...healthTools,
  ...medicineTools,
  ...reminderTools,
  ...checkinTools,
  ...ragTools
];
// 按工具名索引
const byName = new Map(tools.map((t) => [t.name, t]));

// 所有工具的定义
const TOOL_DEFINITIONS = tools.map((t) => t.definition);

// 判断是否是写工具
const isWriteTool = (name) => byName.get(name)?.kind === 'write';

// 执行只读工具
const runReadTool = async (userId, name, args = {}) => {
  const t = byName.get(name);
  if (!t || t.kind !== 'read') {
    throw new Error(`未知只读工具: ${name}`);
  }
  return t.run(userId, args);
};

// 校验并规范化「待确认」的参数(还不动库)
const buildPending = async (userId, name, args) => {
  const t = byName.get(name);
  if (!t || t.kind !== 'write') {
    return { ok: false, message: `不支持的写操作: ${name}` };
  }
  return t.buildPending(userId, args);
};

// 用户确认后执行写库操作
const executeConfirmedAction = async (userId, pendingAction) => {
  const t = byName.get(pendingAction?.type);
  if (!t || t.kind !== 'write') {
    return { ok: false, message: `不支持的写操作: ${pendingAction?.type}` };
  }
  return t.execute(userId, pendingAction.payload);
};

// 获取校验失败回填给模型的提示
const getFailHint = (name) => byName.get(name)?.failHint || '';

module.exports = {
  TOOL_DEFINITIONS,
  isWriteTool,
  runReadTool,
  buildPending,
  executeConfirmedAction,
  getFailHint
};
