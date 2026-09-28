import { watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getTodayDateStr } from '../utils/date'

export const useReminderNotify = () => {
  const router = useRouter()
  const userStore = useUserStore()
  // 当前sse连接
  let es = null

  // 关闭连接
  const disconnect = () => {
    if (es) {
      es.close()
      es = null
    }
  }

  const handleMessage = (ev) => {
    let data
    try {
      data = JSON.parse(ev.data)
    } catch {
      return
    }

    if (data.type !== 'reminder') return

    // 去重：同一天同一时刻同一条提醒只展示一次
    const slot = data.notifyHm || data.time
    const dedupeKey = `notify:shown:${data.reminderId}:${getTodayDateStr()}:${slot}`
    if (localStorage.getItem(dedupeKey)) return
    localStorage.setItem(dedupeKey, '1')

    // 浏览器通知
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const n = new Notification(data.medicineName || '用药提醒', {
        body: `计划服药时间 ${data.time}`,
        tag: `reminder-${data.reminderId}-${getTodayDateStr()}-${slot}`
      })
      n.onclick = () => {
        window.focus()
        router.push('/dashboard/checkin')
        n.close()
      }
    }

    // 语音播报
    if (data.soundEnabled && typeof speechSynthesis !== 'undefined') {
      const utter = new SpeechSynthesisUtterance(`该服用${data.medicineName || '药品'}了`)
      utter.lang = 'zh-CN'
      speechSynthesis.speak(utter)
    }
  }

  const connect = () => {
    disconnect() // 先关闭旧连接

    if (!userStore.user?.notificationEnabled) return

    es = new EventSource('/api/reminders/notify-stream', {
      withCredentials: true
    })

    es.onmessage = handleMessage

    es.onerror = () => {
      console.warn('reminder notify-stream 连接异常，将自动重连')
    }
  }

  // 监听登录/退出/开关通知变化
  watch(
    () => [userStore.user?.id, userStore.user?.notificationEnabled],
    () => {
      disconnect()
      if (userStore.user?.notificationEnabled) {
        connect()
      }
    },
    { immediate: true }
  )

  // 组件卸载时断开
  onUnmounted(() => {
    disconnect()
  })
}
