/* =========================================================
 * pages/settings.js — 设置页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

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

    /* ---------- 头像 ---------- */
    const uploadingAvatar = ref(false);

    async function onAvatar(e) {
      const file = (e.target.files || [])[0];
      e.target.value = '';                 // 允许重复选同一张
      if (!file) return;
      uploadingAvatar.value = true;
      try {
        const res = await api.updateAvatar(file);
        store.user = { ...store.user, avatar: res.avatar };
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
        session.avatar = res.avatar;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        flash('头像已更新');
      } catch (err) {
        flash(err.message);
      } finally {
        uploadingAvatar.value = false;
      }
    }

    /* ---------- 改昵称 ---------- */
    const displayName = computed(() => {
      const u = store.user;
      if (!u) return '未登录';
      return u.nickname || u.username;
    });

    const nickOpen = ref(false);
    const newNick = ref('');
    const savingNick = ref(false);

    function openNick() {
      newNick.value = store.user ? (store.user.nickname || store.user.username) : '';
      nickOpen.value = true;
    }

    function closeNick() {
      nickOpen.value = false;
      newNick.value = '';
    }

    async function submitNick() {
      if (savingNick.value) return;
      const nick = newNick.value.trim();
      if (!nick) return flash('昵称不能为空');
      if (nick.length > 20) return flash('昵称最多 20 个字');
      savingNick.value = true;
      try {
        await api.changeNickname(nick);
        store.user = { ...store.user, nickname: nick };
        flash('昵称已更新');
        closeNick();
      } catch (err) {
        flash(err.message);
      } finally {
        savingNick.value = false;
      }
    }

    /* ---------- 改密码 ---------- */
    const oldPw = ref('');
    const newPw = ref('');
    const newPw2 = ref('');
    const savingPw = ref(false);
    // change = 知道原密码；reset = 忘了原密码，凭登录态直接重设
    const pwMode = ref('change');
    const pwOpen = ref(false);

    function openPw() {
      pwMode.value = 'change';
      oldPw.value = newPw.value = newPw2.value = '';
      pwOpen.value = true;
    }

    // ESC 关闭弹窗；组件卸载时记得摘掉监听
    function onEsc(e) {
      if (e.key !== 'Escape') return;
      if (pwOpen.value) closePw();
    }
    onMounted(() => window.addEventListener('keydown', onEsc));
    onUnmounted(() => window.removeEventListener('keydown', onEsc));

    function closePw() {
      pwOpen.value = false;
      oldPw.value = newPw.value = newPw2.value = '';
      pwMode.value = 'change';
    }

    function togglePwMode() {
      pwMode.value = pwMode.value === 'change' ? 'reset' : 'change';
      oldPw.value = newPw.value = newPw2.value = '';
    }

    async function submitReset() {
      if (savingPw.value) return;
      if (newPw.value.length < 6) return flash('新密码至少 6 位');
      if (newPw.value !== newPw2.value) return flash('两次输入的新密码不一致');
      savingPw.value = true;
      try {
        await api.resetPassword(newPw.value);
        flash('密码已重设，正在退出…');
        // 服务端已吊销 token，这里同步清掉本地会话并回登录页
        setTimeout(() => {
          logout();
          go('/login');
        }, 900);
      } catch (err) {
        flash(err.message);
      } finally {
        savingPw.value = false;
      }
    }

    async function submitPw() {
      if (savingPw.value) return;
      if (!oldPw.value) return flash('请输入原密码');
      if (newPw.value.length < 6) return flash('新密码至少 6 位');
      if (newPw.value !== newPw2.value) return flash('两次输入的新密码不一致');
      savingPw.value = true;
      try {
        await api.changePassword(oldPw.value, newPw.value);
        flash('密码已更新');
        closePw();
      } catch (err) {
        flash(err.message);
      } finally {
        savingPw.value = false;
      }
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
      uploadingAvatar,
      onAvatar,
      oldPw,
      newPw,
      newPw2,
      savingPw,
      submitPw,
      displayName, nickOpen, newNick, savingNick, openNick, closeNick, submitNick,
      pwMode,
      pwOpen,
      openPw,
      closePw,
      togglePwMode,
      submitReset,
    };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">设置</h1>

      <section class="settings-card">
        <div class="setting-row">
          <div class="account-left">
            <img v-if="store.user && store.user.avatar" class="user-avatar lg avatar-img" :src="store.user.avatar" alt="头像" />
            <span v-else class="user-avatar lg">{{ avatar }}</span>
            <div>
              <div class="title">{{ displayName }}</div>
              <div class="desc">ID {{ store.user && store.user.userNo ? store.user.userNo : '--------' }} · @{{ store.user ? store.user.username : '-' }} · 收藏 {{ store.favorites.length }} 个</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" @click="logout">退出登录</button>
        </div>
      </section>

      <section class="settings-card">
        <h2>昵称</h2>
        <div class="setting-row">
          <div>
            <div class="title">{{ displayName }}</div>
            <div class="desc">社区和主页里显示的名字，可以和登录名不同</div>
          </div>
          <button class="btn btn-outline btn-sm" @click="openNick">修改昵称</button>
        </div>
      </section>

      <section class="settings-card">
        <h2>头像</h2>
        <div class="setting-row avatar-row">
          <div class="avatar-preview">
            <img v-if="store.user && store.user.avatar" :src="store.user.avatar" alt="我的头像" />
            <span v-else class="user-avatar lg">{{ avatar }}</span>
          </div>
          <div class="avatar-actions">
            <label class="btn btn-outline btn-sm">
              {{ uploadingAvatar ? '上传中…' : '更换头像' }}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onAvatar" />
            </label>
            <div class="desc">支持 jpg / png / webp，建议用正方形，单张不超过 5MB</div>
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h2>密码</h2>
        <div class="setting-row">
          <div>
            <div class="title">登录密码</div>
            <div class="desc">定期更换更安全；忘记原密码时也可以在弹窗里重设</div>
          </div>
          <button class="btn btn-outline btn-sm" @click="openPw">修改密码</button>
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

      <!-- 修改昵称弹窗 -->
      <div class="modal-mask" v-if="nickOpen" @click.self="closeNick">
        <div class="modal">
          <div class="modal-head">
            <span>修改昵称</span>
            <button class="modal-close" @click="closeNick" aria-label="关闭">×</button>
          </div>
          <div class="modal-body">
            <label class="modal-label">昵称</label>
            <input class="ai-input" v-model="newNick" placeholder="最多 20 个字" maxlength="20" />
            <p class="modal-tip">昵称只影响展示，登录时仍然用用户名 @{{ store.user ? store.user.username : '' }}</p>
          </div>
          <div class="modal-foot">
            <span class="modal-spacer"></span>
            <button class="btn btn-outline btn-sm" @click="closeNick">取消</button>
            <button class="btn btn-primary btn-sm" :disabled="savingNick" @click="submitNick">
              {{ savingNick ? '保存中…' : '确定' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 修改密码弹窗 -->
      <div class="modal-mask" v-if="pwOpen" @click.self="closePw">
        <div class="modal">
          <div class="modal-head">
            <span>{{ pwMode === 'change' ? '修改密码' : '重设密码' }}</span>
            <button class="modal-close" @click="closePw" aria-label="关闭">×</button>
          </div>

          <div class="modal-body">
            <label class="modal-label">原密码</label>
            <input
              v-if="pwMode === 'change'"
              class="ai-input"
              type="password"
              v-model="oldPw"
              placeholder="当前使用的密码"
              autocomplete="current-password"
            />
            <p class="modal-note" v-else>已登录状态，不需要原密码</p>

            <label class="modal-label">新密码</label>
            <input class="ai-input" type="password" v-model="newPw" placeholder="至少 6 位" autocomplete="new-password" />

            <label class="modal-label">确认新密码</label>
            <input class="ai-input" type="password" v-model="newPw2" placeholder="再输一次" autocomplete="new-password" />

            <p class="modal-tip" v-if="pwMode === 'reset'">重设成功后会自动退出登录，请用新密码重新登录</p>
          </div>

          <div class="modal-foot">
            <button class="modal-link" v-if="pwMode === 'change'" @click="togglePwMode">忘记原密码？</button>
            <button class="modal-link" v-else @click="togglePwMode">← 返回修改密码</button>
            <span class="modal-spacer"></span>
            <button class="btn btn-outline btn-sm" @click="closePw">取消</button>
            <button class="btn btn-primary btn-sm" :disabled="savingPw"
              @click="pwMode === 'change' ? submitPw() : submitReset()">
              {{ savingPw ? '处理中…' : '确定' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};

// 登录 / 注册页（同一页面，tab 切换）
