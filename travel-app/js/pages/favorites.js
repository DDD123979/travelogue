/* =========================================================
 * pages/favorites.js — 我的收藏
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

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
