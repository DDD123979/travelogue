/* =========================================================
 * pages/login.js — 登录 / 注册页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

const LoginPage = {
  setup() {
    // mode: 'login' | 'register' | 'forgot'，支持 #/login 和 #/login?mode=register
    const mode = ref(route.value.query.mode === 'register' ? 'register' : 'login');
    const username = ref('');
    const password = ref('');
    const confirm = ref('');
    const error = ref('');
    const loading = ref(false);

    /* ---------- 忘记密码 ---------- */
    const code = ref('');
    const newPw = ref('');
    const newPw2 = ref('');
    const sending = ref(false);
    const codeSent = ref(false);
    const demoCode = ref('');
    const ok = ref('');

    async function sendCode() {
      error.value = '';
      ok.value = '';
      const name = username.value.trim();
      if (!name) { error.value = '请先填写用户名'; return; }
      sending.value = true;
      try {
        const res = await api.forgotPassword(name);
        codeSent.value = true;
        demoCode.value = res.code || '';
        ok.value = res.code
          ? '验证码已生成（演示环境直接显示在下方）'
          : '如果该账号存在，验证码已生成，请查收';
      } catch (e) {
        error.value = e.message;
      } finally {
        sending.value = false;
      }
    }

    async function submitForgot() {
      error.value = '';
      ok.value = '';
      const name = username.value.trim();
      if (!name) { error.value = '请输入用户名'; return; }
      if (code.value.trim().length !== 6) { error.value = '请输入 6 位验证码'; return; }
      if (newPw.value.length < 6) { error.value = '新密码至少 6 位'; return; }
      if (newPw.value !== newPw2.value) { error.value = '两次输入的新密码不一致'; return; }

      loading.value = true;
      try {
        await api.resetWithCode(name, code.value.trim(), newPw.value);
        switchMode('login');
        ok.value = '密码已重设，请用新密码登录';
        password.value = '';
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    function switchMode(m) {
      mode.value = m;
      error.value = '';
      ok.value = '';
      if (m !== 'forgot') {
        code.value = '';
        newPw.value = '';
        newPw2.value = '';
        demoCode.value = '';
        codeSent.value = false;
      }
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
        store.user = { username: user.username, nickname: user.nickname, avatar: user.avatar, userNo: user.userNo };
        // 登录成功后进入首页，并顶掉历史里的登录页
        go('/', { replace: true });
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    return {
      mode, username, password, confirm, error, loading, switchMode, submit,
      code, newPw, newPw2, sending, codeSent, demoCode, ok, sendCode, submitForgot,
    };
  },
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="logo-mark auth-logo">游</span>
          <h1>游迹</h1>
          <p>发现你的下一场旅行</p>
        </div>

        <div class="auth-tabs" v-if="mode !== 'forgot'">
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

        <form class="auth-form" v-if="mode !== 'forgot'" @submit.prevent="submit">
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

        <p class="auth-forgot-link" v-if="mode === 'login'">
          <a href="javascript:;" @click="switchMode('forgot')">忘记密码？</a>
        </p>

        <form class="auth-form" v-if="mode === 'forgot'" @submit.prevent="submitForgot">
          <input v-model="username" placeholder="用户名" autocomplete="username" />
          <div class="auth-code-row">
            <input v-model="code" placeholder="6 位验证码" maxlength="6" inputmode="numeric" />
            <button type="button" class="btn btn-outline btn-sm" :disabled="sending" @click="sendCode">
              {{ sending ? '获取中…' : (codeSent ? '重新获取' : '获取验证码') }}
            </button>
          </div>
          <p class="auth-note" v-if="demoCode">演示环境验证码：<b>{{ demoCode }}</b>（5 分钟内有效）</p>
          <input v-model="newPw" type="password" placeholder="新密码（至少 6 位）" autocomplete="new-password" />
          <input v-model="newPw2" type="password" placeholder="确认新密码" autocomplete="new-password" />

          <div class="auth-error" v-if="error">{{ error }}</div>
          <div class="auth-ok" v-if="ok">{{ ok }}</div>

          <button class="btn btn-primary auth-submit" type="submit" :disabled="loading">
            {{ loading ? '处理中…' : '重设密码' }}
          </button>

          <p class="auth-switch-tip">想起来了？<a href="javascript:;" @click="switchMode('login')">返回登录</a></p>
        </form>

        <p class="auth-switch-tip" v-if="mode !== 'forgot'">
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
