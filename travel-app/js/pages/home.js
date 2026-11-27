/* =========================================================
 * pages/home.js — 首页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

/* 景点类型的固定展示顺序：类型只有 4 个，固定顺序比按数量排更好认 */
const TYPE_ORDER = ['自然生态', '人文古迹', '街区市集', '观景夜景'];

/* 左侧筛选项的线性图标：统一 24 视框、1.3 描边、不走填充，保证"同一套笔"的观感 */
const TYPE_ICONS = {
  全部:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3.5" y="4.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="13.5" y="4.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="3.5" y="14.5" width="7" height="5" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="13.5" y="14.5" width="7" height="5" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  自然生态:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 18.5l5.2-7.3 3.1 4.1 2.4-3.1 5.3 6.3z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="16.6" cy="7" r="2.1" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  人文古迹:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3.5 9.5L12 4l8.5 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3.5 19.5h17" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  街区市集:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 9.5h16M5.5 9.5v9h13v-9M9 9.5V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8v2.7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  观景夜景:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M20 13.4A8 8 0 0 1 10.6 4a8.2 8.2 0 1 0 9.4 9.4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
};

/* 首屏热搜词：纯文字标签，不做彩色胶囊按钮 */
const HOT_SEARCHES = ['成都', '大理', '三亚', '杭州', '厦门'];


const HomePage = {
  components: { DestinationCard, MapGuide },
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
      // 首页一打开：选中「全部」（右侧铺满所有城市），但侧栏默认收起城市名，保持紧凑
      if (!activeType.value && groups.value.length) {
        activeType.value = '全部';
        expanded.value['全部'] = false;
      }
    });

    function search() {
      go('/destinations?q=' + encodeURIComponent(keyword.value.trim()));
    }

    /* 热搜标签：填进输入框并直接搜索，和手动输入走同一个入口 */
    const hotSearches = HOT_SEARCHES;
    function pickHot(name) {
      keyword.value = name;
      search();
    }
    function typeIcon(name) {
      return TYPE_ICONS[name] || TYPE_ICONS['全部'];
    }

    // 首屏背景在 style.css 里以 --hero-img 指定（相对 css 目录，file:// 与 http 都能用）
    const heroBg = computed(() => ({}));

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
      hotSearches,
      pickHot,
      typeIcon,
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
          <div class="hero-copy">
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

            <!-- 热搜：极简文字标签，点击即搜索 -->
            <div class="hot-searches" v-if="hotSearches.length">
              <span class="hot-label">热门</span>
              <button
                v-for="t in hotSearches"
                :key="t"
                type="button"
                class="hot-item"
                @click="pickHot(t)"
              >{{ t }}</button>
            </div>
          </div>

          <!-- 地图导览：绿色中国地图 + 目的地打点 -->
          <MapGuide :items="list" />
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
                  <span class="type-ico" aria-hidden="true" v-html="typeIcon('全部')"></span>
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
              <!-- 展开/收起过渡：外层包一层 wrap 做 grid-rows 折叠，
                   里面的 ul 保持原有布局（窄屏横排不受影响） -->
              <Transition name="type-expand">
                <div class="type-dests-wrap" v-show="expanded['全部']">
                  <ul class="type-dests">
                    <li v-for="d in groups[0].destinations" :key="d.id">
                      <a :href="'#/destinations/' + d.id">{{ d.name }}</a>
                    </li>
                  </ul>
                </div>
              </Transition>
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
                  <span class="type-ico" aria-hidden="true" v-html="typeIcon(t.name)"></span>
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

              <Transition name="type-expand">
                <div class="type-dests-wrap" v-show="expanded[t.name]">
                  <ul class="type-dests">
                    <li v-for="d in t.destinations" :key="d.id">
                      <a :href="'#/destinations/' + d.id">{{ d.name }}</a>
                    </li>
                  </ul>
                </div>
              </Transition>
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
