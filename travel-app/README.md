# 游迹 · 旅游攻略前端

简约风格的旅游 App 前端（Vue 3），纯静态页面，**双击 index.html 即可在浏览器打开**，无需安装任何环境。

## 项目结构

```
travel-app/
├── index.html              # 入口页面：按依赖顺序加载下面 15 个脚本
├── css/style.css           # 全站样式
├── js/
│   ├── mock-data.js        # 本地示例数据（14 目的地 / 42 景点），仅 file:// 模式使用
│   ├── api.js              # 数据接口层（全站唯一的数据出口）
│   ├── state.js            # 全局状态、localStorage 持久化、hash 路由与登录守卫
│   ├── components/
│   │   └── card.js         # 目的地卡片（首页 / 列表 / 收藏共用）
│   ├── lib/
│   │   └── markdown.js     # AI 输出的 Markdown 转 HTML（先转义，防 XSS）
│   ├── pages/              # 一个页面一个文件
│   │   ├── home.js  list.js  detail.js  favorites.js
│   │   └── favorites.js  settings.js  login.js  ai.js
│   └── app.js              # 根组件（导航 + 路由出口）与挂载
└── lib/
    └── vue.global.prod.js  # Vue 3 本地库（离线可用）
```

> 加载顺序就是依赖关系（没有打包工具）：`vue → mock-data → api → state → card → markdown → pages… → app`。
> 顶层 `const` 在经典脚本里属于全局词法作用域，后面的脚本直接可见，不需要 `import`。

> `mock-data.js` 与 `travel-server/sql/data.sql` 是同一批数据，改的时候两处要一起改。

## 页面与功能

| 页面 | 路由 | 是否需登录 | 功能 |
|------|------|-----------|------|
| 登录 / 注册 | `#/login` | 否 | 登录与注册切换（`?mode=register` 直达注册） |
| 首页 | `#/` | 是 | 搜索框、热门目的地（前 6 个，带实拍封面图） |
| 目的地列表 | `#/destinations` | 是 | 分类筛选 + 关键词搜索（支持 `?q=` `?cat=` 参数） |
| 目的地详情 | `#/destinations/:id` | 是 | 实拍封面大图、介绍、**逐日参考行程时间轴**（用景点数据自动排 Day 1/2/3）、侧边目的地信息，底部「用 AI 生成行程」直接带去 AI 页并预选该目的地 |
| 我的收藏 | `#/favorites` | 是 | 收藏列表（localStorage 持久化） |
| 设置 | `#/settings` | 是 | 显示偏好、数据清理、账号与版本信息 |

### 用户中心（导航栏右上角）

登录后导航栏右侧是一个「头像 + 用户名」的用户中心入口，**退出登录收在其中**，不再单独占一个按钮：

- 点击展开下拉菜单：账号信息（用户名、收藏数）、我的收藏、设置、退出登录。
- 点页面空白处、按 `Esc`、或跳转任意路由后，菜单都会自动收起。
- 窄屏（≤560px）只保留头像，用户名与箭头隐藏。

### 头部导航的两个断点（别随便合并）

导航有 3 项（首页 / 目的地 / AI 规划）外加头像。「收藏」「设置」都收在用户下拉菜单里，不占导航位。
`css/style.css` 里仍然留了两档，**两档都要保留**：

| 断点 | 变化 | 为什么 |
|---|---|---|
| ≤800px | 导航字号 15→14px、内边距收紧 | 3 个中文词 + 1 个动作词加头像，窄到这个宽度开始挤 |
| ≤560px | 再收一轮：字号 13px、logo 17px、留白 12px、用户名隐藏 | 让 360px 的安卓机也放得下（算下来约 344px） |

`.logo` 和 `.nav-link` 都设了 `white-space: nowrap` —— 不设的话浏览器会把「首页」拆成上下两行而不是溢出，
看起来像坏了但不报错，很难发现。
- 相关代码在 `js/app.js` 根组件 `App` 的 `menuOpen / toggleMenu / closeMenu`，样式在 `css/style.css` 的 `.user-menu` 一段。

### 吸顶表单「不要」加高度上限（踩过了）

`.ai-form` 是 `position: sticky`（宽屏时跟着页面滚，方便一边看输出一边改参数）。
**别给它加 `max-height + overflow-y: auto`**：看着像是在防「表单比视口高、底部够不着」，
实测反而把「生成行程」按钮变成了够不着 —— 上限把表单截短的同时也把整个文档截短了，
页面能滚的距离随之变小，于是页面滚到底也露不出按钮，只能靠表单内部那层滚动条。

1280×768（视口 673px）实测：

| | 表单高度 | 页面可滚 | 提交按钮位置 |
|---|---|---|---|
| 加上限 | 573px（藏起 185px） | 176px | 666~712 → **超出视口 39px，够不着** |
| 不加（现状） | 740px | 343px | 481~527 → 正常可见 |

