/* =========================================================
 * pages/home.js — 首页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

/* 六大玩法分类的「人话」版说明：分类名太干，配一句勾人的话才像旅游站。
   键必须和 data.sql / mock-data.js 里的 category 完全一致，写错就退化成默认图标。 */
const CATEGORY_META = {
  美食休闲: { emoji: '🍜', hook: '为一口吃的出发' },
  江南水乡: { emoji: '⛵', hook: '小桥流水，慢慢逛' },
  历史古迹: { emoji: '🏛️', hook: '把课本里的地方走一遍' },
  海岛度假: { emoji: '🏝️', hook: '躺平看海，什么都不做' },
  自然风光: { emoji: '⛰️', hook: '山野湖海，走进去才懂' },
  都市风情: { emoji: '🌃', hook: '夜景、街区与烟火气' },
};

/* 景点类型的固定展示顺序：类型只有 4 个，固定顺序比按数量排更好认 */
const TYPE_ORDER = ['自然生态', '人文古迹', '街区市集', '观景夜景'];

const HomePage = {
  components: { DestinationCard },
  setup() {
    const keyword = ref('');
    const list = ref([]);
    const loading = ref(true);

    // 左侧侧边栏当前选中的类型；数据加载完默认选第一个
    const activeType = ref('');

    onMounted(async () => {
      try {
        list.value = await api.getDestinations();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
      // 默认展开第一个类型（自然生态），让首页一打开就有内容可看
      if (!activeType.value && attractionTypes.value.length) {
        activeType.value = attractionTypes.value[0].name;
      }
    });

    function search() {
      go('/destinations?q=' + encodeURIComponent(keyword.value.trim()));
    }

    // 首屏大图：取第一个带封面图的目的地。列表是异步来的，加载完会自动换上，
    // 加载前/失败时靠 .hero 的底色兜着，不会出现白屏。
    const heroBg = computed(() => {
      const hero = list.value.find((d) => d.image) || list.value[0];
      return hero && hero.image ? { backgroundImage: `url("${hero.image}")` } : {};
    });

    // 分类卡片：数量和顺序都由数据算出来，以后加目的地不用改这里。
    const categories = computed(() => {
      const count = new Map();
      for (const d of list.value) {
        count.set(d.category, (count.get(d.category) || 0) + 1);
      }
      return [...count.entries()]
        .map(([name, n]) => {
          const meta = CATEGORY_META[name] || {};
          return {
            name,
            count: n,
            emoji: meta.emoji || '📍',
            hook: meta.hook || '去看看',
          };
        })
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
    });

    // 景点类型（侧边栏）：每个类型下挂着"包含该类型景点的目的地"
    const attractionTypes = computed(() => {
      const byType = new Map();
      for (const d of list.value) {
        for (const a of d.attractions || []) {
          if (!a.type) continue;
          if (!byType.has(a.type)) byType.set(a.type, new Map());
          byType.get(a.type).set(d.id, d);
        }
      }
      return [...byType.entries()]
        .map(([name, destMap]) => ({
          name,
          destinations: [...destMap.values()].sort((a, b) => b.rating - a.rating),
        }))
        .sort((a, b) => {
          const ia = TYPE_ORDER.indexOf(a.name);
          const ib = TYPE_ORDER.indexOf(b.name);
          return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });
    });

    // 右侧列表跟着选中类型走
    const activeDestinations = computed(() => {
      const hit = attractionTypes.value.find((t) => t.name === activeType.value);
      return hit ? hit.destinations : [];
    });

    return {
      keyword,
      list,
      loading,
      search,
      heroBg,
      categories,
      attractionTypes,
      activeType,
      activeDestinations,
    };
  },
  template: `
    <div>
      <section class="hero" :style="heroBg">
        <div class="hero-inner">
          <h1>去<em>想去</em>的地方，见想见的风景</h1>
          <p>从城市到海岛，从一口吃食到一段古迹，挑一个就出发</p>
          <div class="search-box">
            <input
              v-model="keyword"
              placeholder="搜索目的地，如：成都、大理、海岛…"
              @keyup.enter="search"
            />
            <button class="btn btn-primary" @click="search">搜 索</button>
          </div>
        </div>
      </section>

      <!-- 经典分类：按「想怎么玩」挑城市 -->
      <section class="section container">
        <div class="section-head with-sub">
          <div>
            <h2>经典分类</h2>
            <p class="section-sub">按玩法挑方向，比按名字一个个翻更快</p>
          </div>
        </div>

        <div class="loading" v-if="loading"><span></span><br />加载中…</div>
        <div class="cat-row" v-else>
          <a
            class="cat-chip"
            v-for="c in categories"
            :key="c.name"
            :href="'#/destinations?cat=' + encodeURIComponent(c.name)"
          >
            <span class="cat-emoji">{{ c.emoji }}</span>
            <span class="cat-name">{{ c.name }}</span>
            <span class="cat-hook">{{ c.hook }}</span>
            <span class="cat-count">{{ c.count }} 个目的地 →</span>
          </a>
        </div>
      </section>

      <!-- 按景点类型逛：左侧类型导航，右侧跟着切换目的地 -->
      <section class="section container">
        <div class="browse" v-if="!loading && attractionTypes.length">
          <aside class="type-side">
            <h3 class="side-title">按景点类型逛</h3>
            <div
              class="type-group"
              v-for="(t, i) in attractionTypes"
              :key="t.name"
              :class="{ active: t.name === activeType }"
            >
              <button class="type-head" type="button" @click="activeType = t.name">
                <span class="type-name">{{ t.name }}</span>
                <span class="type-num">{{ t.destinations.length }}</span>
              </button>
              <ul class="type-dests" v-show="t.name === activeType">
                <li v-for="d in t.destinations" :key="d.id">
                  <a :href="'#/destinations/' + d.id">{{ d.name }}</a>
                </li>
              </ul>
            </div>
          </aside>

          <div class="type-main">
            <div class="section-head with-sub">
              <div>
                <h2>{{ activeType }}</h2>
                <p class="section-sub">
                  共 {{ activeDestinations.length }} 个目的地，都能逛到「{{ activeType }}」类的景点
                </p>
              </div>
              <a href="#/destinations">查看全部目的地 →</a>
            </div>
            <div class="card-grid">
              <DestinationCard v-for="d in activeDestinations" :key="d.id" :item="d" />
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
};

// 目的地列表页
