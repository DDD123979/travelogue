/* =========================================================
 * pages/ai.js — AI 行程规划页
 * （由原单文件 app.js 拆分，加载顺序见 index.html）
 * ========================================================= */


const AiPage = {
  setup() {
    const list = ref([]);
    // 从详情页「AI 生成行程」跳过来会带着 ?dest=ID，直接选中那个目的地
    const destId = ref(route.value.query.dest ? Number(route.value.query.dest) : null);
    const days = ref(3);
    const preference = ref('');
    const text = ref('');
    const status = ref('');
    const error = ref('');
    const running = ref(false);
    let controller = null;   // 用来实现「停止生成」

    const PRESETS = [
      '第一次去，走经典景点',
      '带爸妈，节奏慢一点',
      '亲子游，少走路',
      '摄影出片优先',
      '专心吃当地美食',
      '预算有限，性价比优先',
    ];

    onMounted(async () => {
      try {
        list.value = await api.getDestinations();
        if (!destId.value && list.value.length) {
          destId.value = list.value[0].id;
        }
      } catch (e) {
        error.value = e.message;
      }
    });

    const current = computed(
      () => list.value.find((d) => d.id === destId.value) || null
    );
    const rendered = computed(() => renderMarkdown(text.value));

    async function start() {
      if (running.value || !destId.value) return;
      error.value = '';
      text.value = '';
      status.value = '正在连接大模型…';
      running.value = true;
      controller = new AbortController();

      try {
        await api.planItinerary(
          {
            destinationId: destId.value,
            days: Number(days.value) || 3,
            preference: preference.value,
          },
          {
            onStatus: (note) => (status.value = note),
            onDelta: (chunk) => {
              status.value = '';       // 一有正文就把「思考中」收起来
              text.value += chunk;
            },
          },
          controller.signal
        );
      } catch (e) {
        if (e.name === 'AbortError') {
          if (text.value) text.value += '\n\n（已停止生成）';
        } else {
          error.value = e.message;
        }
      } finally {
        status.value = '';
        running.value = false;
        controller = null;
      }
    }

    function stop() {
      if (controller) controller.abort();
    }

    function usePreset(p) {
      if (preference.value.includes(p)) return;   // 重复点就不再加一遍
      preference.value = preference.value.trim()
        ? preference.value.trim().replace(/[；;]\s*$/, '') + '；' + p
        : p;
    }

    return {
      list, destId, days, preference, text, status, error, running,
      current, rendered, PRESETS, start, stop, usePreset,
    };
  },
  template: `
    <div class="page container">
      <h1 class="page-title">AI 行程规划</h1>

      <div class="ai-layout">
        <aside class="ai-form">
          <label class="ai-label">目的地</label>
          <select class="ai-input" v-model.number="destId">
            <option v-for="d in list" :key="d.id" :value="d.id">
              {{ d.name }} · {{ d.category }} · {{ d.location }}
            </option>
          </select>

          <label class="ai-label">玩几天</label>
          <input class="ai-input" type="number" min="1" max="15" v-model.number="days" />

          <label class="ai-label">旅行偏好（选填）</label>
          <textarea class="ai-input" rows="3" v-model="preference"
            placeholder="例如：想吃地道小吃，不想太赶"></textarea>
          <div class="ai-presets">
            <button v-for="p in PRESETS" :key="p" type="button" class="ai-chip"
              @click="usePreset(p)">{{ p }}</button>
          </div>

          <button class="btn btn-primary ai-submit" :disabled="running || !destId" @click="start">
            {{ running ? '生成中…' : '✨ 生成行程' }}
          </button>
          <button v-if="running" class="btn btn-outline ai-submit" @click="stop">停止生成</button>

          <p class="ai-tip" v-if="current">
            会基于本站「{{ current.name }}」的 {{ current.attractions.length }} 个景点来排行程。
          </p>
        </aside>

        <section class="ai-output">
          <div class="empty" v-if="!text && !error && !status">
            <div class="icon">✨</div>
            <p>选好目的地和天数，点「生成行程」<br />AI 会排出一份逐日行程，边写边显示。</p>
          </div>

          <div class="ai-status" v-if="status"><span class="ai-dot"></span>{{ status }}</div>
          <div class="ai-error" v-if="error">{{ error }}</div>

          <article class="ai-markdown" :class="{ streaming: running }"
            v-if="text" v-html="rendered"></article>
        </section>
      </div>
    </div>
  `,
};

/* ---------- 预订页 ---------- */
// 复用 AI 规划页的两栏骨架（.ai-layout / .ai-form / .ai-label / .ai-input），
// 视觉上和 AI 页是同一套东西，不用为它新写样式。
// 日期相关的 localDate() / addMonths() / maxCheckInDate() 来自 api.js
// （两个文件都是普通 <script>，共享全局作用域），放在那边是因为下单校验也要用它们，
// 一份实现两处共用才不会漂移。