而且 `.ai-form` 是 `.ai-layout` 的网格项，格子的高度就等于它自己的高度，
**根本吸不住**，压根不存在「吸顶元素比视口高」这回事。`css/style.css` 末尾留了这条注释。

### 设置项（`#/settings`）

设置存在 localStorage 的 `youji_settings`（key 与默认值定义在 `js/app.js`，改默认值只需改 `DEFAULT_SETTINGS`）：

| 设置 | 作用 |
|------|------|
| 字体大小 | 滑杆调节，**85% ~ 130%**（步长 5%），实时改 `--fs` = 百分比 ÷ 100；**只缩放文字**，间距、圆角、图片、卡片高度都不变 |
| 显示目的地封面照片 | 关闭后所有卡片改用 `gradient` 渐变色封面（不加载外链图片，弱网/离线友好） |
| 界面动画 | 关闭时给 `<html>` 加 `.no-anim`，用 CSS 停掉全部过渡与动画 |
| 清空我的收藏 | 清空 localStorage 里的收藏列表 |
| 恢复初始状态 | 清空收藏 + 重置设置 + 退出登录 |

> **写样式时注意**：全站字号都写成 `font-size: calc(15px * var(--fs))`（当前 92 处，只统计 `font-size`；`padding` / `height` / 圆角 / 间距一处都不缩放），
> 字体大小设置才能真正只缩放文字。新增样式请沿用这个写法——写成固定 `px` 的字号不会跟随设置变化。
> 滑杆范围与步长在 `js/app.js` 的 `FONT_MIN / FONT_MAX / FONT_STEP`，拖动时由根组件把
> `百分比 ÷ 100` 写入 `<html>` 的 `--fs`。
>
> 若 localStorage 里存的是早期版本的档位字符串（`'small'`/`'normal'`/`'large'`/`'xlarge'`），
> `loadSettings()` 会按 `LEGACY_FONT_KEYS` 自动换算成百分比，不需要手动清缓存。

### 目的地封面图

每个目的地在 `js/api.js` 里都有一个 `image` 字段，值为外链图片地址：

```js
{
  id: 1, name: '成都',
  gradient: ['#F2A65A', '#E8734B'],   // 兜底渐变色
  image: 'https://tse3-mm.cn.bing.net/th/id/OIP-C.xxx?pid=1.7',
}
```

- 当前 14 张图都用的是 **Bing 图片 CDN 直链**（国内外均可访问、无防盗链），每条链接都逐个请求验证过返回 `image/jpeg`，且逐张确认过**图片本身没有白边**（见下）。
- ⚠️ 链接末尾**只能带 `?pid=1.7`，不要加 `w=` / `h=` 尺寸参数**。Bing 一旦收到宽高，就会按目标比例把照片缩放后补白边（实测 `w=1200&h=750` 时每张图 84% 都是白边、照片缩在正中间，卡片看起来像没铺满）。去掉尺寸参数后，Bing 按原比例返回整张照片，封面才能真正填满卡片。
- 照片以 `<img loading="lazy" referrerpolicy="no-referrer">` **铺满整张卡片**（`object-fit: cover`，卡片高 320px），目的地名、评分、标签、价格等文字通过 `.card-overlay` 浮在照片底部，上面有一层从透明到 82% 黑的渐变遮罩，保证白字在任何照片上都看得清。
- 整张卡片可点击：用 `.card-stretch` 拉伸链接铺满卡片（避免 `<a>` 嵌套 `<a>`）；`.card-overlay` 设 `pointer-events: none` 让点击穿透，「查看详情」自己恢复 `pointer-events: auto`，收藏星标 `z-index` 最高所以不会被吞掉。
- **断网或链接失效不会有破图**：`@error` 触发后会退回该目的地的 `gradient` 渐变色封面，版式和现在完全一致。
- 换成自己的图片：把 `image` 改成你的图床 / OSS 地址即可，前端代码不用动；留空或删掉该字段同样自动走渐变兜底。

### 访问控制（登录守卫）

应用启动时会先执行一次路由守卫 `guardRoute()`（在 `js/app.js`），再挂载 Vue：

- **未登录**：无论打开哪个地址（含首次打开、刷新、直接输入深链），一律重定向到 `#/login`，不会先闪出首页。
- **已登录**：正常访问各页面；误入 `#/login` 会被送回首页 `#/`。
- 守卫是**白名单**式：只放行 `login`，其余一律要求登录。所以新增页面（如 `#/favorites`）不用改守卫代码，自动就是需要登录的。
- 守卫重定向使用 `location.replace`，不产生可回退的历史记录，点浏览器「后退」不会退回登录页。
- 登录状态存在 localStorage 的 `youji_session`，关闭浏览器后再次打开仍然保持登录；点右上角用户中心里的「退出登录」后立即回到登录页。

