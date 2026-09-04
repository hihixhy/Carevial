import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useInView(threshold = 0.15) {
  const target = ref(null)
  const inView = ref(false)
  let observer = null

  onMounted(() => {
    if (!target.value) return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) inView.value = true
      },
      { threshold }
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { target, inView }
}
