/* =========================================================
 * app.js — 应用入口：Vue 组件 + 极简 hash 路由
 * 页面组件只通过 api 层取数，后续可平滑对接后端
 * ========================================================= */

const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

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
const DestinationCard = {
  props: { item: { type: Object, required: true } },
  setup(props) {
    // 渐变色始终铺在底层：图片加载失败（断网 / 链接失效）时自动退回渐变封面
    const bg = computed(() =>
      `background: linear-gradient(135deg, ${props.item.gradient[0]}, ${props.item.gradient[1]})`
    );
    const imgFailed = ref(false);
    // 图片加载失败、或用户在「设置」里关掉了封面照片时，都退回渐变色封面
    const showImg = computed(
      () => Boolean(props.item.image) && !imgFailed.value && store.settings.showPhotos
    );
    return { store, bg, imgFailed, showImg };
  },
  template: `
    <div class="card" :class="{ 'has-img': showImg }" :style="bg">
      <img
        v-if="showImg"
        class="card-img"
        :src="item.image"
        :alt="item.name + '·' + item.location + ' 风景照片'"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imgFailed = true"
      />

      <!-- 拉伸链接：铺满整张卡片，点哪儿都能进详情页（避免 <a> 嵌套 <a>） -->
      <a
        class="card-stretch"
        :href="'#/destinations/' + item.id"
        :aria-label="'查看 ' + item.name + ' 详情'"
      ></a>

      <!-- 正文压在照片上；容器不拦截点击，只有「查看详情」自己接管 -->
      <div class="card-overlay">
        <div class="name">{{ item.name }}</div>
        <div class="en">{{ item.enName }}</div>
        <div class="meta-row">
          <span>{{ item.location }} · {{ item.category }}</span>
          <span class="rating">{{ item.rating }} 分</span>
        </div>
        <div class="tags">
          <span class="tag" v-for="t in item.tags" :key="t">{{ t }}</span>
        </div>
        <div class="price-row">
          <span class="price"><b>¥{{ item.priceFrom }}</b>起 / {{ item.days }}</span>
          <a class="tag tag-link" :href="'#/destinations/' + item.id">查看详情 →</a>
        </div>
      </div>

      <button
        class="fav-btn"
        :class="{ on: store.isFav(item.id) }"
        @click.stop="store.toggleFav(item.id)"
        :title="store.isFav(item.id) ? '取消收藏' : '收藏'"
      >{{ store.isFav(item.id) ? '★' : '☆' }}</button>
    </div>
  `,
};

/* ---------- 页面组件 ---------- */

