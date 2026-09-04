import { computed, onMounted, onUnmounted, ref } from 'vue'

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getStorageKey() {
  return `checkin_${getTodayKey()}`
}

function loadCheckins() {
  try {
    const raw = localStorage.getItem(getStorageKey())
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCheckins(record) {
  localStorage.setItem(getStorageKey(), JSON.stringify(record))
}

export function useMedicineCheckin() {
  const checkins = ref(loadCheckins())

  function onStorage() {
    checkins.value = loadCheckins()
  }

  onMounted(() => window.addEventListener('storage', onStorage))
  onUnmounted(() => window.removeEventListener('storage', onStorage))

  function toggleCheckin(reminderId) {
    const next = { ...checkins.value }
    if (next[reminderId]) delete next[reminderId]
    else next[reminderId] = true
    saveCheckins(next)
    checkins.value = next
  }

  function isCheckedIn(reminderId) {
    return !!checkins.value[reminderId]
  }

  const checkedCount = computed(() => Object.keys(checkins.value).length)

  return { checkins, toggleCheckin, isCheckedIn, checkedCount }
}
