/* 用 jsdom 真实加载线上页面，抓出渲染/运行时报错 */
const { JSDOM } = require('jsdom');

const URL_ = 'http://8.148.81.57/#/destinations';
const errors = [];

(async () => {
  const dom = await JSDOM.fromURL(URL_, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(window) {
      // 页面用相对路径 fetch，补一个基于当前地址的实现
      window.fetch = (input, init) => {
        const u = typeof input === 'string' ? new URL(input, window.location.href).href : input;
        return fetch(u, init);
      };
      window.addEventListener('error', (e) => {
        errors.push(`[error] ${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}`);
      });
      window.addEventListener('unhandledrejection', (e) => {
        errors.push(`[promise] ${(e.reason && e.reason.message) || e.reason}`);
      });
      const origErr = window.console.error;
      window.console.error = (...args) => {
        errors.push('[console.error] ' + args.map((a) => (a && a.stack) || String(a)).join(' ').slice(0, 600));
        origErr.apply(window.console, args);
      };
    },
  });

  // 预置登录态，避开守卫重定向
  dom.window.localStorage.setItem('youji_session', JSON.stringify({ username: 'dou123', token: 'x' }));

  await new Promise((r) => setTimeout(r, 4000));

  const doc = dom.window.document;
  const main = doc.querySelector('main');
  console.log('--- 标题 ---');
  console.log(' ', doc.title);
  console.log('--- 红条内容 ---');
  const box = doc.getElementById('boot-error');
  console.log(box ? ' ' + box.textContent.trim() : ' （无）');
  console.log('--- main 内容长度 ---');
  console.log(' ', main ? main.innerHTML.length : '（没有 main）');
  if (main && main.innerHTML.length < 200) console.log('  main.innerHTML =', main.innerHTML);
  console.log('--- 捕获的错误 ---');
  console.log(errors.length ? errors.slice(0, 6).join('\n') : ' （无）');
  dom.window.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => {
  console.error('运行失败:', e.message);
  process.exit(2);
});
