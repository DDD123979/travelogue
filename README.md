# 游迹 · 旅游攻略与 AI 行程规划

一个前后端分离的旅游攻略站：按景点类型浏览目的地、查看逐日参考行程，并能调用大模型**流式生成**个性化行程，再用高德地图的真实驾车数据把行程"落到地上"。

前端是零构建的 Vue 3 单页应用，后端是 Spring Boot 3.5 服务，**一个进程同时托管页面与接口**，部署只需 Nginx + systemd。

## 核心功能

| 模块 | 能力 |
|---|---|
| 目的地攻略 | 23 个目的地 / 115 个景点，分类筛选 + 关键词搜索，含「必去」景点详解 |
| 类型浏览 | 侧边栏按 自然生态 / 人文古迹 / 街区市集 / 观景夜景 聚合，可展开看城市 |
| 热度排行 | 目的地榜与景点榜，支持切换动画 |
| 参考行程 | 详情页按景点自动排逐日行程（每天 2 个去处，标注上午 / 下午 / 晚上） |
| 小迹 AI 智能导游 | 接入 DeepSeek，按城市与天数**流式**生成行程，交通耗时用高德实时核对 |
| 社区 | 发布图文分享、按城市筛选、点赞 / 收藏 / 评论、互动通知、图片左右滑动查看 |
| 账号 | 注册登录、头像上传、独立昵称、修改密码、忘记密码（验证码重设） |
| 个人主页 | 我的发布与统计（发布数 / 获赞 / 收到评论 / 被收藏） |
| 本地功能 | 目的地收藏、字号缩放、封面图开关、动画开关 |

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vue 3.5（本地运行库，无打包工具）、原生 CSS、自实现 hash 路由 |
| 后端 | Java 21、Spring Boot 3.5.16、MyBatis-Plus 3.5.17、Lombok、BCrypt |
| 数据库 | MySQL 8（9 张表：内容 4 张 + 用户与社区 5 张） |
| 缓存 / 会话 | Redis 7：登录令牌、登录限流、重置验证码、两级缓存 |
| 外部服务 | DeepSeek Chat API（SSE 流式）、高德开放平台 Web 服务 API |
| 部署 | Nginx 反向代理 + systemd，Ubuntu 24.04 |

## 系统架构

```
浏览器（Vue 3 单页应用）
   │ HTTP
   ▼
Nginx :80 ── 静态资源直发（/img /css /js /uploads）
   │ 其余反代
   ▼
Spring Boot :8080 ── REST / SSE / multipart 上传
   ├── MySQL 8      业务数据
   ├── Redis 7      会话 / 限流 / 缓存
   ├── DeepSeek    流式生成行程
   └── 高德 API     驾车耗时（缓存 + 降级）
```

分层设计、认证机制、缓存与外部服务细节见 [架构说明](docs/architecture.md)。

## 技术亮点

- **零构建前端 + 同源部署**：页面是一组静态文件，`<script>` 直接加载，改完刷新即生效；后端同时托管前端，天然无跨域。
- **Redis 不透明令牌**：登录态是 UUID token → 用户名（TTL 2 小时）。选它的根本原因是**服务端可随时吊销**——退出登录、改密码后旧会话立即失效。
- **AI 流式 + 高德接地，且可降级**：行程逐字返回，生成后补真实交通耗时；高德不可用时用估算值继续输出，**绝不阻断出行程**。
- **图片上传全链路压缩**：手机原图最大 25MB，落盘前压到长边 1600px 并生成缩略图；解码采用降采样，避免大图撑爆 1.6G 内存。

## 项目结构

```
travel-app/                 前端（零构建 Vue 3 单页应用）
├── css/                    全站样式
├── js/                     页面组件、路由与数据访问
├── lib/                    Vue 运行时（本地库）
└── img/                    封面与图标

travel-server/              后端（Spring Boot）
├── src/main/java/          接口、业务与数据访问
├── src/main/resources/     配置（application.yml）
└── sql/                    建表与种子数据

deploy/                     部署配置与脚本（Nginx、systemd、迁移、备份）
docs/                       需求、架构、开发与接口文档
```

各目录的详细说明与开发约定见 [开发说明](docs/development.md)。

## 项目截图

> 待补充：首页、社区、小迹 AI 三个页面的截图（放在 `docs/images/` 后在此引用）。

## 快速开始

环境：JDK 21、Maven 3.9+、MySQL 8、Redis 7。

```bash
# 1. 初始化数据库
cd travel-server
mysql -u<user> -p --default-character-set=utf8mb4 < sql/schema.sql
mysql -u<user> -p --default-character-set=utf8mb4 < sql/data.sql

# 2. 配置（数据库账号与密码都必填，无默认值）
cp .env.example .env      # 填写 DB_USERNAME / DB_PASSWORD
set -a; source .env; set +a

# 3. 启动（后端同时托管前端）
mvn spring-boot:run
```

打开 <http://localhost:8080> 即为完整应用。AI 与高德可选配 Key（`DEEPSEEK_API_KEY` / `AMAP_API_KEY`），不配不影响浏览。完整环境变量与常见问题见 [开发说明](docs/development.md)。

> `file://` 直接打开 `travel-app/index.html` 会进入离线模式，使用内置示例数据，无需数据库。

## 已知限制

| 限制 | 说明 |
|---|---|
| 未启用 HTTPS | 线上仅 HTTP，会话凭据为明文传输；需域名与证书后才能开启 |
| 单机部署 | 一台服务器承载应用 + 数据库，无冗余；依赖每日备份与 systemd 自动重启 |
| 演示账号口令固定 | 初始化代码中固定，计划改为环境变量 / 随机口令 |
| 无内容审核 | UGC 目前依赖人工，审核能力在计划中 |

## 文档

- [需求说明](docs/requirements.md)：功能范围、业务规则、已实现 / 计划功能
- [架构说明](docs/architecture.md)：分层、认证、数据模型、缓存、外部服务集成
- [开发说明](docs/development.md)：目录结构、前后端规范、数据库变更、排错
- [接口说明](docs/api.md)：接口清单、鉴权、错误码与典型请求
- [前端说明](travel-app/README.md) / [后端说明](travel-server/README.md)：各自的启动与使用
- [部署说明](deploy/README.md)：Nginx + systemd 上线流程、备份与排错

## 说明

个人学习与课程实践作品，未指定开源许可证。欢迎提 Issue 交流；商用或转载请先联系作者。
