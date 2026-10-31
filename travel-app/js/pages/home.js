/* =========================================================
 * pages/home.js — 首页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

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

    return { keyword, list, loading, search };
  },
  template: `
    <div>
      <section class="hero">
        <h1>去<em>想去</em>的地方，见想见的风景</h1>
        <p>精选国内目的地，从攻略到行程，一站备齐</p>
        <div class="search-box">
          <input
            v-model="keyword"
            placeholder="搜索目的地，如：成都、大理、海岛…"
            @keyup.enter="search"
          />
          <button class="btn btn-primary" @click="search">搜 索</button>
        </div>
      </section>

      <section class="section container">
        <div class="section-head">
          <h2>热门目的地</h2>
          <a href="#/destinations">查看全部 →</a>
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
