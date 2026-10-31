/* =========================================================
 * pages/login.js — 登录 / 注册页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

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
