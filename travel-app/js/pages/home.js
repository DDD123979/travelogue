/* =========================================================
 * pages/home.js — 首页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

/* 景点类型的固定展示顺序：类型只有 4 个，固定顺序比按数量排更好认 */
const TYPE_ORDER = ['自然生态', '人文古迹', '街区市集', '观景夜景'];

const HomePage = {
  components: { DestinationCard },
  setup() {
    const keyword = ref('');
    const list = ref([]);
    const loading = ref(true);

    // 左侧当前选中的类型（决定右侧显示哪些目的地）
    const activeType = ref('');

    // 每个类型自己的展开状态：{ '自然生态': true, ... }
    // 与 activeType 分开，才能做到「收缩名字但不取消选中」
    const expanded = ref({});

    onMounted(async () => {
      try {
        list.value = await api.getDestinations();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
      // 首页一打开：选中并展开「全部」，先把 20 个城市都铺出来
      if (!activeType.value && groups.value.length) {
        activeType.value = '全部';
        expanded.value['全部'] = true;
      }
    });

    function search() {
      go('/destinations?q=' + encodeURIComponent(keyword.value.trim()));
    }

    // 首屏大图：取第一个带封面图的目的地。列表是异步来的，加载完会自动换上，
    // 加载前/失败时靠 .hero 的底色兜着，不会出现白屏。
    // 背景优先用风景类目的地的照片（大图铺满时，熊猫特写这种"主角型"照片并不好看）；
    // 找不到就用第一个有封面的。图片交给 CSS 的 ::before 做虚化，所以这里只传一个变量。
    const HERO_CANDIDATES = ['大理', '三亚', '丽江', '杭州', '厦门'];
    const heroBg = computed(() => {
      const withImage = list.value.filter((d) => d.image);
      if (!withImage.length) return {};
      const preferred = HERO_CANDIDATES
        .map((name) => withImage.find((d) => d.name === name))
        .find(Boolean);
      const hero = preferred || withImage[0];
      return { '--hero-img': `url("${hero.image}")` };
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

    // 全部：所有城市按热度排序，作为侧边栏的第一项
    const allDestinations = computed(() =>
      [...list.value].sort((a, b) => {
        const dh = (b.hotScore || 0) - (a.hotScore || 0);
        return dh || Number(b.rating) - Number(a.rating);
      })
    );

    // 侧边栏的数据源：第一项是「全部」，后面是四种景点类型
    const groups = computed(() => [
      { name: '全部', destinations: allDestinations.value },
      ...attractionTypes.value,
    ]);

    // 右侧列表跟着当前选中项走
    const activeDestinations = computed(() => {
      const hit = groups.value.find((t) => t.name === activeType.value);
      return hit ? hit.destinations : [];
    });

    // 右侧标题下的一行说明，随选中项变化
    const activeSub = computed(() => {
      const n = activeDestinations.value.length;
      if (activeType.value === '全部') return `共 ${n} 个目的地，全部城市都在这里`;
      return `共 ${n} 个目的地，都能逛到「${activeType.value}」类的景点`;
    });

    // 点类型名：选中它，并顺手展开（收缩状态由右边的箭头单独控制）
    function selectType(name) {
      activeType.value = name;
      expanded.value[name] = true;
    }

    // 点箭头：只展开 / 收起名字列表，不改变右侧选中项
    function toggleExpand(name) {
      expanded.value[name] = !expanded.value[name];
    }

    return {
      keyword,
      list,
      loading,
      search,
      heroBg,
      attractionTypes,
      groups,
      activeSub,
      activeType,
      activeDestinations,
      expanded,
      selectType,
      toggleExpand,
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

      <!-- 按景点类型逛：左侧类型导航（可逐个展开/收缩），右侧跟着切换目的地 -->
      <section class="section container">
        <div class="loading" v-if="loading"><span></span><br />加载中…</div>

        <div class="browse" v-else-if="attractionTypes.length">
          <aside class="type-side">
            <!-- 「全部」单独一项，和下面的景点类型分开 -->
            <div class="type-group all-group" :class="{ active: activeType === '全部' }">
              <div class="type-row">
                <button class="type-head" type="button" @click="selectType('全部')">
                  <span class="type-name">全部</span>
                  <span class="type-num">{{ groups[0].destinations.length }}</span>
                </button>
                <button
                  class="type-toggle"
                  type="button"
                  :class="{ open: expanded['全部'] }"
                  :aria-expanded="!!expanded['全部']"
                  :title="expanded['全部'] ? '收起城市' : '展开城市'"
                  @click.stop="toggleExpand('全部')"
                >▾</button>
              </div>
              <ul class="type-dests" v-show="expanded['全部']">
                <li v-for="d in groups[0].destinations" :key="d.id">
                  <a :href="'#/destinations/' + d.id">{{ d.name }}</a>
                </li>
              </ul>
            </div>

            <h3 class="side-title">景点类型</h3>

            <div
              class="type-group"
              v-for="t in attractionTypes"
              :key="t.name"
              :class="{ active: t.name === activeType }"
            >
              <div class="type-row">
                <button class="type-head" type="button" @click="selectType(t.name)">
                  <span class="type-name">{{ t.name }}</span>
                  <span class="type-num">{{ t.destinations.length }}</span>
                </button>
                <button
                  class="type-toggle"
                  type="button"
                  :class="{ open: expanded[t.name] }"
                  :aria-expanded="!!expanded[t.name]"
                  :title="expanded[t.name] ? '收起目的地' : '展开目的地'"
                  @click.stop="toggleExpand(t.name)"
                >▾</button>
              </div>

              <ul class="type-dests" v-show="expanded[t.name]">
                <li v-for="d in t.destinations" :key="d.id">
                  <a :href="'#/destinations/' + d.id">{{ d.name }}</a>
                </li>
              </ul>
            </div>
          </aside>

          <div class="type-main">
            <div class="section-head with-sub">
              <div>
                <h2>{{ activeType || '目的地' }}</h2>
                <p class="section-sub" v-if="activeDestinations.length">{{ activeSub }}</p>
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
