# 游迹 · 旅游攻略与 AI 行程规划

一个前后端分离的旅游攻略站：按景点类型逛目的地、看逐日参考行程与景点攻略，并能调用大模型流式生成个性化行程，再结合高德地图的真实交通数据把行程"落到地上"。

前端是零构建的 Vue 3 单页应用，后端是 Spring Boot 3.5 服务——**双击一个 `.bat` 就能把 MySQL、Redis、后端和页面全部拉起来**。

> 在线仓库：<https://github.com/DDD123979/travelogue>
> 线上演示：<http://8.148.81.57> （阿里云轻量 2C2G；AI 与高德未配 Key 时，相关功能会提示"未配置"）

---

## 功能一览

| 模块 | 能做什么 |
|---|---|
| 登录 / 注册 | 用户名密码注册登录，JWT 令牌 + Redis 登录态，路由白名单守卫（未登录一律拦截） |
| 目的地 | 14 个目的地，按分类筛选 + 关键词搜索，详情页含推荐景点与参考价 |
| 景点分类 | 侧边栏按 自然生态 / 人文古迹 / 街区市集 / 观景夜景 浏览，每个类型可展开看目的地 |
| 参考行程 | 详情页用景点数据自动排 Day 1/2/3 时间轴 |
| 收藏 | 本地持久化收藏列表 |
| 设置 | 字号缩放（85%~130%）、封面图开关、动画开关、清空数据 |
| AI 行程 | 接入 DeepSeek，SSE 流式输出逐字返回的行程方案 |
| 高德交通 | 用真实驾车路线补齐行程里的交通耗时，带缓存与降级（拿不到数据也能出行程） |

**演示账号：`dou123` / `123456`**（首次启动由后端自动创建）

---

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vue 3.5.42（本地库，离线可用）、原生 CSS、hash 路由，无打包工具 |
| 后端 | Java 21、Spring Boot 3.5.16、MyBatis-Plus 3.5.17、Lombok、BCrypt |
| 数据库 | MySQL 8（14 目的地 / 42 景点 / 42 标签） |
| 缓存 | Redis 7.0.8：登录令牌、目的地列表、高德路线结果 |
| 外部服务 | DeepSeek Chat API（SSE 流式）、高德开放平台 Web 服务 API |
| 脚本 | Windows `.bat` + `.vbs` 隐藏窗口启动、`generate.js`（docx 生成需求文档） |

## 几个设计取舍

写这个项目时做的几个决定，以及为什么这么定：

| 决定 | 理由 | 代价 |
|---|---|---|
| 前端不用打包工具，直接 `<script>` 加载 | 双击 `index.html` 就能跑，答辩/演示不依赖网络和环境 | 没有组件单文件、没有热更新，`app.js` 只能一个文件写完 |
| 一套数据两套来源（mock / 后端） | 断网也能完整演示，不用先装 MySQL | 改数据要同步两处（`mock-data.js` 与 `data.sql`） |
| AI 用 SSE 流式而不是等 JSON 返回 | 行程要写十几秒，等完整结果体验太差；流式能边生成边读 | Nginx 必须关掉 `proxy_buffering`，后端要处理断连 |
| 高德只做"增强"而不是依赖 | 没有 Key 也能出行程，只是交通耗时不精确 | 多了一层降级逻辑和缓存策略 |
| 登录失败 5 次锁 15 分钟 | 密码只要求 6 位，站点又公开，不限流等于敞开撞库 | 正常的输错用户也会被短暂挡一下 |

---

## 项目结构

```
旅游/
├── travel-app/                 前端（双击 index.html 即可打开，无需构建）
│   ├── index.html              唯一入口页面
│   ├── css/style.css           全站样式（字号统一走 --fs 变量）
│   ├── js/mock-data.js         本地示例数据（仅 file:// 模式使用）
│   ├── js/api.js               唯一数据出口：mock 数据 / 后端请求都在这里切换
│   ├── js/app.js               Vue 组件与路由
│   └── lib/vue.global.prod.js  Vue 3 本地运行库
│
├── travel-server/              后端（Spring Boot 3.5）
│   ├── src/main/java/com/youji/travel/
│   │   ├── controller/         REST 接口
│   │   ├── service/            业务逻辑（AI 行程、高德接地、目的地、鉴权）
│   │   ├── mapper/             MyBatis-Plus Mapper
│   │   ├── entity/ dto/ config/ common/
│   │   └── TravelApplication.java
│   ├── src/main/resources/application.yml   端口、数据源、AI 与高德配置
│   ├── sql/schema.sql          建表脚本
│   ├── sql/data.sql            示例数据
│   └── redis/                  本地 Redis 免安装包（不入库，克隆后需自备）
│
├── logs/                       运行日志（不入库）
├── generate.js                 生成《需求文档》docx 的脚本
└── 旅游软件需求文档.docx        需求规格说明
```

> 根目录的 `启动游迹.vbs` / 停止脚本只在作者本机保留，不纳入仓库——线上用 systemd，见 [部署说明](deploy/README.md)。

---

