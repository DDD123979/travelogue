/* =========================================================
 * api.js — 数据接口层（全站唯一的数据出口）
 *
 * 页面组件只调用 api.xxx()，不直接关心数据来源。
 * 数据来源按打开方式自动判断，不用手改代码：
 *
 *   双击 index.html（file:// 协议）→ 用下方本地示例数据，断网也能演示
 *   用本地服务器打开（http://）    → 调 Spring Boot 后端（travel-server）
 *
 * 后端接口约定见 README.md。
 * ========================================================= */

const IS_HTTP = location.protocol === 'http:' || location.protocol === 'https:';

const USE_MOCK = !IS_HTTP;   // 只有 file:// 打开时才走示例数据

/* 后端地址怎么定：
 *   - 页面由后端自己托管（线上 80/443 或 http://localhost:8080）→ 空串，走同源
 *   - 页面由独立静态服务器托管（python -m http.server 5173 之类）→ 指向本机 8080
 * 注意别只看「端口是不是 8080」：线上是 80 端口，那样会退化成
 * http://localhost:8080，访客浏览器跑去请求他自己的电脑，整站接口全挂。
 */
const DEV_STATIC_PORTS = ['3000', '4173', '5173', '5500', '8000', '8081'];
const API_BASE = !IS_HTTP ? '' : (DEV_STATIC_PORTS.includes(location.port) ? 'http://localhost:8080' : '');

/* ---------- localStorage 的 key ----------
   这三个 key 原本声明在文件下方的「Mock 用户存储」段里，现在上移到这里：
   request() 要读 token，把 key 的定义放在使用点之前才不容易看错。
   （其实放在后面也能跑 —— 函数体里的引用要到调用时才求值，不触发 TDZ ——
     但「先定义后使用」读起来更省心。下方原位置不要再声明一遍。） */
const USERS_KEY = 'youji_users';        // 已注册用户列表（仅 mock 模式使用）
const SESSION_KEY = 'youji_session';    // 当前登录用户 { username, token? }

/** 读当前会话。读不到或者存进去的不是合法 JSON 都返回 null */
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

/**
 * 鉴权请求头。
 *
 * 只读 localStorage、不碰网络，所以 file:// 打开（mock 模式）时调用它也不会出错。
 * 未登录、或者老会话里没存 token（早期版本只存 username）时返回空对象 ——
 * 请求照常发出去，由后端决定哪些接口要登录：订单是 401，
 * 目的地和酒店照常 200，前端拿到的仍是 {message} 里的中文提示。
 */
function authHeaders() {
  const session = getSession();
  return session && session.token ? { Authorization: 'Bearer ' + session.token } : {};
}

/* ---------- 通用请求函数（真实后端使用） ---------- */

/** 普通接口的超时：后端卡住时不要让页面无限转圈 */
const REQUEST_TIMEOUT_MS = 15000;

/**
 * 401 统一处理：清掉本地会话并回到登录页。
 * 登录/注册接口自己的 401 不在此列 —— 那是密码错误，页面要显示提示，不能跳走。
 */
