# 游迹 · 开发说明

> README 只展示一级与必要二级目录；本文件放**详细目录说明与开发约定**。
> 各子项目的实现细节见 [前端说明](../travel-app/README.md)、[后端说明](../travel-server/README.md)。

## 1. 完整目录

```
travel-app/                     前端（零构建 Vue 3）
├── index.html                  唯一入口；按顺序加载 css/ 与 js/
├── css/style.css               全站样式（字号统一走 --fs 变量）
├── js/
│   ├── api.js                  唯一数据出口：真实请求与 mock 的切换点
│   ├── state.js                全局 store、hash 路由、路由守卫
│   ├── app.js                  根组件：顶栏、用户菜单、通知与图片查看器
│   ├── mock-data.js            离线示例数据（仅 file:// 模式使用）
│   ├── components/card.js      目的地卡片
│   ├── lib/markdown.js         AI 输出的轻量 Markdown 渲染
│   └── pages/                  页面组件：home / list / detail / ranking /
│                               community / profile / favorites / settings /
│                               login / ai
├── lib/vue.global.prod.js      Vue 3 运行时（本地库，离线可用）
└── img/                        封面图与 logo

travel-server/                  后端（Spring Boot 3.5）
├── src/main/java/com/youji/travel/
│   ├── controller/             REST 接口（参数接收、鉴权、返回 DTO）
│   ├── service/                业务逻辑、缓存、外部调用（AI / 高德）
│   ├── mapper/                 MyBatis-Plus Mapper（无 XML）
│   ├── entity/                 数据库实体
│   ├── dto/                    对外契约（与实体分离）
│   ├── config/                 CORS、静态资源、上传目录、演示数据初始化
│   └── common/                 统一异常与错误响应
├── src/main/resources/
│   └── application.yml         端口、数据源、Redis、AI 与高德配置
├── sql/schema.sql              建表脚本
├── sql/data.sql                种子数据（目的地 / 标签 / 景点）
└── .env.example                环境变量模板（不含真实值）

deploy/                         部署
├── nginx-youji.conf            Nginx 站点配置（静态直发 + 反代）
├── youji.service               systemd 单元
├── deploy.sh                   服务器更新脚本
├── backup.sh                   每日备份脚本
└── migrations/                 增量 SQL 迁移（001 ~ 016，按序号执行）

docs/                           需求、架构与开发文档
```

## 2. 前端开发约定

**新增一个页面**

1. 在 `js/pages/` 新建组件对象（`{ setup(), template }`）；
2. 在 `index.html` 中按依赖顺序加 `<script>`（必须在 `app.js` 之前）；
3. 在 `app.js` 的 `view` / `navActive` 里加路由分支，并在 `components` 中注册；
4. 样式追加到 `css/style.css` 末尾。

**三个必须遵守的约定**

- **脚本顺序即依赖**：`vue → mock-data → api → state → 组件 → app`，调换会 `undefined`。
- **模板只能用 setup 返回的东西**：漏返回会在运行时白屏（不是编译错误）。
- **所有网络请求走 `api.js`**：不要在页面里直接 `fetch`，否则 mock 模式失效。

## 3. 后端开发约定

**新增一个接口**

```
Controller（路由 + requireUser 鉴权）
   → Service（业务规则、缓存、外部调用）
      → Mapper（Lambda 条件，不写 XML）
         → Entity
   ← DTO（与实体分离，字段名对齐前端）
```

**错误契约**：任何失败都返回**真实 HTTP 状态码** + `{"message": "中文提示"}`。禁止用 200 包错误，前端只看 `res.ok`。

**鉴权**：写接口必须显式调用 `requireUser(authorization)`；项目没有 Spring Security 过滤器链，漏写即接口裸奔。

**降级**：外部服务（AI / 高德）失败不能抛给用户，要返回可用的兜底结果。

## 4. 数据库变更约定

1. 改表结构或加数据：在 `deploy/migrations/` 新建 `0NN_描述.sql`（序号递增）；
2. 同步更新 `sql/schema.sql` 与 `sql/data.sql`，保证新环境一次建好；
3. 迁移脚本要可重复执行或带存在性判断（如 `CREATE TABLE IF NOT EXISTS`）；
4. 执行顺序：`mysql <数据库> < deploy/migrations/0NN_xxx.sql`。

## 5. 配置与密钥

- 真实值只写在 `.env`（已被 `.gitignore` 忽略），模板见 `travel-server/.env.example`；
- `DB_USERNAME` / `DB_PASSWORD` **没有默认值**，缺失时启动失败；
- AI 与高德 Key 只在服务端使用，**不要下发到前端**。

## 6. 本地自检

```bash
# 后端编译
cd travel-server && mvn -DskipTests package

# 前端语法（Node 仅用于检查，不参与运行）
node --check travel-app/js/app.js
```

改动后建议手动过一遍：首页 → 目的地 → 详情 → 排行 → 社区 → AI，确认无白屏。

## 7. 已知的坑

| 现象 | 原因 |
|---|---|
| 改完代码刷新还是旧的 | 浏览器缓存；静态资源已用 `?v=` 与 `no-cache`，部署时记得更新版本号 |
| Nginx 后 SSE 变成一次性返回 | 需要对 `/api/` 关闭 `proxy_buffering` |
| 上传大图后服务崩溃 | 图片解码需降采样，勿直接 `ImageIO.read()` |
| 页面白屏且顶部红条 | 模板用了 setup 未返回的变量，看红条里的报错信息 |
