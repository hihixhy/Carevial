import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  breaks: true, // 换行符转换为 <br>
  gfm: true // 支持 GitHub Flavored Markdown
})

const renderer = new marked.Renderer()

renderer.link = ({ href, title, text }) => {
  const t = title ? ` title="${title}"` : ''
  return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
}

export const renderMarkdown = (text) => {
  if (!text) return ''
  const html = marked.parse(String(text), { renderer })
  // 过滤恶意代码，防止 XSS 攻击
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel']
  })
}