function handleUnauthorized() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* 隐私模式下 localStorage 不可用，忽略 */
  }
  if (!location.hash.startsWith('#/login')) {
    location.hash = '#/login';
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(API_BASE + path, {
      // 【顺序要紧】headers 必须写在 ...options 之前。
      // 反过来写的话，options 里一旦带 headers（比如流式请求自己设的），
      // 上面的 Content-Type 和 Authorization 会被整个覆盖掉。
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      signal: controller.signal,
      ...options,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    handleUnauthorized();
  }

  if (!res.ok) {
    // 后端出错时返回 {"message": "中文提示"}，优先把它取出来显示，
    // 取不到才退回状态码 —— 否则用户只能看到「409 Conflict」这种看不懂的提示
    let message = `请求失败：${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body && body.message) message = body.message;
    } catch {
      /* 响应体不是 JSON，就用上面那句兜底 */
    }
    throw new Error(message);
  }
  return res.json();
}

/* ---------- 本地示例数据（模拟后端返回） ----------
   已拆分到 js/mock-data.js（约 350 行），由 index.html 在本文件之前加载。
   改示例数据去那个文件；改接口逻辑只动本文件。 */

/* ---------- 本地时间辅助 ----------
   一律不能用 toISOString()：那给的是 UTC，东八区早上 8 点之前算出来的日期
   会比本地日期早一天 —— 用户看到的「今天」变成昨天，默认入住日期就是过去的日期。 */
function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}


/** 某年某月有多少天。m 是 0-11：new Date(y, m + 1, 0) 就是「下个月的第 0 天」= 本月最后一天 */
function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

/* 加 N 个月。这个函数看着啰嗦，但每个判断都有理由 —— 它必须和后端
   LocalDate.plusMonths 的行为逐字一致，否则前端放出来的日期会被后端拒掉。

   【为什么不能用 setMonth】JS 的 setMonth 遇到超出目标月天数的日期会「静默溢出」：
   2026-12-31 加两个月，月份变成 2 月（31 号不存在），就顺延成 3 月 3 日；
   而 Java 的 plusMonths 是「夹到目标月最后一天」，给的是 2027-02-28。
   两边差的这 3 天，正好落在每年 12/29、12/30、12/31 这三天上 ——
   前端日历会多放出几天可点的日期，用户点了提交才被后端打回来。

   做法：先算出目标年月（月份用整数运算进位，不碰 Date），
   再把「日」夹到目标月的天数以内，最后才交给 Date 构造。 */
function addMonths(date, months) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const t = y * 12 + m + months;                 // 总月序，负数月份也能正确进位
  const ty = Math.floor(t / 12);
  const tm = ((t % 12) + 12) % 12;               // Date 的月份是 0-11
  const day = Math.min(date.getDate(), daysInMonth(ty, tm));
  const p = (n) => String(n).padStart(2, '0');
  return `${ty}-${p(tm + 1)}-${p(day)}`;
}

/** 可规划的最晚出发日期 = 今天起滚动两个月（AI 页用它限制日期选择）。
    【必须现算】不要把它缓存成模块级常量：它的下界（localDate()）是提交时现取的，
    上界一旦冻在页面打开那一刻，就会变成「后端允许、file:// 拒绝」这种最难受的偏差。 */
function maxCheckInDate() {
  return addMonths(new Date(), 2);
}

/* ---------- Mock 请求模拟（含 200ms 网络延迟） ----------
   options 只在 POST 时用得上（要读 body），GET 传不传都行。
   【每个新接口都要在这里有分支】漏了的话，双击 index.html 打开时会直接
   报「接口不存在：/api/xxx」—— 而 api.js 的注释承诺了 file:// 下能演示。 */
async function mockRequest(path, options = {}) {
  await new Promise((r) => setTimeout(r, 200));
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  let m;

  if ((m = path.match(/^\/api\/destinations\/(\d+)$/))) {
    const item = MOCK_DESTINATIONS.find((d) => d.id === Number(m[1]));
    if (!item) throw new Error('目的地不存在');
    return item;
  }
  if (path === '/api/destinations') {
    return MOCK_DESTINATIONS;
  }

  throw new Error(`接口不存在：${path}`);
}

/* ---------- Mock 用户存储（localStorage 模拟后端用户库） ---------- */

function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ---------- 对外暴露的接口（页面只调用这些函数） ---------- */
const api = {
  /** 获取全部目的地列表 */
  getDestinations() {
    return USE_MOCK ? mockRequest('/api/destinations') : request('/api/destinations');
  },
  /** 按 id 获取目的地详情 */
  getDestination(id) {
    return USE_MOCK ? mockRequest(`/api/destinations/${id}`) : request(`/api/destinations/${id}`);
  },

  /**
   * 注册账号
   * @returns {Promise<{username: string}>}
   * 失败时 reject(Error)，message 为提示文案
   */
  async register(username, password) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const users = loadUsers();
      if (users.some((u) => u.username === username)) {
        throw new Error('该用户名已被注册');
      }
      users.push({ username, password });
      saveUsers(users);
      // 顺手记下登录态：不然注册完一刷新就退回登录页
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
      return { username };
    }
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // 后端注册成功会一并下发 token，存起来，刷新页面不用重新登录
    if (data.token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: data.username, token: data.token, avatar: data.avatar || '' }));
    }
    return data;
  },

  /**
   * 登录
   * @returns {Promise<{username: string}>}
   */
  async login(username, password) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const user = loadUsers().find(
        (u) => u.username === username && u.password === password
      );
      if (!user) throw new Error('用户名或密码错误');
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
      return { username };
    }
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // 约定后端返回 { username, token }；token 存起来供后续请求携带
    if (data.token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: data.username, token: data.token, avatar: data.avatar || '' }));
    }
    return data;
  },

  /**
   * 用服务端的最新资料刷新本地会话（头像可能是在别的设备/浏览器换的）。
   * 401 时静默失败，交给 request() 里的统一处理。
   */
  async refreshProfile() {
    const session = getSession();
    if (!session || !session.token || USE_MOCK) return session;
    try {
      const me = await request('/api/auth/me');
      const next = { ...session, username: me.username, avatar: me.avatar || '' };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    } catch (e) {
      return session;
    }
  },

  /** 退出登录 */
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  /** 获取当前登录用户（未登录返回 null）。返回 { username } 或 { username, token } */
  getCurrentUser() {
    return getSession();
  },

  /* ---------- 预订 ---------- */



  /**
   * AI 行程规划（流式）
   *
   * 后端用 SSE 一段段往回推，所以这里用不了通用的 request()——
   * 得拿到 response.body 这个 ReadableStream，自己按 SSE 协议切事件。
   *
   * @param {{destinationId:number, days:number, preference:string}} payload
   * @param {{onDelta?:Function, onStatus?:Function}} handlers
   *        onDelta(增量文本) / onStatus(状态提示，例如「正在思考…」)
   * @param {AbortSignal} [signal] 传进来就能中途取消（用户点「停止生成」）
   * @returns {Promise<string>} 完整正文
   */
  async planItinerary(payload, handlers = {}, signal) {
    if (USE_MOCK) {
      throw new Error(
        'AI 规划需要后端服务：双击 index.html 打开时用的是本地示例数据，' +
        '请改用 http://localhost:8080 访问。'
      );
    }

    const res = await fetch(API_BASE + '/api/ai/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    // 没进流就失败了（没配 Key、目的地不存在、请求体不合法…），后端给的是 JSON 错误体
    if (!res.ok) {
      let message = `请求失败：${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (body && body.message) message = body.message;
      } catch {
        /* 不是 JSON 就用上面那句兜底 */
      }
      throw new Error(message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let full = '';

    /** 处理一个 SSE 事件块（两个空行之间算一块） */
    const handleEvent = (rawEvent) => {
      let event = 'message';
      const dataLines = [];
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) return;

      let data;
      try {
        data = JSON.parse(dataLines.join('\n'));
      } catch {
        return; // 半截 JSON（网络分包），丢弃即可
      }

      if (event === 'delta') {
        full += data.text;
        if (handlers.onDelta) handlers.onDelta(data.text);
      } else if (event === 'status') {
        if (handlers.onStatus) handlers.onStatus(data.text);
      } else if (event === 'error') {
        throw new Error(data.message);
      }
      // done 事件不用管：流读完自然就结束了
    };

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        // 按 UTF-8 增量解码，中文不会被半个字切断；同时统一换行符，只认 \n\n
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          handleEvent(rawEvent); // error 事件会从这里抛出去，交给下面的 finally
        }
      }
    } finally {
      // 出错或用户中止时把连接放掉，别让它一直挂着
      reader.cancel().catch(() => {});
    }

    return full;
  },


  /* ---------- 个人资料 ---------- */

  /** 上传并更新头像，返回 { avatar } */
  async updateAvatar(file) {
    if (USE_MOCK) throw new Error('修改头像需要连接后端');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(API_BASE + '/api/auth/avatar', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('登录状态已失效，请重新登录');
    }
    if (!res.ok) {
      let message = '头像上传失败';
      try {
        const body = await res.json();
        if (body && body.message) message = body.message;
      } catch (e) { /* 忽略非 JSON */ }
      throw new Error(message);
    }
    return res.json();
  },

  /**
   * 修改用户名：需要当前密码。后端会作废旧 token 并下发新的，
   * 这里顺手把本地会话一起换掉，避免下次请求 401。
   */
  async changeUsername(newUsername, password) {
    const data = await request('/api/auth/username', {
      method: 'POST',
      body: JSON.stringify({ newUsername, password }),
    });
    if (data.token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        username: data.username, token: data.token, avatar: data.avatar || '',
      }));
    }
    return data;
  },

  /** 忘记密码第一步：请求验证码（演示环境后端会直接把 code 返回） */
  forgotPassword(username) {
    return request('/api/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  /** 忘记密码第二步：用用户名 + 验证码 + 新密码重设 */
  resetWithCode(username, code, newPassword) {
    return request('/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ username, code, newPassword }),
    });
  },

  /** 忘记原密码：凭登录态直接重设，成功后服务端会吊销 token，必须重新登录 */
  resetPassword(newPassword) {
    return request('/api/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  /** 修改密码：成功后旧 token 仍然有效，不需要重新登录 */
  changePassword(oldPassword, newPassword) {
    return request('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  /* ---------- 社区：旅行分享 ---------- */

  /** 帖子列表；传 destinationId 只看某个城市 */
  getPosts(destinationId, favorites) {
    if (USE_MOCK) return Promise.resolve([]);
    const params = [];
    if (destinationId) params.push('destinationId=' + encodeURIComponent(destinationId));
    if (favorites) params.push('favorites=true');
    return request('/api/posts' + (params.length ? '?' + params.join('&') : ''));
  },

  /** 发布分享：{ destinationId, content, images: [url...] } */
  createPost(payload) {
    return request('/api/posts', { method: 'POST', body: JSON.stringify(payload) });
  },

  /** 点赞 / 取消点赞（toggle），返回 { liked, likeCount } */
  likePost(id) {
    return request('/api/posts/' + id + '/like', { method: 'POST' });
  },

  /** 收藏 / 取消收藏（toggle），返回 { favorited, favoriteCount } */
  favoritePost(id) {
    return request('/api/posts/' + id + '/favorite', { method: 'POST' });
  },

  /* ---------- 评论 ---------- */

  getComments(postId) {
    return request('/api/posts/' + postId + '/comments');
  },

  addComment(postId, content) {
    return request('/api/posts/' + postId + '/comments', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  deleteComment(commentId) {
    return request('/api/comments/' + commentId, { method: 'DELETE' });
  },

  /** 删除自己的分享 */
  deletePost(id) {
    return request('/api/posts/' + id, { method: 'DELETE' });
  },

  /**
   * 上传一张照片，返回 { url }。
   * 这里不能用 request()：它固定带 Content-Type: application/json，
   * 而 multipart 必须让浏览器自己生成 boundary。
   */
  async uploadImage(file) {
    if (USE_MOCK) throw new Error('上传需要连接后端：请用 http://localhost:8080 打开');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(API_BASE + '/api/uploads', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('登录状态已失效，请重新登录');
    }
    if (!res.ok) {
      let message = '上传失败';
      try {
        const body = await res.json();
        if (body && body.message) message = body.message;
      } catch (e) { /* 忽略非 JSON 响应 */ }
      throw new Error(message);
    }
    return res.json();
  },

};
