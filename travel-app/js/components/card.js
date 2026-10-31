/* =========================================================
 * components/card.js — 目的地卡片（首页 / 列表页 / 收藏页共用）
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

const DestinationCard = {
  props: { item: { type: Object, required: true } },
  setup(props) {
    // 渐变色始终铺在底层：图片加载失败（断网 / 链接失效）时自动退回渐变封面
    const bg = computed(() =>
      `background: linear-gradient(135deg, ${props.item.gradient[0]}, ${props.item.gradient[1]})`
    );
    const imgFailed = ref(false);
    // 图片加载失败、或用户在「设置」里关掉了封面照片时，都退回渐变色封面
    const showImg = computed(
      () => Boolean(props.item.image) && !imgFailed.value && store.settings.showPhotos
    );
    return { store, bg, imgFailed, showImg };
  },
  template: `
    <div class="card" :class="{ 'has-img': showImg }" :style="bg">
      <img
        v-if="showImg"
        class="card-img"
        :src="item.image"
        :alt="item.name + '·' + item.location + ' 风景照片'"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imgFailed = true"
      />

      <!-- 拉伸链接：铺满整张卡片，点哪儿都能进详情页（避免 <a> 嵌套 <a>） -->
      <a
        class="card-stretch"
        :href="'#/destinations/' + item.id"
        :aria-label="'查看 ' + item.name + ' 详情'"
      ></a>

      <!-- 正文压在照片上；容器不拦截点击，只有「查看详情」自己接管 -->
      <div class="card-overlay">
        <div class="name">{{ item.name }}</div>
        <div class="en">{{ item.enName }}</div>
        <div class="meta-row">
          <span>{{ item.location }} · {{ item.category }}</span>
          <span class="rating">{{ item.rating }} 分</span>
        </div>
        <div class="tags">
          <span class="tag" v-for="t in item.tags" :key="t">{{ t }}</span>
        </div>
        <div class="price-row">
          <span class="price">建议游玩 <b>{{ item.days }}</b></span>
          <a class="tag tag-link" :href="'#/destinations/' + item.id">查看详情 →</a>
        </div>
      </div>

      <button
        class="fav-btn"
        :class="{ on: store.isFav(item.id) }"
        @click.stop="store.toggleFav(item.id)"
        :title="store.isFav(item.id) ? '取消收藏' : '收藏'"
      >{{ store.isFav(item.id) ? '★' : '☆' }}</button>
    </div>
  `,
};

/* ---------- 页面组件 ---------- */

// 首页
