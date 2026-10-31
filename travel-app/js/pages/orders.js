/* =========================================================
 * pages/orders.js — 我的订单
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */


/* ---------- 我的订单页 ---------- */
const OrdersPage = {
  setup() {
    const list = ref([]);
    const loading = ref(true);
    const error = ref('');
    const cancelling = ref(0);   // 正在取消的订单 id，防止重复点

    async function load() {
      try {
        list.value = await api.getMyBookings();
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    onMounted(load);

    async function cancel(order) {
      cancelling.value = order.id;
      try {
        const updated = await api.cancelBooking(order.id);
        // 就地替换这一条，不重新拉整个列表 —— 省一次请求，也不会有列表跳动
        const i = list.value.findIndex((o) => o.id === order.id);
        if (i >= 0) list.value[i] = updated;
      } catch (e) {
        error.value = e.message;
      } finally {
        cancelling.value = 0;
      }
    }

    return { list, loading, error, cancelling, cancel };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">我的订单</h1>

      <div class="empty" v-if="loading">
        <div class="icon">⏳</div>
        <p>加载中…</p>
      </div>

      <div class="empty" v-else-if="error">
        <div class="icon">🧭</div>
        <p>{{ error }}</p>
        <a class="btn btn-outline btn-sm" href="#/booking">去预订</a>
      </div>

      <div class="empty" v-else-if="!list.length">
        <div class="icon">🧳</div>
        <p>还没有预订记录</p>
        <a class="btn btn-outline btn-sm" href="#/booking">去预订</a>
      </div>

      <div class="order-list" v-else>
        <article class="order-card" v-for="o in list" :key="o.id">
          <div class="order-head">
            <span class="order-hotel">{{ o.hotelName }}</span>
            <span class="order-status" :class="{ off: o.status === '已取消' }">{{ o.status }}</span>
          </div>

          <div class="order-sub">
            {{ o.destinationName }} · {{ o.checkIn }} 入住
            · {{ o.days }} 晚 · {{ o.people }} 人 {{ o.rooms }} 间
          </div>

          <div class="order-foot">
            <div class="order-no">订单号 {{ o.orderNo }}<br />下单于 {{ o.createdAt }}</div>
            <div class="order-right">
              <div class="order-price">
                ¥{{ o.unitPrice }} × {{ o.rooms }} 间 × {{ o.days }} 晚 =
                <b>¥{{ o.totalAmount }}</b>
              </div>
              <button class="btn btn-outline btn-danger btn-sm"
                v-if="o.status === '已预订'"
                :disabled="cancelling === o.id" @click="cancel(o)">
                {{ cancelling === o.id ? '取消中…' : '取消预订' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  `,
};