// 首页
const HomePage = {
  components: { DestinationCard },
  setup() {
    const keyword = ref('');
    const list = ref([]);
    const loading = ref(true);

    onMounted(async () => {
      try {
        list.value = await api.getDestinations();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    });

    function search() {
      go('/destinations?q=' + encodeURIComponent(keyword.value.trim()));
    }

    return { keyword, list, loading, search };
  },
  template: `
    <div>
      <section class="hero">
        <h1>去<em>想去</em>的地方，见想见的风景</h1>
        <p>精选国内目的地，从攻略到行程，一站备齐</p>
        <div class="search-box">
          <input
            v-model="keyword"
            placeholder="搜索目的地，如：成都、大理、海岛…"
            @keyup.enter="search"
          />
          <button class="btn btn-primary" @click="search">搜 索</button>
        </div>
      </section>

      <section class="section container">
        <div class="section-head">
          <h2>热门目的地</h2>
          <a href="#/destinations">查看全部 →</a>
        </div>
        <div class="loading" v-if="loading"><span></span><br />加载中…</div>
        <div class="card-grid" v-else>
          <DestinationCard v-for="d in list.slice(0, 6)" :key="d.id" :item="d" />
        </div>
      </section>
    </div>
  `,
};

// 目的地列表页
const ListPage = {
  components: { DestinationCard },
  setup() {
    const all = ref([]);
    const loading = ref(true);
    const keyword = ref(route.value.query.q || '');
    const category = ref(route.value.query.cat || '全部');

    // 响应路由参数变化（例如从首页搜索跳转过来）
    watch(
      () => route.value.query,
      (q) => {
        if (q.q !== undefined) keyword.value = q.q;
        if (q.cat !== undefined) category.value = q.cat;
      }
    );

    onMounted(async () => {
      try {
        all.value = await api.getDestinations();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    });

    const categories = computed(() =>
      ['全部', ...new Set(all.value.map((d) => d.category))]
    );

    const filtered = computed(() =>
      all.value.filter((d) => {
        const okCat = category.value === '全部' || d.category === category.value;
        const kw = keyword.value.trim();
        const okKw =
          !kw ||
          d.name.includes(kw) ||
          d.location.includes(kw) ||
          d.tags.some((t) => t.includes(kw));
        return okCat && okKw;
      })
    );

    return { loading, keyword, category, categories, filtered };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">目的地</h1>
      <div class="filter-bar">
        <div class="filter-tabs">
          <button
            v-for="c in categories"
            :key="c"
            class="filter-tab"
            :class="{ active: category === c }"
            @click="category = c"
          >{{ c }}</button>
        </div>
        <input class="filter-search" v-model="keyword" placeholder="搜索目的地 / 标签" />
      </div>

      <div class="loading" v-if="loading"><span></span><br />加载中…</div>
      <template v-else>
        <div class="result-count">共 {{ filtered.length }} 个目的地</div>
        <div class="card-grid" v-if="filtered.length">
          <DestinationCard v-for="d in filtered" :key="d.id" :item="d" />
        </div>
        <div class="empty" v-else>
          <div class="icon">🧭</div>
          <p>没有找到相关的目的地，换个关键词试试</p>
          <a class="btn btn-outline btn-sm" href="#/destinations">查看全部目的地</a>
        </div>
      </template>
    </div>
  `,
};

// 目的地详情页
const DetailPage = {
  props: { id: { type: Number, required: true } },
  setup(props) {
    const item = ref(null);
    const loading = ref(true);
    const error = ref('');

    onMounted(async () => {
      try {
        item.value = await api.getDestination(props.id);
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    });

    const bg = computed(() =>
      item.value
        ? `background: linear-gradient(120deg, ${item.value.gradient[0]}, ${item.value.gradient[1]})`
        : ''
    );

    // 跳到 AI 规划页，并把当前目的地一起带过去（AiPage 里读 query.dest 预选）
    function planWithAi() {
      go('/ai?dest=' + props.id);
    }

    // 同理，跳到预订页并带上当前目的地（BookingPage 里读 query.dest 预选城市）
    function bookNow() {
      go('/booking?dest=' + props.id);
    }

    return { item, loading, error, bg, store, planWithAi, bookNow };
  },
  template: `
    <div class="page container">
      <div class="loading" v-if="loading"><span></span><br />加载中…</div>

      <div class="empty" v-else-if="error">
        <div class="icon">🧭</div>
        <p>{{ error }}</p>
        <a class="btn btn-outline btn-sm" href="#/destinations">返回列表</a>
      </div>

      <template v-else>
        <div class="detail-hero" :style="bg">
          <div class="en">{{ item.enName }} · {{ item.location }}</div>
          <h1>{{ item.name }}</h1>
          <div class="sub">
            <span>评分 {{ item.rating }}</span>
            <span>建议游玩 {{ item.days }}</span>
            <span>最佳季节 {{ item.bestSeason }}</span>
          </div>
          <button class="fav-btn" :class="{ on: store.isFav(item.id) }" @click="store.toggleFav(item.id)">
            {{ store.isFav(item.id) ? '★ 已收藏' : '☆ 收藏' }}
          </button>
        </div>

        <div class="detail-layout">
          <div class="detail-main">
            <h2>目的地介绍</h2>
            <p style="color: var(--text-secondary); font-size: 15px;">{{ item.description }}</p>

            <h2>推荐景点</h2>
            <div class="attraction-item" v-for="a in item.attractions" :key="a.name">
              <div class="head">
                <span class="name">{{ a.name }}</span>
                <span class="time">{{ a.time }}</span>
              </div>
              <p>{{ a.desc }}</p>
            </div>
          </div>

          <aside class="side-card">
            <div class="label">行程参考价</div>
            <div class="price-line">
              <b>¥{{ item.priceFrom }}</b>
              <span style="font-size: 13px; color: var(--text-muted);">/ 人起</span>
            </div>
            <div class="divider"></div>
            <div class="label">类别</div>
            <div class="value">{{ item.category }}</div>
            <div class="label">位置</div>
            <div class="value">{{ item.location }}</div>
            <div class="label">建议游玩</div>
            <div class="value">{{ item.days }}</div>
            <div class="label">最佳季节</div>
            <div class="value">{{ item.bestSeason }}</div>
            <button class="btn btn-outline" @click="planWithAi">✨ AI 生成行程</button>
            <button class="btn btn-primary" @click="bookNow">立即预订</button>
          </aside>
        </div>
      </template>
    </div>
  `,
};

// 收藏页
const FavoritesPage = {
  components: { DestinationCard },
  setup() {
    const all = ref([]);
    const loading = ref(true);

    onMounted(async () => {
      try {
        all.value = await api.getDestinations();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    });

    const favList = computed(() =>
      all.value.filter((d) => store.favorites.includes(d.id))
    );

    return { loading, favList };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">我的收藏</h1>
      <div class="loading" v-if="loading"><span></span><br />加载中…</div>
      <template v-else>
        <div class="card-grid" v-if="favList.length">
          <DestinationCard v-for="d in favList" :key="d.id" :item="d" />
        </div>
        <div class="empty" v-else>
          <div class="icon">☆</div>
          <p>还没有收藏任何目的地</p>
          <a class="btn btn-outline btn-sm" href="#/destinations">去逛逛热门目的地</a>
        </div>
      </template>
    </div>
  `,
};

// 设置页（账号 / 显示 / 数据 / 关于）
const SettingsPage = {
  setup() {
    const toast = ref('');
    let timer = null;

    /** 底部轻提示，1.6s 后自动消失 */
    function flash(msg) {
      toast.value = msg;
      clearTimeout(timer);
      timer = setTimeout(() => (toast.value = ''), 1600);
    }

    function toggle(key) {
      store.setSetting(key, !store.settings[key]);
      flash('设置已保存');
    }

    /** 拖动滑杆时实时生效（每次 input 都写 localStorage，值小、开销可忽略） */
    function setFont(e) {
      store.setSetting('fontScale', Number(e.target.value));
    }

    /** 松手时才提示一次，避免拖动过程中提示狂闪 */
    function commitFont() {
      flash('字体大小：' + store.settings.fontScale + '%');
    }

    /** 滑杆已填充部分的百分比，用于给轨道上色 */
    const fillPct = computed(
      () => ((store.settings.fontScale - FONT_MIN) / (FONT_MAX - FONT_MIN)) * 100
    );
    const rangeBg = computed(
      () => `linear-gradient(90deg, var(--primary) ${fillPct.value}%, var(--border) ${fillPct.value}%)`
    );

    function clearFav() {
      if (!store.favorites.length) return;
      if (!confirm(`确定清空全部 ${store.favorites.length} 个收藏吗？`)) return;
      store.clearFavorites();
      flash('收藏已清空');
    }

    function clearAll() {
      if (!confirm('将清空收藏、恢复默认设置并退出登录，确定继续吗？')) return;
      store.resetAll();
      // 登录态已失效，但要显式再跑一次守卫：清数据不会改变 hash，
      // 不主动调用的话会停在设置页，出现「已退出却还能看到页面」的空档
      guardRoute();
    }

    const avatar = computed(() =>
      store.user ? store.user.username.slice(0, 1).toUpperCase() : '?'
    );

    return {
      store,
      toast,
      toggle,
      setFont,
      commitFont,
      rangeBg,
      fontMin: FONT_MIN,
      fontMax: FONT_MAX,
      fontStep: FONT_STEP,
      clearFav,
      clearAll,
      logout,
      avatar,
    };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">设置</h1>

      <section class="settings-card">
        <div class="setting-row">
          <div class="account-left">
            <span class="user-avatar lg">{{ avatar }}</span>
            <div>
              <div class="title">{{ store.user ? store.user.username : '未登录' }}</div>
              <div class="desc">已登录 · 收藏 {{ store.favorites.length }} 个目的地</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" @click="logout">退出登录</button>
        </div>
      </section>

      <section class="settings-card">
        <h2>显示</h2>
        <div class="setting-row">
          <div>
            <div class="title">字体大小</div>
            <div class="desc">只缩放文字，间距、图片与卡片尺寸保持不变</div>
          </div>
          <div class="fs-slider">
            <span class="fs-a min">A</span>
            <input
              class="range"
              type="range"
              :min="fontMin" :max="fontMax" :step="fontStep"
              :value="store.settings.fontScale"
              :style="{ background: rangeBg }"
              :aria-label="'字体大小 ' + store.settings.fontScale + '%'"
              @input="setFont"
              @change="commitFont"
            />
            <span class="fs-a max">A</span>
            <span class="fs-value">{{ store.settings.fontScale }}%</span>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="title">显示目的地封面照片</div>
            <div class="desc">关闭后卡片统一使用渐变色封面，断网或不想加载外链图片时更清爽</div>
          </div>
          <button
            class="switch" :class="{ on: store.settings.showPhotos }"
            role="switch" :aria-checked="store.settings.showPhotos"
            @click="toggle('showPhotos')"
          ><span></span></button>
        </div>
        <div class="setting-row">
          <div>
            <div class="title">界面动画</div>
            <div class="desc">卡片的悬浮效果、页面滚动与提示的过渡动画</div>
          </div>
          <button
            class="switch" :class="{ on: store.settings.animations }"
            role="switch" :aria-checked="store.settings.animations"
            @click="toggle('animations')"
          ><span></span></button>
        </div>
      </section>

      <section class="settings-card">
        <h2>数据</h2>
        <div class="setting-row">
          <div>
            <div class="title">清空我的收藏</div>
            <div class="desc">当前共 {{ store.favorites.length }} 个收藏</div>
          </div>
          <button class="btn btn-outline btn-sm btn-danger" :disabled="!store.favorites.length" @click="clearFav">清空</button>
        </div>
        <div class="setting-row">
          <div>
            <div class="title">恢复初始状态</div>
            <div class="desc">清空收藏与偏好设置，并退出登录</div>
          </div>
          <button class="btn btn-outline btn-sm btn-danger" @click="clearAll">恢复</button>
        </div>
      </section>

      <section class="settings-card">
        <h2>关于</h2>
        <div class="setting-row">
          <div>
            <div class="title">游迹 · 前端演示版</div>
            <div class="desc">Vue 3 · 数据来自本地示例数据（js/api.js），尚未接入后端</div>
          </div>
          <span class="version">v1.0</span>
        </div>
      </section>

      <transition name="fade">
        <div class="toast" v-if="toast">{{ toast }}</div>
      </transition>
    </div>
  `,
};

// 登录 / 注册页（同一页面，tab 切换）
const LoginPage = {
  setup() {
    // mode: 'login' | 'register'，支持 #/login 和 #/login?mode=register
    const mode = ref(route.value.query.mode === 'register' ? 'register' : 'login');
    const username = ref('');
    const password = ref('');
    const confirm = ref('');
    const error = ref('');
    const loading = ref(false);

    function switchMode(m) {
      mode.value = m;
      error.value = '';
    }

    async function submit() {
      error.value = '';
      const name = username.value.trim();
      if (!name) { error.value = '请输入用户名'; return; }
      if (password.value.length < 6) { error.value = '密码至少 6 位'; return; }

      if (mode.value === 'register' && password.value !== confirm.value) {
        error.value = '两次输入的密码不一致';
        return;
      }

      loading.value = true;
      try {
        const user =
          mode.value === 'register'
            ? await api.register(name, password.value)
            : await api.login(name, password.value);
        store.user = { username: user.username };
        // 登录成功后进入首页，并顶掉历史里的登录页
        go('/', { replace: true });
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    return { mode, username, password, confirm, error, loading, switchMode, submit };
  },
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="logo-mark auth-logo">游</span>
          <h1>游迹</h1>
          <p>发现你的下一场旅行</p>
        </div>

        <div class="auth-tabs">
          <button
            class="auth-tab"
            :class="{ active: mode === 'login' }"
            @click="switchMode('login')"
          >登录</button>
          <button
            class="auth-tab"
            :class="{ active: mode === 'register' }"
            @click="switchMode('register')"
          >注册</button>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <input v-model="username" placeholder="用户名" autocomplete="username" />
          <input v-model="password" type="password" placeholder="密码（至少 6 位）"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
          <input v-if="mode === 'register'" v-model="confirm" type="password"
            placeholder="确认密码" autocomplete="new-password" />

          <div class="auth-error" v-if="error">{{ error }}</div>

          <button class="btn btn-primary auth-submit" type="submit" :disabled="loading">
            {{ loading ? '请稍候…' : (mode === 'login' ? '登 录' : '注 册') }}
          </button>
        </form>

        <p class="auth-switch-tip">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <a href="javascript:;"
            @click="switchMode(mode === 'login' ? 'register' : 'login')">
            {{ mode === 'login' ? '立即注册' : '去登录' }}
          </a>
        </p>
      </div>
    </div>
  `,
};

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

const AiPage = {
  setup() {
    const list = ref([]);
    // 从详情页「AI 生成行程」跳过来会带着 ?dest=ID，直接选中那个目的地
    const destId = ref(route.value.query.dest ? Number(route.value.query.dest) : null);
    const days = ref(3);
    const preference = ref('');
    const text = ref('');
    const status = ref('');
    const error = ref('');
    const running = ref(false);
    let controller = null;   // 用来实现「停止生成」

    const PRESETS = [
      '第一次去，走经典景点',
      '带爸妈，节奏慢一点',
      '亲子游，少走路',
      '摄影出片优先',
      '专心吃当地美食',
      '预算有限，性价比优先',
    ];

    onMounted(async () => {
      try {
        list.value = await api.getDestinations();
        if (!destId.value && list.value.length) {
          destId.value = list.value[0].id;
        }
      } catch (e) {
        error.value = e.message;
      }
    });

    const current = computed(
      () => list.value.find((d) => d.id === destId.value) || null
    );
    const rendered = computed(() => renderMarkdown(text.value));

    async function start() {
      if (running.value || !destId.value) return;
      error.value = '';
      text.value = '';
      status.value = '正在连接大模型…';
      running.value = true;
      controller = new AbortController();

      try {
        await api.planItinerary(
          {
            destinationId: destId.value,
            days: Number(days.value) || 3,
            preference: preference.value,
          },
          {
            onStatus: (note) => (status.value = note),
            onDelta: (chunk) => {
              status.value = '';       // 一有正文就把「思考中」收起来
              text.value += chunk;
            },
          },
          controller.signal
        );
      } catch (e) {
        if (e.name === 'AbortError') {
          if (text.value) text.value += '\n\n（已停止生成）';
        } else {
          error.value = e.message;
        }
      } finally {
        status.value = '';
        running.value = false;
        controller = null;
      }
    }

    function stop() {
      if (controller) controller.abort();
    }

    function usePreset(p) {
      if (preference.value.includes(p)) return;   // 重复点就不再加一遍
      preference.value = preference.value.trim()
        ? preference.value.trim().replace(/[；;]\s*$/, '') + '；' + p
        : p;
    }

    return {
      list, destId, days, preference, text, status, error, running,
      current, rendered, PRESETS, start, stop, usePreset,
    };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">AI 行程规划</h1>

      <div class="ai-layout">
        <aside class="ai-form">
          <label class="ai-label">目的地</label>
          <select class="ai-input" v-model.number="destId">
            <option v-for="d in list" :key="d.id" :value="d.id">
              {{ d.name }} · {{ d.category }} · {{ d.location }}
            </option>
          </select>

          <label class="ai-label">玩几天</label>
          <input class="ai-input" type="number" min="1" max="15" v-model.number="days" />

          <label class="ai-label">旅行偏好（选填）</label>
          <textarea class="ai-input" rows="3" v-model="preference"
            placeholder="例如：想吃地道小吃，不想太赶"></textarea>
          <div class="ai-presets">
            <button v-for="p in PRESETS" :key="p" type="button" class="ai-chip"
              @click="usePreset(p)">{{ p }}</button>
          </div>

          <button class="btn btn-primary ai-submit" :disabled="running || !destId" @click="start">
            {{ running ? '生成中…' : '✨ 生成行程' }}
          </button>
          <button v-if="running" class="btn btn-outline ai-submit" @click="stop">停止生成</button>

          <p class="ai-tip" v-if="current">
            会基于本站「{{ current.name }}」的 {{ current.attractions.length }} 个景点来排行程。
          </p>
        </aside>

        <section class="ai-output">
          <div class="empty" v-if="!text && !error && !status">
            <div class="icon">✨</div>
            <p>选好目的地和天数，点「生成行程」<br />AI 会排出一份逐日行程，边写边显示。</p>
          </div>

          <div class="ai-status" v-if="status"><span class="ai-dot"></span>{{ status }}</div>
          <div class="ai-error" v-if="error">{{ error }}</div>

          <article class="ai-markdown" :class="{ streaming: running }"
            v-if="text" v-html="rendered"></article>
        </section>
      </div>
    </div>
  `,
};

/* ---------- 预订页 ---------- */
// 复用 AI 规划页的两栏骨架（.ai-layout / .ai-form / .ai-label / .ai-input），
// 视觉上和 AI 页是同一套东西，不用为它新写样式。
// 日期相关的 localDate() / addMonths() / maxCheckInDate() 来自 api.js
// （两个文件都是普通 <script>，共享全局作用域），放在那边是因为下单校验也要用它们，
// 一份实现两处共用才不会漂移。
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];   // 周一开头：和 cells 里算前置空格的公式配套

const BookingPage = {
  setup() {
    const destinations = ref([]);
    const hotels = ref([]);
    const loading = ref(true);
    const loadError = ref('');
    const submitting = ref(false);
    const submitError = ref('');

    // 详情页点「立即预订」跳过来会带上 ?dest=ID，直接选中那个城市
    const destId = ref(route.value.query.dest ? Number(route.value.query.dest) : null);
    const hotelId = ref(null);
    const days = ref(3);
    const people = ref(2);
    const checkIn = ref(localDate(1));   // 默认明天：今天入住不太现实
    const today = localDate();           // 可订窗口的下界
    const maxDate = maxCheckInDate();    // 可订窗口的上界：今天起两个月（后端也会再挡一道）

    /* 日历当前显示的月份 'yyyy-MM'。从 checkIn 而不是 today 初始化：
       9/30 那天默认入住日是 10/01，用 today 会打开一个根本没有选中日的月份。 */
    const viewMonth = ref(checkIn.value.slice(0, 7));

    /* ---- 日历 ---- */
    const minMonth = today.slice(0, 7);
    const maxMonth = maxDate.slice(0, 7);

    /* 'yyyy-MM' → 连续的月序号。月份不能直接比字符串再拿去做加减，
       转成序号之后「上一个月」「下一个月」「到头了没」都是纯整数运算。
       注意全程不碰 Date：new Date('2026-12-01') 那类解析会把 addMonths()
       刚绕开的月末溢出问题重新引回来。 */
    const ymIndex = (s) => {
      const [y, m] = s.split('-').map(Number);
      return y * 12 + m - 1;
    };

    const canPrev = computed(() => ymIndex(viewMonth.value) > ymIndex(minMonth));
    const canNext = computed(() => ymIndex(viewMonth.value) < ymIndex(maxMonth));

    function shiftMonth(delta) {
      const c = Math.min(Math.max(ymIndex(viewMonth.value) + delta, ymIndex(minMonth)), ymIndex(maxMonth));
      viewMonth.value = `${Math.floor(c / 12)}-${String((c % 12) + 1).padStart(2, '0')}`;
    }

    const cells = computed(() => {
      const [y, m] = viewMonth.value.split('-').map(Number);
      // 前置空格：getDay() 是 0=周日，而这里第一列是周一，所以要 +6 再取模
      const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
      const total = daysInMonth(y, m - 1);
      const list = [];
      for (let i = 0; i < lead; i++) list.push(null);
      for (let d = 1; d <= total; d++) {
        const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        list.push({
          d,
          date,
          /* 下界也要判 —— 它才是原来 <input type="date" :min> 想做的事。
             顺带说一句：那个 :min 其实从来没生效过（这个页面没有 <form>，
             约束校验不会触发），所以日历是严格的升级，不是等价替换。 */
          disabled: date < today || date > maxDate,
          isToday: date === today,
          label: `${y} 年 ${m} 月 ${d} 日`,
        });
      }
      // 补满 42 格（6 行）：一个月的行数在 4~6 之间，不补齐的话左侧栏会随翻月忽高忽低
      while (list.length < 42) list.push(null);
      return list;
    });

    onMounted(async () => {
      try {
        destinations.value = await api.getDestinations();
        // 没带 ?dest= 时（直接从导航栏点「预订」进来）默认选第一个城市
        if (!destId.value && destinations.value.length) {
          destId.value = destinations.value[0].id;
        }
      } catch (e) {
        loadError.value = e.message;
      } finally {
        loading.value = false;
      }
    });

    // 目的地一变就重新拉酒店。immediate 让它首次也跑 ——
    // 带 ?dest= 进来时 destId 在 setup 阶段就填好了，不用等 onMounted
    watch(
      destId,
      async (id) => {
        hotels.value = [];
        // 【必须清空】否则会留着上一个城市的酒店 id，
        // 提交时后端一比对就报「该酒店不属于所选目的地」
        hotelId.value = null;
        if (!id) return;
        try {
          hotels.value = await api.getHotels(id);
          if (hotels.value.length) hotelId.value = hotels.value[0].id;
        } catch (e) {
          loadError.value = e.message;
        }
      },
      { immediate: true }
    );

    const currentHotel = computed(
      () => hotels.value.find((h) => h.id === hotelId.value) || null
    );

    /* 房间数 = ceil(人数 / 2)，每间住 2 人，恒 ≥ 1 —— 和后端 BookingService 同一套算法。
       Number() 不能省：<input type="number"> 被清空时 v-model.number 给出的是
       空字符串而不是 null，直接参与运算会变成 NaN。 */
    const rooms = computed(() => {
      const n = Number(people.value) || 0;
      return n > 0 ? Math.ceil(n / 2) : 1;
    });

    /* 实时预估，只是给用户看的。
       真正落库的金额由后端用数据库里的单价重新算一遍 —— 请求体里根本不带价格。 */
    const totalAmount = computed(() => {
      if (!currentHotel.value) return 0;
      return currentHotel.value.pricePerNight * rooms.value * (Number(days.value) || 0);
    });

    async function submit() {
      submitError.value = '';
      if (!hotelId.value) {
        submitError.value = '请先选择酒店';
        return;
      }
      submitting.value = true;
      try {
        await api.createBooking({
          destinationId: destId.value,
          hotelId: hotelId.value,
          checkIn: checkIn.value,
          days: Number(days.value),
          people: Number(people.value),
        });
        // 不弹提示，直接跳到订单列表：这单就在第一条，
        // 带着订单号和金额，比一闪而过的 toast 更有说服力
        go('/orders');
      } catch (e) {
        submitError.value = e.message;
      } finally {
        submitting.value = false;
      }
    }

    return {
      destinations, hotels, loading, loadError, submitting, submitError,
      destId, hotelId, days, people, checkIn, today, maxDate,
      WEEKDAYS, viewMonth, cells, canPrev, canNext, shiftMonth,
      currentHotel, rooms, totalAmount, submit,
    };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">预订</h1>

      <div class="empty" v-if="loading">
        <div class="icon">⏳</div>
        <p>加载中…</p>
      </div>

      <div class="empty" v-else-if="loadError">
        <div class="icon">🧭</div>
        <p>{{ loadError }}</p>
        <a class="btn btn-outline btn-sm" href="#/destinations">返回目的地</a>
      </div>

      <div class="ai-layout" v-else>
        <aside class="ai-form">
          <label class="ai-label">目的地</label>
          <select class="ai-input" v-model.number="destId">
            <option v-for="d in destinations" :key="d.id" :value="d.id">
              {{ d.name }} · {{ d.location }}
            </option>
          </select>

          <div class="ai-label" id="checkin-label">入住日期 · <b>{{ checkIn }}</b></div>
          <div class="cal" role="group" aria-labelledby="checkin-label">
            <div class="cal-head">
              <button type="button" class="cal-nav" aria-label="上个月"
                :disabled="!canPrev" @click="shiftMonth(-1)">‹</button>
              <span class="cal-title">{{ viewMonth.replace('-', ' 年 ') }} 月</span>
              <button type="button" class="cal-nav" aria-label="下个月"
                :disabled="!canNext" @click="shiftMonth(1)">›</button>
            </div>
            <div class="cal-week">
              <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
            </div>
            <div class="cal-grid">
              <!-- 空格子和日期格子共用 .cal-cell，保证七列等宽；
                   :key 不能只用下标 —— 翻月时格子数会变，纯下标会让 Vue 复用 DOM
                   留下上一轮的 :disabled -->
              <template v-for="(c, i) in cells" :key="c ? c.date : 'blank' + i">
                <span v-if="!c" class="cal-cell blank"></span>
                <button v-else type="button" class="cal-cell"
                  :class="{ active: c.date === checkIn, today: c.isToday }"
                  :disabled="c.disabled" :aria-label="c.label"
                  :aria-pressed="c.date === checkIn" @click="checkIn = c.date">{{ c.d }}</button>
              </template>
            </div>
          </div>
          <p class="ai-tip">可预订 {{ today }} 至 {{ maxDate }}（今起两个月内）</p>

          <label class="ai-label">入住天数</label>
          <input class="ai-input" type="number" min="1" max="15" v-model.number="days" />

          <label class="ai-label">入住人数</label>
          <input class="ai-input" type="number" min="1" max="20" v-model.number="people" />

          <p class="ai-tip">{{ people }} 人需要 {{ rooms }} 间房（每间住 2 人）</p>

          <button class="btn btn-primary ai-submit"
            :disabled="submitting || !hotelId" @click="submit">
            {{ submitting ? '提交中…' : '提交预订' }}
          </button>

          <div class="ai-error" v-if="submitError" style="margin-top: 12px;">{{ submitError }}</div>
        </aside>

        <section class="ai-output">
          <div class="book-head">
            <h2>选择酒店</h2>
            <span class="book-count" v-if="hotels.length">共 {{ hotels.length }} 家</span>
          </div>

          <div class="empty" v-if="!hotels.length">
            <div class="icon">🏨</div>
            <p>这个目的地还没有可预订的酒店</p>
          </div>

          <div class="hotel-list" v-else>
            <button v-for="h in hotels" :key="h.id" type="button"
              class="hotel-item" :class="{ active: hotelId === h.id }"
              @click="hotelId = h.id">
              <div class="hotel-main">
                <div class="hotel-name">
                  {{ h.name }}<span class="hotel-star">{{ '★'.repeat(h.star) }}</span>
                </div>
                <div class="hotel-sub">{{ h.district }} · {{ h.rating }} 分</div>
                <div class="hotel-desc">{{ h.desc }}</div>
              </div>
              <div class="hotel-side">
                <div class="hotel-price"><b>¥{{ h.pricePerNight }}</b><span>/间/晚</span></div>
                <div class="hotel-pick">{{ hotelId === h.id ? '已选' : '选择' }}</div>
              </div>
            </button>
          </div>

          <div class="book-total" v-if="currentHotel">
            <div class="book-total-text">
              {{ currentHotel.name }} · ¥{{ currentHotel.pricePerNight }}
              × {{ rooms }} 间 × {{ days }} 晚
            </div>
            <div class="book-total-price"><b>¥{{ totalAmount }}</b></div>
          </div>
        </section>
      </div>
    </div>
  `,
};

/* ---------- 我的订单页 ---------- */
const OrdersPage = {
  setup() {
    const list = ref([]);
    const loading = ref(true);
    const error = ref('');
    const cancelling = ref(0);   // 正在取消的订单 id，防止重复点

    async function load() {
      try {
        list.value = await api.getMyBookings();
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    onMounted(load);

    async function cancel(order) {
      cancelling.value = order.id;
      try {
        const updated = await api.cancelBooking(order.id);
        // 就地替换这一条，不重新拉整个列表 —— 省一次请求，也不会有列表跳动
        const i = list.value.findIndex((o) => o.id === order.id);
        if (i >= 0) list.value[i] = updated;
      } catch (e) {
        error.value = e.message;
      } finally {
        cancelling.value = 0;
      }
    }

    return { list, loading, error, cancelling, cancel };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">我的订单</h1>

      <div class="empty" v-if="loading">
        <div class="icon">⏳</div>
        <p>加载中…</p>
      </div>

      <div class="empty" v-else-if="error">
        <div class="icon">🧭</div>
        <p>{{ error }}</p>
        <a class="btn btn-outline btn-sm" href="#/booking">去预订</a>
      </div>

      <div class="empty" v-else-if="!list.length">
        <div class="icon">🧳</div>
        <p>还没有预订记录</p>
        <a class="btn btn-outline btn-sm" href="#/booking">去预订</a>
      </div>

      <div class="order-list" v-else>
        <article class="order-card" v-for="o in list" :key="o.id">
          <div class="order-head">
            <span class="order-hotel">{{ o.hotelName }}</span>
            <span class="order-status" :class="{ off: o.status === '已取消' }">{{ o.status }}</span>
          </div>

          <div class="order-sub">
            {{ o.destinationName }} · {{ o.checkIn }} 入住
            · {{ o.days }} 晚 · {{ o.people }} 人 {{ o.rooms }} 间
          </div>

          <div class="order-foot">
            <div class="order-no">订单号 {{ o.orderNo }}<br />下单于 {{ o.createdAt }}</div>
            <div class="order-right">
              <div class="order-price">
                ¥{{ o.unitPrice }} × {{ o.rooms }} 间 × {{ o.days }} 晚 =
                <b>¥{{ o.totalAmount }}</b>
              </div>
              <button class="btn btn-outline btn-danger btn-sm"
                v-if="o.status === '已预订'"
                :disabled="cancelling === o.id" @click="cancel(o)">
                {{ cancelling === o.id ? '取消中…' : '取消预订' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  `,
};

/* ---------- 根组件（导航 + 路由出口 + 页脚） ---------- */
const App = {
  setup() {
    const view = computed(() => {
      const { segments } = route.value;
      if (segments.length === 0) return { name: 'home' };
      if (segments[0] === 'login') return { name: 'login' };
      if (segments[0] === 'destinations' && segments.length === 1) return { name: 'list' };
      if (segments[0] === 'destinations' && segments.length === 2) {
        return { name: 'detail', id: Number(segments[1]) };
      }
      if (segments[0] === 'ai') return { name: 'ai' };
      // dest 带着 query 一起走，理由和上面 detail 带 id 一样：
      // 根模板的 :key 要用它，而模板里能读到的只有 view（setup 没返回 route）
      if (segments[0] === 'booking') return { name: 'booking', dest: route.value.query.dest || '' };
      if (segments[0] === 'orders') return { name: 'orders' };
      if (segments[0] === 'favorites') return { name: 'favorites' };
      if (segments[0] === 'settings') return { name: 'settings' };
      return { name: 'notfound' };
    });

    const navActive = computed(() => {
      const { segments } = route.value;
      if (segments.length === 0) return 'home';
      if (segments[0] === 'favorites') return 'favorites';
      if (segments[0] === 'destinations') return 'destinations';
      if (segments[0] === 'ai') return 'ai';
      if (segments[0] === 'booking') return 'booking';
      return '';
    });

    /* 用户中心下拉菜单：点空白处、按 Esc、切换路由时都自动收起 */
    const menuOpen = ref(false);
    const toggleMenu = () => (menuOpen.value = !menuOpen.value);
    const closeMenu = () => (menuOpen.value = false);

    onMounted(() => {
      document.addEventListener('click', closeMenu);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
      });
    });
    watch(route, closeMenu);

    // 「界面动画」开关：关闭时给 <html> 挂上 no-anim，用 CSS 关掉全部过渡
    watch(
      () => store.settings.animations,
      (on) => document.documentElement.classList.toggle('no-anim', !on),
      { immediate: true }
    );

    // 「字体大小」：把百分比换算成系数写到 <html> 的 --fs 上，全站字号跟着缩放
    watch(
      () => store.settings.fontScale,
      (pct) => document.documentElement.style.setProperty('--fs', Number(pct) / 100),
      { immediate: true }
    );

    const avatar = computed(() =>
      store.user ? store.user.username.slice(0, 1).toUpperCase() : '?'
    );

    return {
      view,
      navActive,
      menuOpen,
      toggleMenu,
      closeMenu,
      avatar,
      logout,
      store,
      favCount: computed(() => store.favorites.length),
    };
  },
  components: { HomePage, ListPage, DetailPage, FavoritesPage, SettingsPage, LoginPage, AiPage, BookingPage, OrdersPage },
  template: `
    <header class="site-header" v-if="view.name !== 'login'">
      <div class="header-inner">
        <a class="logo" href="#/">
          <span class="logo-mark">游</span>游迹
        </a>
        <nav class="main-nav">
          <a class="nav-link" href="#/" :class="{ active: navActive === 'home' }">首页</a>
          <a class="nav-link" href="#/destinations" :class="{ active: navActive === 'destinations' }">目的地</a>
          <a class="nav-link" href="#/ai" :class="{ active: navActive === 'ai' }">AI 规划</a>
          <a class="nav-link" href="#/booking" :class="{ active: navActive === 'booking' }">预订</a>
          <!-- 收藏数单独包一层：窄屏放不下这一截，靠 .fav-count 在 560px 断点隐藏 -->
          <a class="nav-link" href="#/favorites" :class="{ active: navActive === 'favorites' }">收藏<span
              class="fav-count" v-if="favCount"> ({{ favCount }})</span></a>

          <!-- 用户中心：头像 + 用户名即入口，退出登录收进下拉里 -->
          <div class="user-menu" v-if="store.user">
            <button
              class="user-chip"
              :class="{ open: menuOpen }"
              @click.stop="toggleMenu"
              aria-haspopup="menu"
              :aria-expanded="menuOpen"
            >
              <span class="user-avatar">{{ avatar }}</span>
              <span class="user-name">{{ store.user.username }}</span>
              <span class="caret">▾</span>
            </button>

            <div class="user-dropdown" v-if="menuOpen" @click.stop>
              <div class="dropdown-head">
                <span class="user-avatar lg">{{ avatar }}</span>
                <div>
                  <div class="dropdown-name">{{ store.user.username }}</div>
                  <div class="dropdown-sub">已登录 · 收藏 {{ favCount }} 个</div>
                </div>
              </div>
              <a class="dropdown-item" href="#/orders">我的订单</a>
              <a class="dropdown-item" href="#/favorites">我的收藏</a>
              <a class="dropdown-item" href="#/settings">设置</a>
              <div class="dropdown-sep"></div>
              <button class="dropdown-item danger" @click="logout">退出登录</button>
            </div>
          </div>
          <a v-else class="nav-link nav-login" href="#/login">登录 / 注册</a>
        </nav>
      </div>
    </header>

    <main>
      <HomePage v-if="view.name === 'home'" />
      <ListPage v-else-if="view.name === 'list'" />
      <DetailPage v-else-if="view.name === 'detail'" :id="view.id" :key="view.id" />
      <AiPage v-else-if="view.name === 'ai'" />
      <!-- :key 让它从 #/booking?dest=1 切到 #/booking?dest=2 时重新挂载，
           setup() 才会重读 query —— 和上面 DetailPage 的 :key="view.id" 同一个道理。
           注意只能用 view.dest，不能写 route.query.dest：setup 没有返回 route，
           模板里读到的是 undefined，一求值就整棵树渲染失败白屏。 -->
      <BookingPage v-else-if="view.name === 'booking'" :key="view.dest" />
      <OrdersPage v-else-if="view.name === 'orders'" />
      <FavoritesPage v-else-if="view.name === 'favorites'" />
      <SettingsPage v-else-if="view.name === 'settings'" />
      <LoginPage v-else-if="view.name === 'login'" />
      <div class="empty" v-else>
        <div class="icon">🧭</div>
        <p>页面不存在</p>
        <a class="btn btn-outline btn-sm" href="#/">返回首页</a>
      </div>
    </main>

    <footer class="site-footer" v-if="view.name !== 'login'">
      游迹 · 发现你的下一场旅行
    </footer>
  `,
};

// 挂载前先跑一次守卫：决定首次打开进入的是登录页还是首页
guardRoute();
createApp(App).mount('#app');
