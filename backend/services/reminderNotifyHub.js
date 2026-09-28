// Map<userId, Set<res>> 存储用户连接的响应对象
const clients = new Map();

const hasClient = (userId) => {
  const set = clients.get(userId);
  return Boolean(set && set.size > 0);
};

const add = (userId, res) => {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);
};

const remove = (userId, res) => {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) {
    clients.delete(userId);
  }
};

const send = (userId, payload) => {
  const set = clients.get(userId);
  if (!set) return;

  const line = `data: ${JSON.stringify(payload)}\n\n`;
  // 存储已结束的连接
  const dead = [];

  for (const res of set) {
    if (res.writableEnded) {
      dead.push(res);
      continue;
    }
    try {
      res.write(line);
    } catch {
      dead.push(res);
    }
  }

  for (const res of dead) {
    remove(userId, res);
  }
};

// 获取在线用户ID列表
const getOnlineUserIds = () => Array.from(clients.keys());

module.exports = {
  hasClient,
  add,
  remove,
  send,
  getOnlineUserIds
};
