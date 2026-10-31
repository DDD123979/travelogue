/* =========================================================
 * app.js — 根组件（导航 + 路由出口）与挂载
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */


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
      if (segments[0] === 'ranking') return { name: 'ranking' };
      if (segments[0] === 'community') return { name: 'community' };
      if (segments[0] === 'ai') return { name: 'ai' };
      // dest 带着 query 一起走，理由和上面 detail 带 id 一样：
      // 根模板的 :key 要用它，而模板里能读到的只有 view（setup 没返回 route）
      if (segments[0] === 'favorites') return { name: 'favorites' };
      if (segments[0] === 'settings') return { name: 'settings' };
      return { name: 'notfound' };
    });

    const navActive = computed(() => {
      const { segments } = route.value;
      if (segments.length === 0) return 'home';
      if (segments[0] === 'favorites') return 'favorites';
      if (segments[0] === 'destinations') return 'destinations';
      if (segments[0] === 'ranking') return 'ranking';
      if (segments[0] === 'community') return 'community';
      if (segments[0] === 'ai') return 'ai';
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
  components: { HomePage, ListPage, DetailPage, RankingPage, CommunityPage, FavoritesPage, SettingsPage, LoginPage, AiPage },
  template: `
    <header class="site-header" v-if="view.name !== 'login'">
      <div class="header-inner">
        <a class="logo" href="#/">
          <img class="logo-img" src="img/logo.svg" alt="游迹" />
          <span class="logo-text">游迹</span>
        </a>
        <nav class="main-nav">
          <a class="nav-link" href="#/" :class="{ active: navActive === 'home' }">首页🤩</a>
          <a class="nav-link" href="#/destinations" :class="{ active: navActive === 'destinations' }">目的地🤑</a>
          <a class="nav-link" href="#/ranking" :class="{ active: navActive === 'ranking' }">排行😋</a>
          <a class="nav-link" href="#/community" :class="{ active: navActive === 'community' }">社区💬</a>
          <a class="nav-link nav-ai" href="#/ai" :class="{ active: navActive === 'ai' }">小迹AI智能导游🤖</a>

          <!-- 收藏不再占导航位：右上角用户菜单里已经有「我的收藏」，收藏数量也在菜单头部显示 -->

          <!-- 用户中心：头像 + 用户名即入口，退出登录收进下拉里 -->
          <div class="user-menu" v-if="store.user">
            <button
              class="user-chip"
              :class="{ open: menuOpen }"
              @click.stop="toggleMenu"
              aria-haspopup="menu"
              :aria-expanded="menuOpen"
            >
              <img v-if="store.user && store.user.avatar" class="user-avatar avatar-img" :src="store.user.avatar" alt="头像" />
              <span v-else class="user-avatar">{{ avatar }}</span>
              <span class="user-name">{{ store.user.username }}</span>
              <span class="caret">▾</span>
            </button>

            <div class="user-dropdown" v-if="menuOpen" @click.stop>
              <div class="dropdown-head">
                <img v-if="store.user && store.user.avatar" class="user-avatar lg avatar-img" :src="store.user.avatar" alt="头像" />
                  <span v-else class="user-avatar lg">{{ avatar }}</span>
                <div>
                  <div class="dropdown-name">{{ store.user.username }}</div>
                  <div class="dropdown-sub">已登录 · 收藏 {{ favCount }} 个</div>
                </div>
              </div>
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
      <RankingPage v-else-if="view.name === 'ranking'" />
      <CommunityPage v-else-if="view.name === 'community'" />
      <AiPage v-else-if="view.name === 'ai'" />
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
/* Vue 会自己捕获渲染错误（不会冒泡到 window.onerror），
   所以这里挂一个 errorHandler 把真实报错写到页面底部，白屏时能一眼看到原因。 */
function reportVueError(err, info) {
  // err 有时是 Proxy（Vue 内部对象），直接 String() 会抛 "Cannot convert object to primitive value"
  let msg = '';
  try {
    msg = (err && (err.stack || err.message)) ? String(err.stack || err.message) : String(err);
  } catch (e) {
    msg = "（错误对象无法序列化）";
  }
  console.error('[vue]', msg, info);
  let box = document.getElementById('boot-error');
  if (!box) {
    box = document.createElement('div');
    box.id = 'boot-error';
    box.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;' +
      'background:#b91c1c;color:#fff;padding:16px 18px;font:700 16px/1.7 Consolas,monospace;' +
      'white-space:pre-wrap;max-height:60vh;overflow:auto';
    document.body.appendChild(box);
  }
  box.textContent += '[vue:' + info + '] ' + msg + '\n';
  // 同时写进标签标题，截图里的 tab 就能直接看到
  document.title = '[ERR] ' + msg.split('\n')[0].slice(0, 80);
}

const app = createApp(App);
app.config.errorHandler = reportVueError;
try {
  app.mount('#app');
} catch (e) {
  reportVueError(e, 'mount');
}
