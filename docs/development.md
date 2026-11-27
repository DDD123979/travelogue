# 游迹 · 开发说明

> 统一的开发规范：目录结构、前后端约定、数据库变更、配置与排错。
> 架构原理见 [架构说明](architecture.md)，接口见 [接口说明](api.md)。

## 1. 完整目录

```
travel-app/                     前端（零构建 Vue 3）
├── index.html                  唯一入口；按顺序加载 css/ 与 js/
├── css/style.css               全站样式（字号统一走 --fs 变量）
├── js/
│   ├── mock-data.js            离线示例数据（仅 file:// 使用）
│   ├── api.js                  唯一数据出口：真实请求与 mock 的切换点
│   ├── state.js                全局 store、hash 路由、登录守卫
│   ├── app.js                  根组件：顶栏、用户菜单、通知、图片查看器
│   ├── components/card.js      目的地卡片（首页 / 列表 / 收藏共用）
│   ├── lib/markdown.js         AI 输出的轻量 Markdown 渲染（先转义防 XSS）
│   └── pages/                  一页一文件：home / list / detail / ranking /
│                               community / profile / favorites / settings /
│                               login / ai
├── lib/vue.global.prod.js      Vue 3 运行时（本地库，离线可用）
└── img/                        封面图与 logo

travel-server/                  后端（Spring Boot 3.5）
├── src/main/java/com/youji/travel/
│   ├── controller/             REST 接口（参数、鉴权、返回 DTO）
│   ├── service/                业务逻辑、缓存、外部调用
│   ├── mapper/                 MyBatis-Plus Mapper（无 XML）
│   ├── entity/ dto/            实体与对外契约（分离）
│   ├── config/                 CORS、静态资源、上传目录、演示数据
│   └── common/                 统一异常与错误响应
├── src/main/resources/         application.yml
├── sql/                        schema.sql / data.sql
└── .env.example                环境变量模板

deploy/                         部署（Nginx、systemd、迁移、备份脚本）
docs/                           需求、架构、开发、接口文档
```

## 2. 前端规范

### 2.1 脚本加载顺序就是依赖顺序

`index.html` 按以下顺序加载，**不要调整**：

```
vue → mock-data → api → state → components → lib → pages… → app
```

- 没有打包工具，顶层 `const` 在经典脚本里属于全局词法作用域，后面的脚本可直接看到；
- `app.js` 最后执行，负责挂载；页面组件必须先在 `components` 注册。

### 2.2 新增页面

1. `js/pages/` 新建组件对象（`{ setup(), template }`）；
2. `index.html` 加 `<script>`（在 `app.js` 之前）；
3. `app.js` 的 `view` / `navActive` 加路由分支，并在 `components` 注册；
4. 样式追加到 `css/style.css` 末尾。

守卫是**白名单**式：只放行 `login`，其余一律要求登录，所以新页面不用改守卫。

### 2.3 CSS 约定

- **字号一律写成 `font-size: calc(15px * var(--fs))`**：设置里的字号滑杆只改 `--fs`，间距 / 高度 / 圆角 / 图片都不缩放。写成固定 `px` 的字号不会跟随设置变化。
- **导航两个断点都要保留**：≤800px 收字号与内边距；≤560px 再收一轮并隐藏用户名（360px 安卓机也能放下）。
- `.logo` 与 `.nav-link` 必须 `white-space: nowrap`，否则「首页」会被折成两行，看起来像坏页但不报错。
- **`.ai-form` 不要加 `max-height + overflow-y: auto`**：它是 sticky 网格项，加上限会把整个文档截短，反而让「生成行程」按钮滚不到（1280×768 实测超出视口 39px）。

### 2.4 数据与封面图

