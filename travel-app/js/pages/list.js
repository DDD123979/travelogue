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
        // 景点类型：目的地下至少有一个该类型的景点就算命中
        const okType =
          !atype.value || (d.attractions || []).some((a) => a.type === atype.value);
        return okCat && okKw && okType;
      })
    );

    // 清掉类型筛选：回到不带参数的列表页
    function clearType() {
      atype.value = '';
      go('/destinations');
    }

    return { loading, keyword, category, categories, filtered, atype, clearType };
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
        <div class="result-count">
          共 {{ filtered.length }} 个目的地
          <span v-if="atype" class="filter-hint">
            · 只看含「{{ atype }}」类景点
            <button class="link-btn" @click="clearType">清除</button>
          </span>
        </div>
        <!-- 汇总清单：一个地区一行，带「最特色景点」的详细介绍 -->
        <div class="region-list" v-if="filtered.length">
          <article class="region-item" v-for="d in filtered" :key="d.id">
            <a
              class="region-cover"
              :href="'#/destinations/' + d.id"
              :style="{ background: 'linear-gradient(135deg,' + d.gradient[0] + ',' + d.gradient[1] + ')' }"
            >
              <img
                v-if="d.image"
                :src="d.image"
                :alt="d.name + ' 封面'"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="$event.target.style.display = 'none'"
              />
            </a>

            <div class="region-body">
              <div class="region-head">
                <h3><a :href="'#/destinations/' + d.id">{{ d.name }}</a></h3>
                <span class="region-meta">{{ d.location }} · {{ d.category }} · {{ d.rating }} 分 · 建议 {{ d.days }}</span>
              </div>

              <p class="region-intro">{{ d.description }}</p>

              <div class="region-hl" v-if="d.highlight">
                <div class="hl-title"><span class="hl-badge">必去</span>{{ d.highlight.name }}</div>
                <p>{{ d.highlight.desc }}</p>
              </div>

              <div class="region-foot">
                <span class="tag" v-for="t in d.tags" :key="t">{{ t }}</span>
                <a class="region-more" :href="'#/destinations/' + d.id">查看详情 →</a>
              </div>
            </div>
          </article>
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
