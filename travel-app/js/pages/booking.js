/* =========================================================
 * pages/booking.js — 预订页（含日历与实时总价）
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];   // 周一开头：和 cells 里算前置空格的公式配套

const BookingPage = {
  setup() {
    const destinations = ref([]);
    const hotels = ref([]);
    const loading = ref(true);
    const loadError = ref('');
    const submitting = ref(false);
    const submitError = ref('');

    // 详情页点「立即预订」跳过来会带上 ?dest=ID，直接选中那个城市
    const destId = ref(route.value.query.dest ? Number(route.value.query.dest) : null);
    const hotelId = ref(null);
    const days = ref(3);
    const people = ref(2);
    const checkIn = ref(localDate(1));   // 默认明天：今天入住不太现实
    const today = localDate();           // 可订窗口的下界
    const maxDate = maxCheckInDate();    // 可订窗口的上界：今天起两个月（后端也会再挡一道）

    /* 日历当前显示的月份 'yyyy-MM'。从 checkIn 而不是 today 初始化：
       9/30 那天默认入住日是 10/01，用 today 会打开一个根本没有选中日的月份。 */
    const viewMonth = ref(checkIn.value.slice(0, 7));

    /* ---- 日历 ---- */
    const minMonth = today.slice(0, 7);
    const maxMonth = maxDate.slice(0, 7);

    /* 'yyyy-MM' → 连续的月序号。月份不能直接比字符串再拿去做加减，
       转成序号之后「上一个月」「下一个月」「到头了没」都是纯整数运算。
       注意全程不碰 Date：new Date('2026-12-01') 那类解析会把 addMonths()
       刚绕开的月末溢出问题重新引回来。 */
    const ymIndex = (s) => {
      const [y, m] = s.split('-').map(Number);
      return y * 12 + m - 1;
    };

    const canPrev = computed(() => ymIndex(viewMonth.value) > ymIndex(minMonth));
    const canNext = computed(() => ymIndex(viewMonth.value) < ymIndex(maxMonth));

    function shiftMonth(delta) {
      const c = Math.min(Math.max(ymIndex(viewMonth.value) + delta, ymIndex(minMonth)), ymIndex(maxMonth));
      viewMonth.value = `${Math.floor(c / 12)}-${String((c % 12) + 1).padStart(2, '0')}`;
    }

    const cells = computed(() => {
      const [y, m] = viewMonth.value.split('-').map(Number);
      // 前置空格：getDay() 是 0=周日，而这里第一列是周一，所以要 +6 再取模
      const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
      const total = daysInMonth(y, m - 1);
      const list = [];
      for (let i = 0; i < lead; i++) list.push(null);
      for (let d = 1; d <= total; d++) {
        const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        list.push({
          d,
          date,
          /* 下界也要判 —— 它才是原来 <input type="date" :min> 想做的事。
             顺带说一句：那个 :min 其实从来没生效过（这个页面没有 <form>，
             约束校验不会触发），所以日历是严格的升级，不是等价替换。 */
          disabled: date < today || date > maxDate,
          isToday: date === today,
          label: `${y} 年 ${m} 月 ${d} 日`,
        });
      }
      // 补满 42 格（6 行）：一个月的行数在 4~6 之间，不补齐的话左侧栏会随翻月忽高忽低
      while (list.length < 42) list.push(null);
      return list;
    });

    onMounted(async () => {
      try {
        destinations.value = await api.getDestinations();
        // 没带 ?dest= 时（直接从导航栏点「预订」进来）默认选第一个城市
        if (!destId.value && destinations.value.length) {
          destId.value = destinations.value[0].id;
        }
      } catch (e) {
        loadError.value = e.message;
      } finally {
        loading.value = false;
      }
    });

    // 目的地一变就重新拉酒店。immediate 让它首次也跑 ——
    // 带 ?dest= 进来时 destId 在 setup 阶段就填好了，不用等 onMounted
    watch(
      destId,
      async (id) => {
        hotels.value = [];
        // 【必须清空】否则会留着上一个城市的酒店 id，
        // 提交时后端一比对就报「该酒店不属于所选目的地」
        hotelId.value = null;
        if (!id) return;
        try {
          hotels.value = await api.getHotels(id);
          if (hotels.value.length) hotelId.value = hotels.value[0].id;
        } catch (e) {
          loadError.value = e.message;
        }
      },
      { immediate: true }
    );

    const currentHotel = computed(
      () => hotels.value.find((h) => h.id === hotelId.value) || null
    );

    /* 房间数 = ceil(人数 / 2)，每间住 2 人，恒 ≥ 1 —— 和后端 BookingService 同一套算法。
       Number() 不能省：<input type="number"> 被清空时 v-model.number 给出的是
       空字符串而不是 null，直接参与运算会变成 NaN。 */
    const rooms = computed(() => {
      const n = Number(people.value) || 0;
      return n > 0 ? Math.ceil(n / 2) : 1;
    });

    /* 实时预估，只是给用户看的。
       真正落库的金额由后端用数据库里的单价重新算一遍 —— 请求体里根本不带价格。 */
    const totalAmount = computed(() => {
      if (!currentHotel.value) return 0;
      return currentHotel.value.pricePerNight * rooms.value * (Number(days.value) || 0);
    });

    async function submit() {
      submitError.value = '';
      if (!hotelId.value) {
        submitError.value = '请先选择酒店';
        return;
      }
      submitting.value = true;
      try {
        await api.createBooking({
          destinationId: destId.value,
          hotelId: hotelId.value,
          checkIn: checkIn.value,
          days: Number(days.value),
          people: Number(people.value),
        });
        // 不弹提示，直接跳到订单列表：这单就在第一条，
        // 带着订单号和金额，比一闪而过的 toast 更有说服力
        go('/orders');
      } catch (e) {
        submitError.value = e.message;
      } finally {
        submitting.value = false;
      }
    }

    return {
      destinations, hotels, loading, loadError, submitting, submitError,
      destId, hotelId, days, people, checkIn, today, maxDate,
      WEEKDAYS, viewMonth, cells, canPrev, canNext, shiftMonth,
      currentHotel, rooms, totalAmount, submit,
    };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">预订</h1>

      <div class="empty" v-if="loading">
        <div class="icon">⏳</div>
        <p>加载中…</p>
      </div>

      <div class="empty" v-else-if="loadError">
        <div class="icon">🧭</div>
        <p>{{ loadError }}</p>
        <a class="btn btn-outline btn-sm" href="#/destinations">返回目的地</a>
      </div>

      <div class="ai-layout" v-else>
        <aside class="ai-form">
          <label class="ai-label">目的地</label>
          <select class="ai-input" v-model.number="destId">
            <option v-for="d in destinations" :key="d.id" :value="d.id">
              {{ d.name }} · {{ d.location }}
            </option>
          </select>

          <div class="ai-label" id="checkin-label">入住日期 · <b>{{ checkIn }}</b></div>
          <div class="cal" role="group" aria-labelledby="checkin-label">
            <div class="cal-head">
              <button type="button" class="cal-nav" aria-label="上个月"
                :disabled="!canPrev" @click="shiftMonth(-1)">‹</button>
              <span class="cal-title">{{ viewMonth.replace('-', ' 年 ') }} 月</span>
              <button type="button" class="cal-nav" aria-label="下个月"
                :disabled="!canNext" @click="shiftMonth(1)">›</button>
            </div>
            <div class="cal-week">
              <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
            </div>
            <div class="cal-grid">
              <!-- 空格子和日期格子共用 .cal-cell，保证七列等宽；
                   :key 不能只用下标 —— 翻月时格子数会变，纯下标会让 Vue 复用 DOM
                   留下上一轮的 :disabled -->
              <template v-for="(c, i) in cells" :key="c ? c.date : 'blank' + i">
                <span v-if="!c" class="cal-cell blank"></span>
                <button v-else type="button" class="cal-cell"
                  :class="{ active: c.date === checkIn, today: c.isToday }"
                  :disabled="c.disabled" :aria-label="c.label"
                  :aria-pressed="c.date === checkIn" @click="checkIn = c.date">{{ c.d }}</button>
              </template>
            </div>
          </div>
          <p class="ai-tip">可预订 {{ today }} 至 {{ maxDate }}（今起两个月内）</p>

          <label class="ai-label">入住天数</label>
          <input class="ai-input" type="number" min="1" max="15" v-model.number="days" />

          <label class="ai-label">入住人数</label>
          <input class="ai-input" type="number" min="1" max="20" v-model.number="people" />

          <p class="ai-tip">{{ people }} 人需要 {{ rooms }} 间房（每间住 2 人）</p>

          <button class="btn btn-primary ai-submit"
            :disabled="submitting || !hotelId" @click="submit">
            {{ submitting ? '提交中…' : '提交预订' }}
          </button>

          <div class="ai-error" v-if="submitError" style="margin-top: 12px;">{{ submitError }}</div>
        </aside>

        <section class="ai-output">
          <div class="book-head">
            <h2>选择酒店</h2>
            <span class="book-count" v-if="hotels.length">共 {{ hotels.length }} 家</span>
          </div>

          <div class="empty" v-if="!hotels.length">
            <div class="icon">🏨</div>
            <p>这个目的地还没有可预订的酒店</p>
          </div>

          <div class="hotel-list" v-else>
            <button v-for="h in hotels" :key="h.id" type="button"
              class="hotel-item" :class="{ active: hotelId === h.id }"
              @click="hotelId = h.id">
              <div class="hotel-main">
                <div class="hotel-name">
                  {{ h.name }}<span class="hotel-star">{{ '★'.repeat(h.star) }}</span>
                </div>
                <div class="hotel-sub">{{ h.district }} · {{ h.rating }} 分</div>
                <div class="hotel-desc">{{ h.desc }}</div>
              </div>
              <div class="hotel-side">
                <div class="hotel-price"><b>¥{{ h.pricePerNight }}</b><span>/间/晚</span></div>
                <div class="hotel-pick">{{ hotelId === h.id ? '已选' : '选择' }}</div>
              </div>
            </button>
          </div>

          <div class="book-total" v-if="currentHotel">
            <div class="book-total-text">
              {{ currentHotel.name }} · ¥{{ currentHotel.pricePerNight }}
              × {{ rooms }} 间 × {{ days }} 晚
            </div>
            <div class="book-total-price"><b>¥{{ totalAmount }}</b></div>
          </div>
        </section>
      </div>
    </div>
  `,
};
