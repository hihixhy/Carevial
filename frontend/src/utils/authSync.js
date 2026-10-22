const CHANNEL_NAME = 'logout-channel'
const STORAGE_KEY = 'logout-storage'

let channel = null

const getChannel = () => {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

// 主动退出方调用
export const broadcastAuthLogout = () => {
  const bc = getChannel()
  if (bc) {
    bc.postMessage({ type: 'logout', at: Date.now() })
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {
    // 隐私模式等场景忽略
  }
}

//其他标签调用，监听退出广播
export const onAuthLogout = (handler) => {
  const bc = getChannel()
  if (bc) {
    const onMessage = (event) => {
      if (event?.data?.type === 'logout') handler()
    }
    bc.addEventListener('message', onMessage)
    return () => bc.removeEventListener('message', onMessage)
  }

  const onStorage = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) handler()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
