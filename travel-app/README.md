# 游迹 · 前端说明

纯静态的 Vue 3 单页应用，**零构建**：双击 `index.html` 即可打开，不需要 Node 或打包工具。

- 技术栈：Vue 3.5（本地运行库）、原生 CSS（`--fs` 变量统一缩放字号）、自实现 hash 路由
- 开发规范（脚本顺序、CSS 约定、新增页面）见 [开发说明](../docs/development.md)
- 接口契约见 [接口说明](../docs/api.md)

## 启动方式

| 方式 | 命令 | 说明 |
|---|---|---|
| 离线演示 | 双击 `travel-app/index.html` | `file://` 下使用内置示例数据，不连后端 |
| 推荐 | `cd travel-server && mvn spring-boot:run` | 后端同时托管页面，访问 <http://localhost:8080> |
| 独立静态服务 | `cd travel-app && python -m http.server 5173` | 页面在 5173，接口自动指向 `localhost:8080` |

## 页面与路由

| 页面 | 路由 | 登录 | 主要功能 |
|---|---|---|---|
| 登录 / 注册 | `#/login` | 否 | 登录注册切换（`?mode=register` 直达注册） |
| 首页 | `#/` | 是 | 搜索、热门目的地、按类型浏览 |
| 目的地列表 | `#/destinations` | 是 | 分类筛选 + 关键词搜索（`?q=` `?cat=`） |
| 目的地详情 | `#/destinations/:id` | 是 | 封面大图、介绍、逐日参考行程、必去景点 |
| 热度排行 | `#/ranking` | 是 | 目的地榜 / 景点榜 |
| 社区 | `#/community` | 是 | 发布、筛选、点赞收藏评论、互动通知 |
| 我的主页 | `#/profile` | 是 | 我的发布与统计 |
| 小迹 AI 智能导游 | `#/ai` | 是 | 流式生成行程，可带 `?dest=ID` 预选目的地 |
| 我的收藏 | `#/favorites` | 是 | 本地收藏列表 |
| 设置 | `#/settings` | 是 | 字号、封面图、动画、账号 |

路由守卫是**白名单**式：只放行 `login`，其余页面一律要求登录。

## 运行模式

`js/api.js` 按打开方式自动切换，不需要改代码：

| 打开方式 | 数据来源 |
|---|---|
| `file://`（双击） | 内置示例数据（`mock-data.js`），断网可演示 |
| `http://localhost:8080` | 后端接口 + MySQL |
| 其他静态端口（5173 等） | 跨域调用 `http://localhost:8080` |

强制指定时可改 `api.js` 顶部两个常量：`USE_MOCK` 与 `API_BASE`。

> `mock-data.js` 与 `travel-server/sql/data.sql` 是同一批数据，改一处要同步另一处。

## 开发入口

- 页面组件：`js/pages/`，一页一文件
- 数据出口：`js/api.js`（全站唯一，页面不直接 `fetch`）
- 全局状态与路由：`js/state.js`
- 根组件与导航：`js/app.js`
