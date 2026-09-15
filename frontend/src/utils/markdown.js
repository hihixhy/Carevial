import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  breaks: true, // 换行符转换为 <br>
  gfm: true // 支持 GitHub Flavored Markdown
})

export const renderMarkdown = (text) => {
  if (!text) return ''
  const html = marked.parse(String(text))
  // 过滤恶意代码，防止 XSS 攻击
  return DOMPurify.sanitize(html)
}
