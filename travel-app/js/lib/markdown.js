/* =========================================================
 * lib/markdown.js — AI 输出的 Markdown 转 HTML（已转义，不会 XSS）
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */


/* ---------- AI 行程规划页 ---------- */

/**
 * 极简 Markdown 渲染。
 *
 * 只支持 AI 行程里真正会出现的语法：标题、无序列表、加粗、段落。
 * 没有引 marked.js —— 一是这几种就够了，二是**必须先转义再渲染**：
 * 模型输出属于不可信内容，直接 innerHTML 等于给自己开个 XSS 口子。
 */
function renderMarkdown(md) {
  const escape = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const out = [];
  let inList = false;

  for (const rawLine of md.split('\n')) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);

    if (bullet) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push('<li>' + inline(bullet[1]) + '</li>');
      continue;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }

    if (heading) {
      // # → h2：页面里已经有 h1（标题栏），AI 的标题从 h2 起，层级才不会串
      const level = Math.min(heading[1].length + 1, 5);
      out.push(`<h${level}>` + inline(heading[2]) + `</h${level}>`);
    } else if (line.trim() !== '') {
      out.push('<p>' + inline(line) + '</p>');
    }
  }
  if (inList) out.push('</ul>');
  return out.join('');
}
