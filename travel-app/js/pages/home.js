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
      // 首页一打开：选中并展开第一个类型（自然生态）
      if (!activeType.value && attractionTypes.value.length) {
        const first = attractionTypes.value[0].name;
        activeType.value = first;
        expanded.value[first] = true;
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
            <h3 class="side-title">按景点类型逛</h3>

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
                <p class="section-sub" v-if="activeDestinations.length">
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
