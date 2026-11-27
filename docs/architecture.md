# 游迹 · 架构说明

> 本文说明系统的分层、关键链路与设计取舍；接口清单见 [后端说明](../travel-server/README.md)，页面对接见 [前端说明](../travel-app/README.md)。

## 1. 总体结构

```
浏览器（Vue 3，无打包）
   │ HTTP / SSE / multipart
   ▼
Nginx :80
   ├─ /img /css /js /uploads  → 直接读磁盘（长缓存）
   └─ 其余                     → 反代 127.0.0.1:8080
         ▼
   Spring Boot :8080
   ├─ Controller  参数校验、鉴权（requireUser）
   ├─ Service     业务规则、缓存、外部调用
   ├─ Mapper      MyBatis-Plus（无 XML）
   └─ 外部         DeepSeek（SSE）、高德（HTTP）
         │
         ├── MySQL 8  业务数据（唯一事实来源）
         └── Redis 7  会话、限流、验证码、缓存
```

**部署特点**：单进程同时托管页面与接口，同源部署，省掉跨域与独立静态服务器。前端改动只需 `git pull`，后端改动才需要重新打包与重启。

## 2. 分层职责

| 层 | 职责 | 约定 |
|---|---|---|
| Controller | 路由、鉴权、参数接收 | 写接口必须 `requireUser()`；读接口可匿名 |
| Service | 业务规则、事务、缓存编排 | 外部服务失败必须降级而不是抛出 |
| Mapper | 单表 CRUD + Lambda 条件 | 不写 XML；复杂查询用 `in` + 内存拼装避免 N+1 |
| DTO | 对外契约 | 与实体分离，字段名与前端一致 |
| 全局异常 | 统一错误出口 | 真实状态码 + `{"message": "中文提示"}` |

## 3. 认证设计

```
注册/登录 → BCrypt 校验 → 签发 UUID token
                │
                ├─ Redis: youji:token:<token> = username，TTL 2h
                └─ 前端 localStorage: { username, token, nickname, avatar, userNo }
                        │
后续请求：Authorization: Bearer <token>
                        │
Service 侧 resolveUsername() → 命中则放行，否则 401
```

**为什么不用 JWT**：需要"改密码 / 退出登录后旧会话立刻失效"，JWT 无状态特性做不到，除非再加黑名单（那就又依赖 Redis）。项目本身就依赖 Redis 做限流与缓存，用不透明 token 不增加组件，还换来可吊销能力。

**已知取舍**：没有 Spring Security 过滤器链，鉴权由各 Controller 显式调用；漏写一处即接口裸奔。规模化后应改为拦截器 + 注解。

## 4. 数据模型

```
t_user ──┬── travel_post ──┬── post_comment
         │                 ├── post_like      （唯一键：post_id + username）
         │                 ├── post_favorite  （唯一键：post_id + username）
         │                 └── post_event     （互动通知，主键即轮询游标）
         │
destination ─┬── destination_tag
             └── destination_attraction
```

- 内容表（目的地 / 标签 / 景点）读多写少，列表整体缓存 60 秒；
- 互动表用**唯一索引**兜底"一人一赞/一藏"，接口是 toggle 语义；
- 通知不单独建已读表，用自增主键作为游标，前端记录 `afterId`。

## 5. 外部服务集成

| 服务 | 调用方式 | 失败处理 |
|---|---|---|
| DeepSeek | JDK HttpClient，`Authorization: Bearer`，解析 SSE `data:` 行 | 返回明确错误；SSE 中途断开发 `error` 事件 |
| 高德 | JDK HttpClient，GET（Key 在参数中） | 单次预算 8 秒；失败/超时用估算值；"Key 无效"类错误熔断 5 分钟 |

**AI 链路**：用户请求 → 取目的地与景点 → 取高德接地数据（优先缓存）→ 组装提示词 → 流式转发给前端 → 前端边收边渲染 Markdown。

## 6. 缓存策略

| Key | 内容 | TTL | 失效方式 |
|---|---|---|---|
| `youji:token:<token>` | 用户名 | 2h | 退出登录 / 改密后删除 |
| `youji:login:fail:<user>` | 失败次数 | 15m | 登录成功清零 |
| `youji:reset:<user>` | 重置验证码 | 5m | 使用后立即删除 |
| `youji:destinations:list` | 目的地列表 JSON | 60s | 自然过期 / 发版后手动清 |
| `youji:amap:*` | 接地数据 | 7d（降级 30m） | 自然过期 |

**降级原则**：会话类强依赖 Redis（失败返回 503 并提示）；缓存类弱依赖（失败直接查库）。

## 7. 图片处理

```
上传（≤25MB，jpg/png/webp）
  → 读尺寸 → 按长边 2400 降采样解码（避免 OOM）
  → 缩放到 1600px、JPEG q0.82 落盘
  → 同时生成 480px 缩略图 xxx_thumb.jpg
  → 返回 /uploads/xxx.jpg
```

列表使用缩略图，点开查看原图；Nginx 对 `/uploads/` 设 30 天缓存（文件名是 UUID，内容不会变）。

## 8. 部署拓扑

```
阿里云 Ubuntu 24.04（1.6G 内存）
├─ Nginx 1.24        :80      静态 + 反代
├─ youji.service     :8080    JVM 堆 512MB，Restart=always
├─ MySQL 8           仅 127.0.0.1（不对外）
├─ Redis 7           仅 127.0.0.1（不对外）
└─ 每日 03:00 备份    /var/backups/youji（保留 7 天）
```

配置通过 systemd `EnvironmentFile` 注入（数据库密码、AI Key），仓库中不保存真实值。

## 9. 关键取舍

| 决策 | 理由 | 代价 |
|---|---|---|
| 前端零构建 | 双击即可跑，部署零依赖 | 无 SFC、无 HMR，组件写在单个 JS |
| 后端托管前端 | 同源、免跨域、单端口 | 静态文件也走 JVM（已改为 Nginx 直发缓解） |
| Redis token | 可吊销、可失效 | 依赖 Redis 可用性 |
| 未引入消息队列 | 通知量小，轮询足够 | 通知有 ≤12s 延迟 |
| 手写 SQL 迁移 | 单人项目，避免 Flyway 复杂度 | 需人工按序号执行 |