- `api.js` 按打开方式自动切换：`file://` 走 mock，`http://localhost:8080` 走后端，`5173` 等静态端口自动指向 `localhost:8080`；
- `mock-data.js` 与 `sql/data.sql` 是同一批数据，**改一处必须同步另一处**；
- 封面图用外链时必须**只带 `?pid=1.7`，不要加 `w=` / `h=` 尺寸参数**——Bing 收到宽高会补白边，照片缩在中间；
- 图片加载失败由 `@error` 回退到该目的地的渐变色，版式不变。

## 3. 后端规范

### 3.1 新增接口

```
Controller（路由 + requireUser 鉴权）
   → Service（业务规则、缓存、外部调用）
      → Mapper（Lambda 条件，不写 XML）
         → Entity
   ← DTO（与实体分离，字段名对齐前端）
```

**错误契约**：任何失败都返回**真实 HTTP 状态码** + `{"message": "中文提示"}`。禁止用 200 包错误——前端只看 `res.ok`，把错误当数据渲染会直接白屏。

**鉴权**：写接口必须显式调用 `requireUser(authorization)`；项目没有 Spring Security 过滤器链，漏写即接口裸奔。

**降级**：外部服务（AI / 高德）失败不能抛给用户，要返回可用的兜底结果。

**种子数据**：`travel-server/sql/data.sql` 由 `travel-app/js/mock-data.js` 生成，**不要手改**。改数据只改 `mock-data.js`，再执行：

```bash
node travel-server/sql/generate-data.js
```

脚本会按 `schema.sql` 的列顺序重写 data.sql，并把目的地 / 标签 / 景点一起刷新。

### 3.2 数据库变更

1. `deploy/migrations/` 新建 `0NN_描述.sql`（序号递增）；
2. 同步更新 `sql/schema.sql` 与 `sql/data.sql`；
3. 脚本尽量可重复执行（`CREATE TABLE IF NOT EXISTS` 等）；
4. 执行：`mysql <数据库> < deploy/migrations/0NN_xxx.sql`。

> 表名 / 列名的保留字处理（`t_user`、`attr_desc`）与字段类型选择见 [架构说明 §4](architecture.md#4-数据模型)，改动前先看那张表。

### 3.3 配置与密钥

- 真实值只写 `.env`（已被 `.gitignore` 忽略），模板见 `travel-server/.env.example`；
- `DB_USERNAME` / `DB_PASSWORD` **无默认值**，缺失时启动失败；
- AI 与高德 Key 只在服务端使用，不要下发前端，也不要写进日志。

## 4. 本地自检

```bash
# 后端编译（不跑测试）
cd travel-server && mvn -DskipTests package

# 前端语法（Node 仅用于检查，不参与运行）
node --check travel-app/js/app.js
```

改动后手动过一遍：首页 → 目的地 → 详情 → 排行 → 社区 → AI，确认无白屏（白屏时看页面顶部红条里的报错）。

## 5. 常见开发问题

| 现象 | 原因 / 解决 |
|---|---|
| 改完代码刷新还是旧的 | 浏览器缓存；静态资源已用 `?v=` 与 `no-cache`，部署时记得更新版本号 |
| 页面白屏 + 顶部红条 | 模板用了 setup 未返回的变量，按红条提示补 return |
| `mvn clean` 报无法删除 `target` | VS Code Java 扩展占着目录，关掉扩展或手动删 `target` |
| 构建成功但启动找不到数据源 | 构建目录被占用会产生残缺包，重新构建即可 |
| 建库时中文变 `???` | 用 `mysql --default-character-set=utf8mb4`，或先 `chcp 65001` |
| 8080 被占用 | 改 `application.yml` 的 `server.port`，同步改 `api.js` 的 `API_BASE` |
| 改了数据库但页面一分钟没变 | 目的地列表缓存 TTL 60 秒，等一会儿或清 `youji:destinations:list` |
| Nginx 后 SSE 变成一次性返回 | 需要对 `/api/` 关闭 `proxy_buffering` |
| 上传大图后服务崩溃 | 解码必须降采样，不能直接 `ImageIO.read()` |
