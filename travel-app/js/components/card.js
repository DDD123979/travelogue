/* =========================================================
 * components/card.js — 目的地卡片（首页 / 列表页 / 收藏页共用）
 * 结构：上方图片区（暗角 + 收藏） + 下方哑光信息区
 * ========================================================= */

const DestinationCard = {
  props: { item: { type: Object, required: true } },
  setup(props) {
    const bg = computed(
      () => `background-image: linear-gradient(135deg, ${props.item.gradient[0]}, ${props.item.gradient[1]})`
    );
    const imgFailed = ref(false);
    const showImg = computed(
      () => Boolean(props.item.image) && !imgFailed.value && store.settings.showPhotos
    );
    return { store, bg, imgFailed, showImg };
  },
  template: `
    <article class="card" :class="{ 'has-img': showImg, 'is-fav': store.isFav(item.id) }">
      <div class="card-media">
        <div class="card-fallback" :style="bg"></div>
        <img
          v-if="showImg"
          class="card-img"
          :src="item.image"
          :alt="item.name + '·' + item.location + ' 风景照片'"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="imgFailed = true"
        />
        <!-- 暗角：四角压暗，让照片更沉、文字区过渡更自然 -->
        <div class="card-vignette" aria-hidden="true"></div>
        <span class="card-badge">{{ item.category }}</span>

        <button
          class="fav-btn"
          :class="{ on: store.isFav(item.id) }"
          :aria-pressed="store.isFav(item.id)"
          @click.stop="store.toggleFav(item.id)"
          :title="store.isFav(item.id) ? '取消收藏' : '收藏'"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path
              d="M12 20.2s-7.2-4.4-7.2-9.4A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.2 3.2c0 5-7.2 9.4-7.2 9.4z"
              fill="none" stroke="currentColor" stroke-width="1.4"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="card-body">
        <div class="card-head">
          <h3 class="name">{{ item.name }}</h3>
          <span class="rating" :title="item.rating + ' 分'">
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
              <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.7l5.8-.8z"
                    fill="currentColor"/>
            </svg>
            {{ item.rating }}
          </span>
        </div>

        <p class="card-sub">{{ item.location }} · {{ item.enName }}</p>

        <ul class="card-tags">
          <li v-for="t in item.tags" :key="t">{{ t }}</li>
        </ul>

        <div class="card-facts">
          <span class="fact" :title="'最佳出行季：' + (item.bestSeason || '四季皆宜')">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
              <path d="M3.5 10h17M8 3.5v3M16 3.5v3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            {{ item.bestSeason || '四季皆宜' }}
          </span>
          <span class="fact" :title="'建议游玩：' + item.days">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.3"/>
              <path d="M12 7.8V12l3 1.9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            {{ item.days }}
          </span>
          <span class="card-go">详情 →</span>
        </div>
      </div>

      <!-- 拉伸链接：铺满整张卡片，点哪儿都能进详情页 -->
      <a
        class="card-stretch"
        :href="'#/destinations/' + item.id"
        :aria-label="'查看 ' + item.name + ' 详情'"
      ></a>
    </article>
  `,
};
