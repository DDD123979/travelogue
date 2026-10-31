/* =========================================================
 * state.js — 全局状态、localStorage 持久化与极简 hash 路由
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

/* =========================================================
 * app.js — 应用入口：Vue 组件 + 极简 hash 路由
 * 页面组件只通过 api 层取数，后续可平滑对接后端
 * ========================================================= */

const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

/* ---------- 收藏 / 偏好设置状态（localStorage 持久化） ---------- */
const FAV_KEY = 'youji_favorites';
const SETTINGS_KEY = 'youji_settings';

/* 字体大小：设置里是一个百分比滑杆，值写进 CSS 变量 --fs（= 百分比 / 100），
   全站字号按它缩放，间距与图片不受影响 */
const FONT_MIN = 85;
const FONT_MAX = 130;
const FONT_STEP = 5;

/** 早期版本用的是档位字符串，换算成百分比，兼容已经存过设置的情况 */
const LEGACY_FONT_KEYS = { small: 90, normal: 100, large: 115, xlarge: 130 };

const DEFAULT_SETTINGS = {
  showPhotos: true,     // 卡片是否显示实拍封面照片（关闭后统一用渐变色封面）
  animations: true,     // 是否保留悬浮 / 滚动动画
  fontScale: 100,       // 字体大小百分比，FONT_MIN ~ FONT_MAX
};

function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    saved = {};
  }
  const s = { ...DEFAULT_SETTINGS, ...saved };
  if (typeof s.fontScale === 'string') {
    s.fontScale = LEGACY_FONT_KEYS[s.fontScale] || DEFAULT_SETTINGS.fontScale;
  }
  s.fontScale = Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(Number(s.fontScale) || DEFAULT_SETTINGS.fontScale)));
  return s;
}

const store = reactive({
  favorites: JSON.parse(localStorage.getItem(FAV_KEY) || '[]'),
  settings: loadSettings(),
  user: api.getCurrentUser(), // { username } 或 null
  isFav(id) {
    return this.favorites.includes(id);
  },
  toggleFav(id) {
    const i = this.favorites.indexOf(id);
    if (i >= 0) {
      this.favorites.splice(i, 1);
    } else {
      this.favorites.push(id);
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(this.favorites));
  },
  /** 修改一项偏好设置并立即持久化 */
  setSetting(key, value) {
    this.settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  },
  clearFavorites() {
    this.favorites.splice(0);
    localStorage.setItem(FAV_KEY, '[]');
  },
  /** 恢复初始状态：清掉收藏与偏好设置，并退出登录 */
  resetAll() {
    this.clearFavorites();
    localStorage.removeItem(SETTINGS_KEY);
    this.settings = { ...DEFAULT_SETTINGS };
    api.logout();
    this.user = null;
  },
});

/* ---------- 极简 hash 路由 ---------- */
// 格式：#/destinations/3?q=成都 → { path: '/destinations/3', query: { q: '成都' } }
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, queryString] = raw.split('?');
  const query = {};
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  const segments = path.split('/').filter(Boolean);
  return { path, query, segments };
}

const route = ref(parseHash());

function applyRoute() {
  route.value = parseHash();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => {
  applyRoute();
  guardRoute();
});

/**
 * 跳转路由
 * @param {string} path 目标路径，如 '/destinations'
 * @param {{replace?: boolean}} options replace=true 时不留下历史记录（用于守卫重定向）
 */
function go(path, options = {}) {
  const url = '#' + path;
  if (options.replace) {
    // 用 fragment 相对跳转，file:// 双击打开（含中文路径）也安全；
    // replace 不产生新的历史记录，被拦截的页面不会留在「后退」里
    location.replace(url);
  } else {
    location.hash = url;
  }
  // 目标 hash 与当前相同时浏览器不会派发 hashchange（例如退出登录后跳 #/），
  // 所以这里显式同步一次视图并再跑一遍守卫，保证该跳的一定跳
  applyRoute();
  guardRoute();
}

/** 退出登录：清掉会话并回到首页（守卫会把用户送到登录页） */
function logout() {
  api.logout();
  store.user = null;
  go('/', { replace: true });
}

/* ---------- 路由守卫：未登录只能停留在登录页 ---------- */
/** 是否需要登录才能访问（登录页本身除外） */
function isPublicRoute() {
  return route.value.segments[0] === 'login';
}

function isLoggedIn() {
  return !!(store.user && store.user.username);
}

/**
 * 每次进入/切换路由时校验登录状态
 * @returns {boolean} true 表示本次访问已被重定向
 */
function guardRoute() {
  // 首次打开程序（或刷新、直接输入网址）：未登录一律先进入登录页
  if (!isLoggedIn() && !isPublicRoute()) {
    go('/login', { replace: true });
    return true;
  }
  // 已登录用户没必要再看登录页，直接回首页
  if (isLoggedIn() && isPublicRoute()) {
    go('/', { replace: true });
    return true;
  }
  return false;
}

/* ---------- 通用小组件 ---------- */

// 目的地卡片