## 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|---|---|---|
| JDK | 21 | 后端使用 Java 21 语法 |
| Maven | 3.9+ | 构建后端，首次会下载依赖 |
| MySQL | 8.0 | 端口 3306，默认账号 `root` / `123456` |
| Redis | 7.x | 端口 6379；仓库不含二进制，可用 `travel-server/redis/` 自行放置或本机安装 |
| Node.js | 18+ | **可选**，只有重新生成需求文档时才需要 |

### 1. 建库并导入示例数据

```bash
cd travel-server
mysql -uroot -p123456 --default-character-set=utf8mb4 < sql/schema.sql
mysql -uroot -p123456 --default-character-set=utf8mb4 < sql/data.sql
```

`schema.sql` 自带 `DROP TABLE`，重复执行会清空数据（演示账号由后端启动时自动重建）。

### 2. 配置密钥（可选，不配也能跑）

AI 与高德都是增强能力，缺了不影响浏览主流程：

```powershell
setx DEEPSEEK_API_KEY "sk-你的key"     # AI 行程生成
setx AMAP_API_KEY "你的高德key"        # 真实交通耗时（需 Web 服务类型 Key）
```

`setx` 只影响新开的终端，设置后请重开窗口并重启后端。

### 3. 启动

**方式一：Maven 直接跑（推荐）**

```bash
# 终端 1：Redis（本机已装 redis-server 的话直接用系统服务即可）
travel-server\redis\start-redis.bat

# 终端 2：后端，同时托管前端页面
cd travel-server
mvn spring-boot:run
```

**方式二：打包成 jar 再跑**

```bash
cd travel-server
mvn -DskipTests package
java -jar target\travel-server-1.0.0.jar
```

看到 `Started TravelApplication` 后访问 <http://localhost:8080>，停止按 `Ctrl+C`。

> 后端把前端也托管了（`spring.web.resources.static-locations`），所以只有一个 8080 端口，不存在跨域问题。

### 4. 只跑前端（离线演示）

直接双击 `travel-app/index.html` 即可。`file://` 协议下前端自动改用内置示例数据，不连后端，断网也能演示；此时下单记录存在 localStorage。

---

## 配置项

| 配置 | 位置 | 默认值 |
|---|---|---|
| 服务端口 | `application.yml` → `server.port` | `8080` |
| 数据库 | `application.yml` → `spring.datasource` | `jdbc:mysql://localhost:3306/travel_db`，`root` / `123456` |
| Redis | `application.yml` → `spring.data.redis` | `localhost:6379`，db 0 |
| AI 模型 | `application.yml` → `youji.ai` | `deepseek-flash`，Key 取自 `DEEPSEEK_API_KEY` |
| 高德 | `application.yml` → `youji.amap` | Key 取自 `AMAP_API_KEY`，并发固定为 1、缓存 7 天 |
| 前端数据源 | `travel-app/js/api.js` 顶部 | `file://` 走 mock，`http://` 走后端 |

改数据库密码只需改 `application.yml`；**不要**把真实密钥写进该文件——它会被提交到仓库。

---

## 接口概览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/destinations`、`/api/destinations/{id}` | 目的地列表 / 详情（走 Redis 缓存） |
| POST | `/api/auth/register`、`/api/auth/login`、`/api/auth/logout` | 注册 / 登录 / 退出 |
| GET | `/api/auth/me` | 当前登录用户 |
| POST | `/api/ai/itinerary` | AI 生成行程（SSE 流式） |
| GET | `/api/ai/status` | AI 配置自检 |
| GET | `/api/amap/status`、`POST /api/amap/warmup` | 高德自检 / 预热路线缓存 |

完整请求体、状态码与自测命令见 [travel-server/README.md](travel-server/README.md)。

---

## 常见问题

**页面一直转圈 / 提示"请求失败"**
确认三件事：Redis 起了没、后端 8080 是否在监听、页面是不是用 `http://localhost:8080` 而不是 `file://` 打开的。

**8080 端口被占用**
找到占用的进程并结束（只杀监听 8080 的那个，不会误伤其他 Java 程序）：

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

仍被占用就改 `application.yml` 里的 `server.port`。

**AI 生成报错**
访问 <http://localhost:8080/api/ai/status> 自查：Key 是否配好、模型名是否还能用（模型名会过期）。

**高德接口返回 10002**
Key 的服务平台选成了"Web端(JS API)"，必须重新申请"**Web服务**"类型的 Key。

**首次构建很慢**
在 `~/.m2/settings.xml` 配置阿里云镜像即可显著加速。

---

## 相关文档

- [前端说明](travel-app/README.md)：页面路由、接口约定、样式与适配规则
- [后端说明](travel-server/README.md)：接口清单、Redis 用法、AI 与高德实现细节
- [部署说明](deploy/README.md)：阿里云轻量服务器上线流程（systemd + Nginx + HTTPS）
- [需求规格说明](旅游软件需求文档.docx)：功能与非功能需求

---

## 说明

本项目为个人学习 / 课程实践作品，暂未指定开源许可证。欢迎提 Issue 交流；如需商用或转载，请先联系作者。
