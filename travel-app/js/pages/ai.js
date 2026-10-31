/* =========================================================
 * pages/ai.js — 小迹 AI 智能导游
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
      <section class="guide-head">
        <div class="guide-avatar">🤖</div>
        <div class="guide-intro">
          <h1>小迹 AI 智能导游</h1>
          <p>说个城市、定几天，我按当地节奏排一份能直接照着走的行程——交通时间会用高德实时数据核对。</p>
        </div>
      </section>

      <div class="ai-layout">
        <aside class="ai-form">
          <div class="ai-form-title">告诉小迹 <span>3 步</span></div>
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
            {{ running ? '小迹正在排…' : '🤖 让小迹排行程' }}
          </button>
          <button v-if="running" class="btn btn-outline ai-submit" @click="stop">停止生成</button>

          <p class="ai-tip" v-if="current">
            会基于本站「{{ current.name }}」的 {{ current.attractions.length }} 个景点来排行程。
          </p>
        </aside>

        <section class="ai-output">
          <div class="guide-bubble" v-if="!text && !error && !status">
            <div class="bubble-who">小迹</div>
            <p>你好，我是小迹 👋<br />选个城市、定几天，我马上给你排一趟能落地的行程。</p>
          </div>

          <div class="ai-status" v-if="status"><span class="ai-dot"></span>{{ status }}</div>
          <div class="ai-error" v-if="error">{{ error }}</div>

          <div class="guide-bubble result" v-if="text">
            <div class="bubble-who">小迹 <span v-if="running">正在输入…</span></div>
            <article class="ai-markdown" :class="{ streaming: running }" v-html="rendered"></article>
          </div>
        </section>
      </div>
    </div>
  `,
};

