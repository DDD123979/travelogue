/* =========================================================
 * pages/community.js — 社区：旅行分享（心得 + 照片 + 点赞/收藏/评论）
 *
 * 浏览不需要登录；发帖、点赞、收藏、评论、删除都要登录。
 * 照片先上传（/api/uploads）拿到地址，再把地址随正文一起发帖。
 * ========================================================= */

const CommunityPage = {
  setup() {
    const posts = ref([]);
    const destinations = ref([]);
    const loading = ref(true);
    const error = ref('');

    // 筛选：0 = 全部城市；favOnly = 只看我收藏的
    const filterDest = ref(0);
    const favOnly = ref(false);

    // 发布面板
    const formOpen = ref(false);
    const formDest = ref(null);
    const formContent = ref('');
    const formImages = ref([]);
    const uploading = ref(false);
    const submitting = ref(false);
    const formError = ref('');

    const MAX_IMAGES = 4;
    const MAX_CONTENT = 800;

    // 每条帖子的评论区面板：id -> { open, list, loading, text, sending }
    const panels = reactive({});

    onMounted(async () => {
      try {
        const [list, dests] = await Promise.all([api.getPosts(), api.getDestinations()]);
        posts.value = list;
        destinations.value = dests;
        if (dests.length) formDest.value = dests[0].id;
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    });

    const visiblePosts = computed(() =>
      filterDest.value
        ? posts.value.filter((p) => p.destinationId === filterDest.value)
        : posts.value
    );

    const canSubmit = computed(
      () => formContent.value.trim().length > 0 && formDest.value && !submitting.value && !uploading.value
    );

    function needLogin() {
      if (store.user) return false;
      go('/login');
      return true;
    }

    function toggleForm() {
      formOpen.value = !formOpen.value;
      formError.value = '';
    }

    async function onPickImages(event) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      formError.value = '';
      for (const file of files) {
        if (formImages.value.length >= MAX_IMAGES) {
          formError.value = `最多 ${MAX_IMAGES} 张照片`;
          break;
        }
        uploading.value = true;
        try {
          const res = await api.uploadImage(file);
          formImages.value.push({ url: res.url });
        } catch (e) {
          formError.value = e.message;
          break;
        } finally {
          uploading.value = false;
        }
      }
    }

    function removeImage(idx) {
      formImages.value.splice(idx, 1);
    }

    async function submit() {
      if (!canSubmit.value) return;
      if (needLogin()) return;
      submitting.value = true;
      formError.value = '';
      try {
        const created = await api.createPost({
          destinationId: formDest.value,
          content: formContent.value.trim(),
          images: formImages.value.map((i) => i.url),
        });
        posts.value.unshift(created);
        formContent.value = '';
        formImages.value = [];
        formOpen.value = false;
      } catch (e) {
        formError.value = e.message;
      } finally {
        submitting.value = false;
      }
    }

    /* ---------- 点赞 / 收藏 ---------- */

    async function like(post) {
      if (needLogin()) return;
      try {
        const res = await api.likePost(post.id);
        post.liked = res.liked;
        post.likeCount = res.likeCount;
      } catch (e) {
        formError.value = e.message;
      }
    }

    async function favorite(post) {
      if (needLogin()) return;
      try {
        const res = await api.favoritePost(post.id);
        post.favorited = res.favorited;
        // 在「我的收藏」里取消收藏，这条应该立刻消失
        if (favOnly.value && !res.favorited) {
          posts.value = posts.value.filter((p) => p.id !== post.id);
        }
      } catch (e) {
        formError.value = e.message;
      }
    }

    async function toggleFavOnly() {
      if (!store.user) { go('/login'); return; }
      favOnly.value = !favOnly.value;
      await reload();
    }

    async function reload() {
      loading.value = true;
      try {
        posts.value = await api.getPosts(null, favOnly.value);
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    /* ---------- 评论 ---------- */

    function panelOf(post) {
      if (!panels[post.id]) {
        panels[post.id] = { open: false, list: [], loaded: false, loading: false, text: '', sending: false };
      }
      return panels[post.id];
    }

    async function toggleComments(post) {
      const panel = panelOf(post);
      panel.open = !panel.open;
      if (panel.open && !panel.loaded) {
        panel.loading = true;
        try {
          panel.list = await api.getComments(post.id);
          panel.loaded = true;
          post.commentCount = panel.list.length;
        } catch (e) {
          formError.value = e.message;
        } finally {
          panel.loading = false;
        }
      }
    }

    async function addComment(post) {
      if (needLogin()) return;
      const panel = panelOf(post);
      const text = panel.text.trim();
      if (!text) return;
      panel.sending = true;
      try {
        const created = await api.addComment(post.id, text);
        panel.list.push(created);
        panel.text = '';
        panel.loaded = true;
        post.commentCount = panel.list.length;
      } catch (e) {
        formError.value = e.message;
      } finally {
        panel.sending = false;
      }
    }

    async function removeComment(post, comment) {
      if (!window.confirm('删除这条评论？')) return;
      try {
        await api.deleteComment(comment.id);
        const panel = panelOf(post);
        panel.list = panel.list.filter((c) => c.id !== comment.id);
        post.commentCount = panel.list.length;
      } catch (e) {
        formError.value = e.message;
      }
    }

    /* ---------- 其他 ---------- */

    async function remove(post) {
      if (!window.confirm('删除这条分享？')) return;
      try {
        await api.deletePost(post.id);
        posts.value = posts.value.filter((p) => p.id !== post.id);
      } catch (e) {
        formError.value = e.message;
      }
    }

    function isMine(post) {
      return store.user && post.username === store.user.username;
    }

    function isMineComment(comment) {
      return store.user && comment.username === store.user.username;
    }

    function avatarOf(name) {
      return (name || '游').slice(0, 1).toUpperCase();
    }

    function openImage(src) {
      window.open(src, '_blank');
    }

    return {
      store,
      posts,
      destinations,
      loading,
      error,
      filterDest,
      favOnly,
      visiblePosts,
      formOpen,
      formDest,
      formContent,
      formImages,
      uploading,
      submitting,
      formError,
      MAX_IMAGES,
      MAX_CONTENT,
      canSubmit,
      panels,
      toggleForm,
      onPickImages,
      removeImage,
      submit,
      like,
      favorite,
      toggleFavOnly,
      panelOf,
      toggleComments,
      addComment,
      removeComment,
      remove,
      isMine,
      isMineComment,
      avatarOf,
      openImage,
    };
  },
  template: `
    <div class="page container">
      <div class="page-head">
        <h1 class="page-title">社区</h1>
        <button class="btn btn-primary btn-sm" @click="toggleForm">
          {{ formOpen ? '收起' : '✍️ 分享我的旅行' }}
        </button>
      </div>
      <p class="rank-sub">刚回来？把心得和照片写下来，给后面去的人一点参考。</p>

      <section class="post-form" v-if="formOpen">
        <div class="post-form-row">
          <label class="post-label">去哪儿了</label>
          <select class="ai-input" v-model.number="formDest">
            <option v-for="d in destinations" :key="d.id" :value="d.id">
              {{ d.name }} · {{ d.location }}
            </option>
          </select>
        </div>

        <textarea class="ai-input post-textarea" rows="4" v-model="formContent"
          :maxlength="MAX_CONTENT"
          placeholder="这次旅行最值得说的是什么？踩过的坑也欢迎写下来…"></textarea>
        <div class="post-count">{{ formContent.length }} / {{ MAX_CONTENT }}</div>

        <div class="post-photos">
          <div class="post-photo" v-for="(img, i) in formImages" :key="img.url">
            <img :src="img.url" alt="已上传的照片" />
            <button class="photo-remove" @click="removeImage(i)" title="移除">×</button>
          </div>
          <label class="post-photo-add" v-if="formImages.length < MAX_IMAGES">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden @change="onPickImages" />
            <span v-if="uploading">上传中…</span>
            <span v-else>＋ 照片</span>
          </label>
        </div>

        <p class="post-hint">支持 jpg / png / webp，单张不超过 5MB，最多 {{ MAX_IMAGES }} 张</p>

        <button class="btn btn-primary" :disabled="!canSubmit" @click="submit">
          {{ submitting ? '发布中…' : '发布分享' }}
        </button>
      </section>

      <p class="ai-error" v-if="formError">{{ formError }}</p>

      <div class="filter-bar">
        <div class="filter-tabs">
          <button class="filter-tab" :class="{ active: !favOnly && filterDest === 0 }"
            @click="favOnly = false; filterDest = 0; reload()">全部</button>
          <button class="filter-tab" :class="{ active: favOnly }" @click="toggleFavOnly">⭐ 我的收藏</button>
          <button
            v-for="d in destinations.filter((x) => posts.some((p) => p.destinationId === x.id))"
            :key="d.id"
            class="filter-tab"
            :class="{ active: !favOnly && filterDest === d.id }"
            @click="favOnly = false; filterDest = d.id"
          >{{ d.name }}</button>
        </div>
      </div>

      <div class="loading" v-if="loading"><span></span><br />加载中…</div>

      <template v-else>
        <div class="post-list" v-if="visiblePosts.length">
          <article class="post-card" v-for="p in visiblePosts" :key="p.id">
            <header class="post-head">
              <img v-if="p.avatar" class="post-avatar post-avatar-img" :src="p.avatar" :alt="p.username" />
              <span v-else class="post-avatar">{{ avatarOf(p.nickname || p.username) }}</span>
              <div class="post-meta">
                <div class="post-user">{{ p.nickname || p.username }}</div>
                <div class="post-time">{{ p.createdAt }}</div>
              </div>
              <a class="post-dest" :href="'#/destinations/' + p.destinationId">📍 {{ p.destinationName }}</a>
            </header>

            <p class="post-content">{{ p.content }}</p>

            <div class="post-gallery" v-if="p.images.length" :class="'n' + p.images.length">
              <img v-for="src in p.images" :key="src" :src="src" alt="旅行照片"
                loading="lazy" @click="openImage(src)" />
            </div>

            <footer class="post-foot">
              <button class="post-action" :class="{ on: p.liked }" @click="like(p)">
                {{ p.liked ? '❤️' : '🤍' }} {{ p.likeCount || 0 }}
              </button>
              <button class="post-action" :class="{ on: p.favorited }" @click="favorite(p)">
                {{ p.favorited ? '⭐' : '☆' }} {{ p.favorited ? '已收藏' : '收藏' }}
              </button>
              <button class="post-action" :class="{ on: panels[p.id] && panels[p.id].open }" @click="toggleComments(p)">
                💬 {{ p.commentCount || 0 }}
              </button>
              <button class="post-del" v-if="isMine(p)" @click="remove(p)" title="删除这条分享">🗑 删除</button>
            </footer>

            <section class="post-comments" v-if="panels[p.id] && panels[p.id].open">
              <div class="comment-loading" v-if="panels[p.id].loading">加载评论…</div>
              <ul class="comment-list" v-else-if="panels[p.id].list.length">
                <li class="comment-item" v-for="c in panels[p.id].list" :key="c.id">
                  <img v-if="c.avatar" class="comment-avatar" :src="c.avatar" :alt="c.username" />
                  <span class="comment-who">{{ c.nickname || c.username }}</span>
                  <span class="comment-text">{{ c.content }}</span>
                  <span class="comment-time">{{ c.createdAt }}</span>
                  <button class="comment-del" v-if="isMineComment(c)" @click="removeComment(p, c)">删除</button>
                </li>
              </ul>
              <p class="comment-empty" v-else>还没有评论，说两句？</p>

              <div class="comment-form">
                <input class="ai-input" v-model="panels[p.id].text" maxlength="300"
                  placeholder="说点什么…" @keyup.enter="addComment(p)" />
                <button class="btn btn-primary btn-sm" :disabled="panels[p.id].sending" @click="addComment(p)">
                  {{ panels[p.id].sending ? '发送中…' : '发送' }}
                </button>
              </div>
            </section>
          </article>
        </div>

        <div class="empty" v-else>
          <div class="icon">📮</div>
          <p v-if="favOnly">还没有收藏的分享，点卡片上的 ☆ 收藏一条试试</p>
          <p v-else>还没有人分享{{ filterDest ? '这里' : '' }}的旅行，来写第一篇吧</p>
        </div>
      </template>
    </div>
  `,
};