> 如果需要「每次打开程序都必须重新登录」，在 `js/app.js` 的 `logout()` 或启动处清掉会话即可，
> 例如把 `store.user` 的初始化改为 `null` 并调用 `api.logout()`。

## 如何与后端对接

页面组件只调用 `js/api.js` 中暴露的 `api.xxx()`，**对接后端时只需修改 api.js 这一个文件**：

1. 把顶部 `USE_MOCK` 改为 `false`
2. 把 `API_BASE` 改为后端地址，例如 `'http://localhost:8080'`

### 后端需要提供的接口约定

#### 1. 获取目的地列表

```
GET /api/destinations

响应 200 (application/json):
[
  {
    "id": 1,                       // 数字，唯一标识
    "name": "成都",                 // 目的地名称
    "enName": "CHENGDU",           // 英文名（用于卡片封面装饰）
    "category": "美食休闲",          // 分类：美食休闲/江南水乡/历史古迹/海岛度假/自然风光/都市风情（列表页筛选标签由数据自动生成）
    "location": "四川省",           // 所在省份
    "rating": 4.8,                 // 评分
    "priceFrom": 1280,             // 参考价（元/人起）
    "days": "3-4 天",              // 建议游玩时长
    "bestSeason": "3-6 月",        // 最佳季节
    "gradient": ["#F2A65A", "#E8734B"],  // 封面渐变色（两个色值，图片加载失败时的兜底）
    "image": "https://.../chengdu.jpg",  // 封面照片地址（可为空，为空则只显示渐变）
    "tags": ["火锅", "大熊猫"],      // 标签（2-3 个）
    "description": "……",           // 一段介绍
    "attractions": [               // 推荐景点
      { "name": "宽窄巷子", "time": "2-3 小时", "desc": "……" }
    ]
  }
]
```

#### 2. 获取目的地详情

```
GET /api/destinations/{id}

响应 200：同上单个对象；404 表示不存在
```

#### 3. 注册账号

```
POST /api/auth/register
Content-Type: application/json

{ "username": "xiaowang", "password": "123456" }

响应 200: { "username": "xiaowang" }
响应 409/400: { "message": "该用户名已被注册" }
```

#### 4. 登录

```
POST /api/auth/login
Content-Type: application/json

{ "username": "xiaowang", "password": "123456" }

响应 200: { "username": "xiaowang", "token": "jwt-token" }
响应 401: { "message": "用户名或密码错误" }
```

> 登录成功后前端把 `{ username, token }` 存在 localStorage（key: `youji_session`）。
> 后续需要鉴权的接口可让后端校验请求头 `Authorization: Bearer <token>`。
> `api.js` 的 `authHeaders()` 负责在每次请求上带这个头。

> 字段名与示例数据一致即可，字段值可自由替换。
> 如后端结构不同，也只需在 api.js 里做一层字段映射。

## 数据来源：本地示例数据 还是 后端

`js/api.js` **按打开方式自动切换**，不需要手改代码：

| 打开方式 | 数据来源 |
|---|---|
| 双击 `index.html`（`file://`） | 下方的本地示例数据，断网也能演示 |
| **`http://localhost:8080`**（推荐） | 后端 `travel-server` 托管的页面，同源调接口，数据来自 MySQL |
| `http://localhost:5173` 之类 | 调后端 `http://localhost:8080`，走跨域 |

推荐第二种 `http://localhost:8080`：在 `travel-server` 目录下 `mvn spring-boot:run`，后端会顺带托管本目录的页面。

想强制走某一端，改 `js/api.js` 顶部两行常量即可：`USE_MOCK` 与 `API_BASE`。

ile:// 下走的是同一份示例数据：目的地与景点都来自 mock-data.js（与 	ravel-server/sql/data.sql 逐字一致），AI 规划 需要后端，file:// 下会提示改用 http://localhost:8080。


> **可订日期是同样的三处同步**：区间为「今天 ~ 今天 + 2 个月」，实现在
> Java 的 `plusMonths` 则夹到月末（→ 02-28），每年的 12/29~12/31 都会对不上。
> `addMonths()` 里那段手写的日期夹取就是为这个存在的，别改成 setMonth。

> 接后端时如果页面报「请求失败」，先确认三件事：后端起了没、Redis 起了没、页面是不是用 `file://` 打开的。

## 本地开发（可选）

直接双击 `index.html` 即可（走本地示例数据）。想连后端就用后端的地址：

```bash
# 先启动后端：cd travel-server && mvn spring-boot:run
# 然后浏览器打开 http://localhost:8080
```

如果你想自己起一个静态服务器来调页面（改前端时比较方便）：

```bash
cd travel-app
python -m http.server 5173
# 打开 http://localhost:5173 —— 会自动连 http://localhost:8080 的后端
```
