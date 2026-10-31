/* =========================================================
 * pages/list.js — 目的地列表页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

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
