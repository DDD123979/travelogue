/* =========================================================
 * pages/profile.js — 我的主页
 *
 * 只显示自己的内容：头像、用户名、几个统计数字、我发布的分享。
 * 需要登录，未登录由路由守卫拦到登录页。
 * ========================================================= */

const ProfilePage = {
  setup() {
    const posts = ref([]);
    const loading = ref(true);
    const error = ref('');

    onMounted(async () => {
      document.title = '我的主页 · 游迹';
      try {
        posts.value = await api.getMyPosts();
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    });

    // 统计直接在前端从列表汇总，省一次接口
    const stats = computed(() => {
      const list = posts.value;
      const sum = (fn) => list.reduce((n, p) => n + (fn(p) || 0), 0);
      return {
        posts: list.length,
        likes: sum((p) => p.likeCount),
        comments: sum((p) => p.commentCount),
        favorites: sum((p) => p.favoriteCount),
      };
    });

    const avatar = computed(() =>
      (store.user ? (store.user.nickname || store.user.username) : '?').slice(0, 1).toUpperCase()
    );

    async function remove(post) {
      if (!window.confirm('删除这条分享？')) return;
      try {
        await api.deletePost(post.id);
        posts.value = posts.value.filter((p) => p.id !== post.id);
      } catch (e) {
        error.value = e.message;
      }
    }


    /** 缩略图地址：abc.jpg -> abc_thumb.jpg（上传时就生成了） */
    function thumbOf(src) {
      return String(src).replace(/(\.[a-zA-Z0-9]+)$/, '_thumb$1');
    }

    /** 缩略图不存在时退回原图，避免破图 */
    function onImgError(e, full) {
      if (e && e.target && e.target.src !== full) {
        e.target.src = full;
      }
    }

    function openImage(src) {
      window.open(src, '_blank');
    }

    return { store, posts, loading, error, stats, avatar, remove, openImage, thumbOf, onImgError, openViewer };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">我的主页</h1>

      <section class="profile-head">
        <div class="profile-avatar">
          <img v-if="store.user && store.user.avatar" :src="store.user.avatar" alt="头像" />
          <span v-else>{{ avatar }}</span>
        </div>
        <div class="profile-info">
          <div class="profile-name">
            {{ store.user ? (store.user.nickname || store.user.username) : '未登录' }}
            <a class="profile-edit" href="#/settings">编辑资料</a>
          </div>
          <div class="profile-sub">ID {{ store.user && store.user.userNo ? store.user.userNo : '--------' }} · @{{ store.user ? store.user.username : '-' }}</div>
        </div>
      </section>

      <section class="profile-stats">
        <div class="stat"><b>{{ stats.posts }}</b><span>发布</span></div>
        <div class="stat"><b>{{ stats.likes }}</b><span>获赞</span></div>
        <div class="stat"><b>{{ stats.comments }}</b><span>收到评论</span></div>
        <div class="stat"><b>{{ stats.favorites }}</b><span>被收藏</span></div>
      </section>

      <h2 class="profile-section-title">我的分享</h2>

      <p class="ai-error" v-if="error">{{ error }}</p>
      <div class="loading" v-if="loading"><span></span><br />加载中…</div>

      <template v-else>
        <div class="post-list" v-if="posts.length">
          <article class="post-card" v-for="p in posts" :key="p.id">
            <header class="post-head">
              <span class="post-avatar">{{ avatar }}</span>
              <div class="post-meta">
                <div class="post-user">{{ p.nickname || p.username }}</div>
                <div class="post-time">{{ p.createdAt }}</div>
              </div>
              <a class="post-dest" :href="'#/destinations/' + p.destinationId">📍 {{ p.destinationName }}</a>
            </header>

            <p class="post-content">{{ p.content }}</p>

            <div class="post-gallery" v-if="p.images.length" :class="'n' + p.images.length">
              <img v-for="(src, i) in p.images" :key="src" :src="thumbOf(src)" alt="旅行照片"
                loading="lazy" decoding="async" @error="onImgError($event, src)" @click="openViewer(p.images, i)" />
            </div>

            <footer class="post-foot">
              <span class="post-action is-static">❤️ {{ p.likeCount || 0 }}</span>
              <span class="post-action is-static">💬 {{ p.commentCount || 0 }}</span>
              <span class="post-action is-static">⭐ {{ p.favoriteCount || 0 }}</span>
              <a class="post-action" :href="'#/community'">去社区看</a>
              <button class="post-del" @click="remove(p)">🗑 删除</button>
            </footer>
          </article>
        </div>

        <div class="empty" v-else>
          <div class="icon">✍️</div>
          <p>你还没有发布分享<br /><a href="#/community">去社区写第一篇 →</a></p>
        </div>
      </template>
    </div>
  `,
};
