/* =========================================================
 * components/map-guide.js — 地图导览
 *
 * 一张绿色的中国地图，上面标出 23 个目的地：
 *   · 悬停：该地名放大
 *   · 点击：弹出气泡（简介 + 「详细查看」跳详情页）
 *   · 点空白 / 按 Esc 关闭气泡
 *
 * 气泡位置在点击后按真实尺寸测量再夹取，保证不越出地图卡片；
 * 打点坐标来自 js/data/china-pins.js（与 img/china-map.svg 同一套投影）。
 * ========================================================= */

/* 密集区（华东 / 华南城市相距很近）常驻文字会糊成一片：
 * 这些点默认只显示圆点，悬停时再显示并放大地名；其余城市常驻显示。 */
const MAP_QUIET = ['杭州', '苏州', '南京', '威海', '长沙', '深圳', '洛阳', '开封'];

/* 密集区的手工标签方位：避免地名互相压住 */
const MAP_LABEL_POS = {
  敦煌: 'top', 丽江: 'top', 大理: 'bottom', 成都: 'right', 重庆: 'right',
  西安: 'top', 张家界: 'right', 武汉: 'right', 长沙: 'bottom', 广州: 'top',
  深圳: 'bottom', 桂林: 'bottom', 厦门: 'bottom', 三亚: 'bottom', 上海: 'right',
  杭州: 'bottom', 苏州: 'top', 南京: 'left', 青岛: 'top', 威海: 'right',
  北京: 'top', 开封: 'bottom', 洛阳: 'left',
};

const MapGuide = {
  props: { items: { type: Array, default: () => [] } },
  setup(props) {
    const active = ref(null);
    const bubblePos = ref(null);   // { left, top } 像素坐标，测量后写入
    const canvasEl = ref(null);
    const bubbleEl = ref(null);

    // 只给有坐标的目的地打点，数据里多出来的城市不会让地图报错
    const pins = computed(() =>
      props.items
        .filter((d) => CHINA_PINS[d.name])
        .map((d) => ({
          id: d.id,
          name: d.name,
          location: d.location,
          category: d.category,
          desc: d.description || '',
          x: CHINA_PINS[d.name][0],
          y: CHINA_PINS[d.name][1],
          pos: MAP_LABEL_POS[d.name] || 'bottom',
          quiet: MAP_QUIET.indexOf(d.name) !== -1,
        }))
    );

    /* 气泡落点：先把点换算成像素，再按气泡实际宽高夹在画布内。
       上方放不下就翻到点下方，仍放不下就垂直居中并夹紧。 */
    function placeBubble() {
      const canvas = canvasEl.value;
      const box = bubbleEl.value;
      if (!canvas || !box || !active.value) return;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const rect = box.getBoundingClientRect();
      const bw = rect.width;
      const bh = rect.height;
      // 首帧还没排版完成时宽高为 0：下一帧再量，避免用 0 当宽度算出越界的坐标
      if (!bw || !bh) {
        requestAnimationFrame(placeBubble);
        return;
      }
      const pinX = (active.value.x / 100) * W;
      const pinY = (active.value.y / 100) * H;

      const left = Math.min(Math.max(pinX, bw / 2 + 6), W - bw / 2 - 6);
      let top = pinY - bh - 12;                       // 默认在点上方
      if (top < 6) top = pinY + 12;                   // 顶部放不下 → 下方
      if (top + bh > H - 6) top = Math.max(6, Math.min(H - bh - 6, pinY - bh / 2));
      bubblePos.value = { left, top };
    }

    // 首帧气泡还没有测量结果，先用居中的占位样式；nextTick 测量后换成像素坐标
    const bubbleStyle = computed(() =>
      bubblePos.value
        ? { left: bubblePos.value.left + 'px', top: bubblePos.value.top + 'px' }
        : { left: '50%', top: '12px', transform: 'translateX(-50%)' }
    );

    function toggle(pin) {
      active.value = active.value && active.value.id === pin.id ? null : pin;
    }
    function close() {
      active.value = null;
    }
    function onDocClick(e) {
      if (!e.target.closest?.('.map-guide')) close();
    }
    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    watch(active, () => {
      if (!active.value) {
        bubblePos.value = null;
        return;
      }
      Vue.nextTick(placeBubble);
    });

    onMounted(() => {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeydown);
      window.addEventListener('resize', placeBubble, { passive: true });
    });
    onUnmounted(() => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
      window.removeEventListener('resize', placeBubble);
    });

    return { pins, active, bubblePos, bubbleStyle, canvasEl, bubbleEl, toggle, close };
  },
  template: `
    <aside class="map-guide" aria-label="地图导览">
      <div class="map-head">
        <h2 class="map-title">地图导览</h2>
        <span class="map-hint">悬停看名称，点击看简介</span>
      </div>

      <div class="map-canvas" ref="canvasEl">
        <img class="map-img" src="img/china-map.svg" alt="中国地图，标注了 23 个目的地" draggable="false" />

        <button
          v-for="p in pins"
          :key="p.id"
          type="button"
          class="map-pin"
          :class="['pos-' + p.pos, { 'is-active': active && active.id === p.id, quiet: p.quiet }]"
          :style="{ left: p.x + '%', top: p.y + '%' }"
          :aria-label="p.name + '：查看简介'"
          :aria-expanded="active && active.id === p.id ? 'true' : 'false'"
          @click.stop="toggle(p)"
        >
          <span class="pin-dot" aria-hidden="true"></span>
          <span class="pin-label">{{ p.name }}</span>
        </button>

        <div
          v-if="active"
          ref="bubbleEl"
          class="map-bubble"
          :style="bubbleStyle"
          role="dialog"
          :aria-label="active.name + ' 简介'"
        >
          <button class="bubble-close" type="button" aria-label="关闭" @click.stop="close">×</button>
          <h3 class="bubble-name">{{ active.name }}</h3>
          <p class="bubble-meta">{{ active.location }} · {{ active.category }}</p>
          <p class="bubble-desc">{{ active.desc }}</p>
          <a class="bubble-link" :href="'#/destinations/' + active.id" @click.stop>详细查看 →</a>
        </div>
      </div>
    </aside>
  `,
};
