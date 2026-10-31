/* =========================================================
 * pages/ranking.js — 热门排行
 *
 * 两个榜：目的地榜（按热度分）、景点榜（热度分 + 景点类型权重）。
 * 热度分是数据里预设的编辑分（0-100），不是实时抓取，
 * 页面上也如实标注了"综合公开榜单估算"，避免读者误解成实时数据。
 * ========================================================= */

const RankingPage = {
  setup() {
    const list = ref([]);
    const loading = ref(true);
    const tab = ref('city');          // city | spot

    onMounted(async () => {
      try {
        list.value = await api.getDestinations();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    });

    // 目的地榜：热度分优先，同分看评分，再看名称，保证顺序稳定
    const cities = computed(() =>
      [...list.value].sort((a, b) => {
        const dh = (b.hotScore || 0) - (a.hotScore || 0);
        if (dh) return dh;
        const dr = Number(b.rating) - Number(a.rating);
        if (dr) return dr;
        return a.name.localeCompare(b.name, 'zh');
      })
    );

    /* 景点榜的分数：城市热度打八五折 + 类型权重 + 该城市首个景点的小加成，
       这样既体现"城市火不火"，也区分"这个景点本身值不值得专程去"。
       上限 99：100 分看着像满分，反而没有区分度。 */
    const TYPE_WEIGHT = { 人文古迹: 4, 自然生态: 3, 观景夜景: 2, 街区市集: 1 };
    const spots = computed(() => {
      const out = [];
      for (const d of list.value) {
        (d.attractions || []).forEach((a, i) => {
          const base = (d.hotScore || 60) * 0.85;
          const bonus = (TYPE_WEIGHT[a.type] || 1) * 3 + (i === 0 ? 2 : 0);
          out.push({
            name: a.name,
            type: a.type,
            time: a.time,
            desc: a.desc,
            city: d.name,
            cityId: d.id,
            score: Math.min(99, Math.round(base + bonus)),
          });
        });
      }
      return out.sort((x, y) => y.score - x.score || x.city.localeCompare(y.city, 'zh')).slice(0, 30);
    });

    const medals = ['🥇', '🥈', '🥉'];

    function cover(d) {
      return { background: `linear-gradient(135deg, ${d.gradient[0]}, ${d.gradient[1]})` };
    }

    return { list, loading, tab, cities, spots, medals, cover };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">热门排行</h1>
      <p class="rank-sub">
        热度分综合公开榜单与站内评分估算（0-100），仅作选择参考，不代表实时客流
      </p>

      <div class="rank-tabs">
        <button class="rank-tab" :class="{ active: tab === 'city' }" @click="tab = 'city'">
          目的地榜 <span class="rank-tab-num">{{ cities.length }}</span>
        </button>
        <button class="rank-tab" :class="{ active: tab === 'spot' }" @click="tab = 'spot'">
          景点榜 <span class="rank-tab-num">{{ spots.length }}</span>
        </button>
      </div>

      <div class="loading" v-if="loading"><span></span><br />加载中…</div>

      <template v-else>
        <!-- 目的地榜 -->
        <ol class="rank-list" v-if="tab === 'city'">
          <li class="rank-item" v-for="(d, i) in cities" :key="d.id">
            <span class="rank-no" :class="'no-' + (i + 1)">{{ i < 3 ? medals[i] : i + 1 }}</span>
            <a
              class="rank-cover"
              :href="'#/destinations/' + d.id"
              :style="cover(d)"
            >
              <img v-if="d.image" :src="d.image" :alt="d.name" loading="lazy" referrerpolicy="no-referrer" />
            </a>
            <div class="rank-body">
              <div class="rank-title">
                <a :href="'#/destinations/' + d.id">{{ d.name }}</a>
                <span class="rank-score">{{ d.hotScore || '—' }}<i>热度</i></span>
              </div>
              <div class="rank-meta">{{ d.location }} · {{ d.category }} · {{ d.rating }} 分 · 建议 {{ d.days }}</div>
              <p class="rank-desc" v-if="d.highlight">
                <b>{{ d.highlight.name }}</b>：{{ d.highlight.desc }}
              </p>
            </div>
          </li>
        </ol>

        <!-- 景点榜 -->
        <ol class="rank-list" v-else>
          <li class="rank-item" v-for="(s, i) in spots" :key="s.cityId + '-' + s.name">
            <span class="rank-no" :class="'no-' + (i + 1)">{{ i < 3 ? medals[i] : i + 1 }}</span>
            <div class="rank-body">
              <div class="rank-title">
                <a :href="'#/destinations/' + s.cityId">{{ s.name }}</a>
                <span class="rank-score">{{ s.score }}<i>分</i></span>
              </div>
              <div class="rank-meta">
                <span class="type-tag">{{ s.type }}</span>
                {{ s.city }} · {{ s.time }}
              </div>
              <p class="rank-desc">{{ s.desc }}</p>
            </div>
          </li>
        </ol>
      </template>
    </div>
  `,
};
