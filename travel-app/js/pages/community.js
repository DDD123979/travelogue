/* =========================================================
 * pages/community.js — 社区：旅行分享（心得 + 照片）
 *
 * 登录后才能发布 / 点赞 / 删除；浏览列表不需要登录。
 * 照片先上传（/api/uploads）拿到地址，再把地址随正文一起发帖，
 * 这样发帖请求本身就是普通 JSON，失败时不会丢掉已上传的图。
 * ========================================================= */

const CommunityPage = {
  setup() {
    const posts = ref([]);
    const destinations = ref([]);
    const loading = ref(true);
    const error = ref('');

    // 列表筛选：0 表示全部城市
    const filterDest = ref(0);

    // 发布面板
    const formOpen = ref(false);
    const formDest = ref(null);
    const formContent = ref('');
    const formImages = ref([]);       // [{ url }]
    const uploading = ref(false);
    const submitting = ref(false);
    const formError = ref('');

    const MAX_IMAGES = 4;
    const MAX_CONTENT = 800;

    onMounted(async () => {
      try {
        const [list, dests] = await Promise.all([
          api.getPosts(),
          api.getDestinations(),
        ]);
        posts.value = list;
        destinations.value = dests;
        if (dests.length) formDest.value = dests[0].id;
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    });

    // 按城市筛选：本地过滤，不用每次重新请求
    const visiblePosts = computed(() =>
      filterDest.value
        ? posts.value.filter((p) => p.destinationId === filterDest.value)
        : posts.value
    );

    const canSubmit = computed(
      () => formContent.value.trim().length > 0 && formDest.value && !submitting.value && !uploading.value
    );

    function toggleForm() {
      formOpen.value = !formOpen.value;
      formError.value = '';
    }

    // 选图后逐张上传，成功一张就显示一张
    async function onPickImages(event) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';           // 允许再次选同一张
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

    async function like(post) {
      try {
        const updated = await api.likePost(post.id);
        const i = posts.value.findIndex((p) => p.id === post.id);
        if (i >= 0) posts.value[i] = updated;
      } catch (e) {
        formError.value = e.message;
      }
    }

    async function remove(post) {
      if (!window.confirm('删除这条分享？')) return;
      try {
        await api.deletePost(post.id);
        posts.value = posts.value.filter((p) => p.id !== post.id);
      } catch (e) {
        formError.value = e.message;
      }
    }

    function openImage(src) {
      window.open(src, '_blank');
    }

    function isMine(post) {
      return store.user && post.username === store.user.username;
    }

    function avatarOf(name) {
      return (name || '游').slice(0, 1).toUpperCase();
    }

    return {
      store,
      posts,
      destinations,
      loading,
      error,
      filterDest,
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
      toggleForm,
      onPickImages,
      removeImage,
      submit,
      like,
      remove,
      openImage,
      isMine,
      avatarOf,
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

      <!-- 发布面板 -->
      <section class="post-form" v-if="formOpen">
        <div class="post-form-row">
          <label class="post-label">去哪儿了</label>
          <select class="ai-input" v-model.number="formDest">
            <option v-for="d in destinations" :key="d.id" :value="d.id">
              {{ d.name }} · {{ d.location }}
            </option>
          </select>
        </div>

        <textarea
          class="ai-input post-textarea"
          rows="4"
          v-model="formContent"
          :maxlength="MAX_CONTENT"
          placeholder="这次旅行最值得说的是什么？踩过的坑也欢迎写下来…"
        ></textarea>
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
        <p class="ai-error" v-if="formError">{{ formError }}</p>

        <button class="btn btn-primary" :disabled="!canSubmit" @click="submit">
          {{ submitting ? '发布中…' : '发布分享' }}
        </button>
      </section>

      <!-- 筛选 + 列表 -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button class="filter-tab" :class="{ active: filterDest === 0 }" @click="filterDest = 0">全部</button>
          <button
            class="filter-tab"
            v-for="d in destinations.filter((x) => posts.some((p) => p.destinationId === x.id))"
            :key="d.id"
            :class="{ active: filterDest === d.id }"
            @click="filterDest = d.id"
          >{{ d.name }}</button>
        </div>
      </div>

      <div class="loading" v-if="loading"><span></span><br />加载中…</div>

      <template v-else>
        <div class="post-list" v-if="visiblePosts.length">
          <article class="post-card" v-for="p in visiblePosts" :key="p.id">
            <header class="post-head">
              <span class="post-avatar">{{ avatarOf(p.username) }}</span>
              <div class="post-meta">
                <div class="post-user">{{ p.username }}</div>
                <div class="post-time">{{ p.createdAt }}</div>
              </div>
              <a class="post-dest" :href="'#/destinations/' + p.destinationId">📍 {{ p.destinationName }}</a>
            </header>

            <p class="post-content">{{ p.content }}</p>

            <div class="post-gallery" v-if="p.images.length" :class="'n' + p.images.length">
              <img
                v-for="src in p.images"
                :key="src"
                :src="src"
                alt="旅行照片"
                loading="lazy"
                @click="openImage(src)"
              />
            </div>

            <footer class="post-foot">
              <button class="post-like" @click="like(p)">👍 {{ p.likeCount || 0 }}</button>
              <button class="post-del" v-if="isMine(p)" @click="remove(p)">删除</button>
            </footer>
          </article>
        </div>

        <div class="empty" v-else>
          <div class="icon">📮</div>
          <p>还没有人分享{{ filterDest ? '这里' : '' }}的旅行，来写第一篇吧</p>
        </div>
      </template>
    </div>
  `,
};
