/* =========================================================
 * motion.js — 首页动效的最小驱动器
 *
 * 只做两件纯 CSS 做不到的事：
 *   1) IntersectionObserver：元素进入视口时加 .is-visible（滚动入场）
 *   2) requestAnimationFrame：把滚动进度写成 --hero-shift（banner 视差）
 *
 * 设计底线：
 *   - 脚本没跑 / 报错 / 浏览器不支持 → 内容默认可见，不影响浏览
 *   - 跟随现有「界面动画」开关和系统的「减少动态效果」
 *   - 监听是 passive，每帧最多算一次，离开首屏后不再写变量
 * ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  // 老浏览器 / 非浏览器环境可能没有 matchMedia，缺就当作「用户没要求减少动效」
  var reduce = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: null };
  var hasIO = 'IntersectionObserver' in window;

  // 参与滚动入场的目标：只挑首页的主体块，不碰按钮、标签等细碎元素
  var SELECTOR = '.hero-inner > *, .type-side, .section-head, .card-grid > .card';

  var seen = [];            // 已经处理过的元素
  var io = null;
  var scanRaf = 0;
  var scrollRaf = 0;
  var hero = null;
  var domObserver = null;

  function enabled() {
    return !reduce.matches && !root.classList.contains('no-anim');
  }

  function show(el) {
    el.classList.add('is-visible');

    // 入场结束后立刻卸掉 .reveal：它带着 transform:none，
    // 留着会靠更高优先级盖掉 .card:hover 的抬升效果
    var delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
    window.setTimeout(function () {
      el.classList.remove('reveal');
      el.style.removeProperty('--reveal-delay');
    }, delay + 600);
  }

  function showAll() {
    for (var i = 0; i < seen.length; i++) show(seen[i]);
  }

  /* ---------- 1. 滚动入场 ---------- */
  function scan() {
    scanRaf = 0;
    if (!enabled() || !hasIO) return;

    var nodes = document.querySelectorAll(SELECTOR);
    var added = false;

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (seen.indexOf(el) !== -1) continue;

      // 同一父级内错峰 10ms，最多累加到 6 档（60ms），不让长列表等太久
      var siblings = el.parentElement
        ? el.parentElement.querySelectorAll(SELECTOR)
        : [];
      var idx = 0;
      for (var j = 0; j < siblings.length && siblings[j] !== el; j++) idx++;
      el.style.setProperty('--reveal-delay', Math.min(idx, 6) * 10 + 'ms');

      // .reveal 先加上（此时是透明态），等 IO 回调再加 .is-visible 淡入
      el.classList.add('reveal');
      seen.push(el);
      added = true;
      io.observe(el);
    }

    // 先判断再写：classList.add 即使 token 已存在也可能触发 class 的 MutationObserver，
    // 不加这道判断会和下面的 syncMode 形成回环
    if (added && !root.classList.contains('motion-ready')) root.classList.add('motion-ready');
  }

  // Vue 异步渲染的卡片不在首屏 DOM 里，用 MutationObserver 补扫
  function scheduleScan() {
    if (!scanRaf) scanRaf = requestAnimationFrame(scan);
  }

  function setupReveal() {
    if (!hasIO) return; // 不支持就完全不接管，内容保持原样

    io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          show(entries[i].target);
          io.unobserve(entries[i].target); // 入场只演一次，来回滚动不重复
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.08 }
    );

    domObserver = new MutationObserver(scheduleScan);
    domObserver.observe(document.getElementById('app') || document.body, {
      childList: true,
      subtree: true,
    });

    scan();
  }

  /* ---------- 2. banner 视差 ---------- */
  function updateParallax() {
    scrollRaf = 0;

    // 移动端、关掉动画、减少动效：把位移清零，CSS 里也有对应的静态兜底
    if (!enabled() || window.innerWidth <= 720) {
      root.style.setProperty('--hero-shift', '0px');
      return;
    }
    if (!hero || !hero.isConnected) {
      hero = document.querySelector('.hero');
    }
    if (!hero) return;

    var rect = hero.getBoundingClientRect();
    var vh = window.innerHeight || 0;

    // 首屏已滚出视野：直接停手，不再写样式
    if (rect.bottom < 0 || rect.top > vh) return;

    var progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
    var max = parseFloat(
      getComputedStyle(root).getPropertyValue('--hero-shift-max')
    ) || 18;
    var shift = (progress - 0.5) * 2 * max; // -18px → +18px

    root.style.setProperty('--hero-shift', shift.toFixed(1) + 'px');
  }

  function onScroll() {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(updateParallax);
  }

  function setupParallax() {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateParallax();
  }

  /* ---------- 3. 跟随「界面动画」开关 / 系统偏好实时切换 ---------- */
  function syncMode() {
    if (enabled()) {
      if (!root.classList.contains('motion-ready')) root.classList.add('motion-ready');
      scheduleScan();
      onScroll();
    } else {
      if (root.classList.contains('motion-ready')) root.classList.remove('motion-ready');
      showAll();
      root.style.setProperty('--hero-shift', '0px');
    }
  }

  // 用户在设置页切换动画开关时会改 <html> 的 class
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      if (records[i].attributeName === 'class') { syncMode(); break; }
    }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  if (typeof reduce.addEventListener === 'function') {
    reduce.addEventListener('change', syncMode);
  }

  /* ---------- 启动 ---------- */
  setupReveal();
  setupParallax();
  if (!enabled()) syncMode();
})();
