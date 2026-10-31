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

const HomePage = {
  components: { DestinationCard },
  setup() {
    const keyword = ref('');
    const list = ref([]);
    const loading = ref(true);

    onMounted(async () => {
      try {
        list.value = await api.getDestinations();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
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
    // 按「目的地多的排前面」排序，数量一样时按名字，避免每次刷新顺序乱跳。
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

    // 景点类型：从所有目的地的 attractions 里统计。
    // 顺序固定成「自然生态 → 人文古迹 → 街区市集 → 观景夜景」，
    // 不按数量排 —— 类型就 4 个，固定的顺序更好记。
    const TYPE_ORDER = ['自然生态', '人文古迹', '街区市集', '观景夜景'];
    const attractionTypes = computed(() => {
      const count = new Map();
      for (const d of list.value) {
        for (const a of d.attractions || []) {
          if (!a.type) continue;
          count.set(a.type, (count.get(a.type) || 0) + 1);
        }
      }
      return [...count.entries()]
        .map(([name, n]) => ({ name, count: n }))
        .sort((a, b) => {
          const ia = TYPE_ORDER.indexOf(a.name);
          const ib = TYPE_ORDER.indexOf(b.name);
          return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });
    });

    return { keyword, list, loading, search, heroBg, categories, attractionTypes };
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

      <!-- 经典分类：先让人按「想怎么玩」挑，比直接扫目的地列表快 -->
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

        <!-- 景点类型：再细一层。分类是「去什么样的城市」，类型是「到了之后逛什么」 -->
        <div class="type-row" v-if="!loading && attractionTypes.length">
          <span class="type-label">按景点类型</span>
          <a
            class="type-pill"
            v-for="t in attractionTypes"
            :key="t.name"
            :href="'#/destinations?atype=' + encodeURIComponent(t.name)"
          >
            {{ t.name }}<i>{{ t.count }}</i>
          </a>
        </div>
      </section>

      <section class="section container">
        <div class="section-head with-sub">
          <div>
            <h2>热门目的地</h2>
            <p class="section-sub">按口碑和当下季节挑的 6 个，第一次来先从这里选</p>
          </div>
          <a href="#/destinations">查看全部 {{ list.length }} 个 →</a>
        </div>
        <div class="loading" v-if="loading"><span></span><br />加载中…</div>
        <div class="card-grid" v-else>
          <DestinationCard v-for="d in list.slice(0, 6)" :key="d.id" :item="d" />
        </div>
      </section>
    </div>
  `,
};

// 目的地列表页
