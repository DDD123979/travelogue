/* =========================================================
 * pages/detail.js — 目的地详情页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

const DetailPage = {
  props: { id: { type: Number, required: true } },
  setup(props) {
    const item = ref(null);
    const loading = ref(true);
    const error = ref('');

    onMounted(async () => {
      try {
        item.value = await api.getDestination(props.id);
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    });

    const bg = computed(() =>
      item.value
        ? `background: linear-gradient(120deg, ${item.value.gradient[0]}, ${item.value.gradient[1]})`
        : ''
    );

    // 跳到 AI 规划页，并把当前目的地一起带过去（AiPage 里读 query.dest 预选）
    function planWithAi() {
      go('/ai?dest=' + props.id);
    }
    // 用景点数据拼一个逐日行程：每天排一个景点，正好对上"建议游玩 3-4 天"的节奏。
    // 没有景点数据时返回空数组，模板里整块不渲染。
    const itinerary = computed(() => {
      const list = (item.value && item.value.attractions) || [];
      const days = [];
      // 每天排 2 个去处：第一个上午、第二个下午；夜景类直接标晚上
      for (let i = 0; i < list.length; i += 2) {
        const items = list.slice(i, i + 2).map((a, idx) => ({
          ...a,
          slot: a.type === '观景夜景' ? '晚上' : (idx === 0 ? '上午' : '下午'),
        }));
        days.push({ no: days.length + 1, items });
      }
      return days;
    });

    return { item, loading, error, bg, store, planWithAi, itinerary };
  },
  template: `
    <div class="page container">
      <div class="loading" v-if="loading"><span></span><br />加载中…</div>

      <div class="empty" v-else-if="error">
        <div class="icon">🧭</div>
        <p>{{ error }}</p>
        <a class="btn btn-outline btn-sm" href="#/destinations">返回列表</a>
      </div>

      <template v-else>
        <div class="detail-hero" :style="bg">
          <div class="en">{{ item.enName }} · {{ item.location }}</div>
          <h1>{{ item.name }}</h1>
          <div class="sub">
            <span>评分 {{ item.rating }}</span>
            <span>建议游玩 {{ item.days }}</span>
            <span>最佳季节 {{ item.bestSeason }}</span>
          </div>
          <button class="fav-btn" :class="{ on: store.isFav(item.id) }" @click="store.toggleFav(item.id)">
            {{ store.isFav(item.id) ? '★ 已收藏' : '☆ 收藏' }}
          </button>
        </div>

        <div class="detail-layout">
          <div class="detail-main">
            <h2>目的地介绍</h2>
            <p style="color: var(--text-secondary); font-size: 15px;">{{ item.description }}</p>

            <!-- 最特色景点的深度介绍：攻略站的核心内容 -->
            <div class="hl-box" v-if="item.highlight">
              <div class="hl-head"><span class="hl-badge">必去</span>{{ item.highlight.name }}</div>
              <p>{{ item.highlight.desc }}</p>
            </div>

            <!-- 景点数据在库里每个目的地都有 3 条，正好排成 3 天；万一是空的就整块不显示 -->
            <template v-if="itinerary.length">
              <h2>参考行程</h2>
              <p class="timeline-tip">
                按 {{ itinerary.length }} 天排，每天 2 个去处；顺序和强度可以按体力、交通自己调
              </p>
              <div class="timeline">
                <div class="timeline-item" v-for="day in itinerary" :key="day.no">
                  <span class="timeline-dot"></span>
                  <div class="timeline-head">
                    <span class="day">第 {{ day.no }} 天</span>
                    <span class="time">{{ day.items.length }} 个去处</span>
                  </div>
                  <div class="timeline-slot" v-for="a in day.items" :key="a.name">
                    <div class="slot-head">
                      <span class="slot-label">{{ a.slot }}</span>
                      <span class="slot-name">{{ a.name }}</span>
                      <span class="type-tag" v-if="a.type">{{ a.type }}</span>
                      <span class="slot-time">{{ a.time }}</span>
                    </div>
                    <p>{{ a.desc }}</p>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <aside class="side-card">

            <div class="label">类别</div>
            <div class="value">{{ item.category }}</div>
            <div class="label">位置</div>
            <div class="value">{{ item.location }}</div>
            <div class="label">建议游玩</div>
            <div class="value">{{ item.days }}</div>
            <div class="label">最佳季节</div>
            <div class="value">{{ item.bestSeason }}</div>
            <button class="btn btn-primary" @click="planWithAi">✨ 用 AI 生成行程</button>
          </aside>
        </div>
      </template>
    </div>
  `,
};

// 收藏页
