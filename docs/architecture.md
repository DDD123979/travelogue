# 游迹 · 架构说明

> 系统架构与关键设计的**唯一详细说明**。开发规范见 [开发说明](development.md)，接口见 [接口说明](api.md)，上线见 [部署说明](../deploy/README.md)。

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
   ├─ Controller  参数接收、鉴权（requireUser）
   ├─ Service     业务规则、缓存、外部调用
   ├─ Mapper      MyBatis-Plus（无 XML）
   └─ 外部         DeepSeek（SSE）、高德（HTTP）
         │
         ├── MySQL 8  业务数据（唯一事实来源）
         └── Redis 7  会话、限流、验证码、缓存
```

单进程同时托管页面与接口：同源部署、无跨域、只暴露一个后端端口。

## 2. 分层职责

| 层 | 职责 | 约定 |
|---|---|---|
| Controller | 路由、鉴权、参数接收 | 写接口必须 `requireUser()`；读接口可匿名 |
| Service | 业务规则、事务、缓存编排 | 外部服务失败必须降级，不能抛给用户 |
| Mapper | 单表 CRUD + Lambda 条件 | 不写 XML；复杂查询用 `in` + 内存拼装避免 N+1 |
| DTO | 对外契约 | 与实体分离，字段名与前端一致 |
| 全局异常 | 统一错误出口 | 真实状态码 + `{"message": "中文提示"}` |

## 3. 认证与登录态

```
注册/登录 → BCrypt 校验 → 签发 UUID token（32 位）
                │
                ├─ Redis: youji:token:<token> = username，TTL 2h
                └─ 前端 localStorage: { username, token, nickname, avatar, userNo }
                        │
后续请求：Authorization: Bearer <token>
                        │
Service 侧 resolveUsername() → 命中则放行，否则 401
```

| 设计点 | 说明 |
|---|---|
| 令牌形态 | **不透明 UUID**，不是自包含令牌；服务端是唯一真相 |
| 可吊销 | 退出登录 / 改密码后直接删 Redis key，旧会话立即失效 |
| 过期 | TTL 2 小时，Redis 自动清理，无需定时任务 |
| 密码存储 | BCrypt（随机盐、cost 10），不可逆 |
| 登录限流 | 同一用户名连续失败 5 次锁定 15 分钟（`youji:login:fail:<user>`，首次失败开始计时） |
| 找回密码 | 6 位验证码存 Redis（5 分钟、一次性），校验通过立即删除 |
| 错误口径 | 登录失败统一返回「用户名或密码错误」，不暴露账号是否存在 |

**为什么不用 JWT**：需要"改密码 / 退出登录后旧会话立刻失效"。无状态令牌做不到，除非再加黑名单（等于又依赖 Redis）。项目本就依赖 Redis 做限流与缓存，用不透明 token 不增加组件，还换来吊销能力。

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

建表时几个刻意为之、**不要改回去**的点：

| 决策 | 原因 |
|---|---|
| 表名 `t_user` | `user` 是 MySQL 保留字 |
| 列名 `attr_desc` | `desc` 是保留字；实体字段叫 `attrDesc`，对外 JSON 仍是 `desc` |
| `days` / `best_season` 用 VARCHAR | 展示的是「3-4 天」「3-5 月 / 9-11 月」，INT 会丢失语义 |
| `rating` 用 DECIMAL(2,1) | float 会序列化成 `4.800000190734863` |
| 嵌套 JSON 用「3 次批量查询 + 内存分组」 | 避免 N+1，也不踩 JOIN 笛卡尔积 |
| 点赞 / 收藏加唯一索引 | 并发下防重复，接口做成 toggle |

通知不单独建已读表：自增主键即游标，前端记录 `afterId` 轮询增量。

## 5. 缓存策略

| Key | 内容 | TTL | 失效方式 |
|---|---|---|---|
| `youji:token:<token>` | 用户名 | 2h | 退出 / 改密时删除 |
| `youji:login:fail:<user>` | 失败次数 | 15m | 登录成功清零 |
| `youji:reset:<user>` | 重置验证码 | 5m | 使用后立即删除 |
| `youji:destinations:list` | 目的地列表 JSON | 60s | 自然过期 / 发版后手动清 |
| `youji:amap:ground:v1:<maxPoints>:<id>` | 接地数据 | 7d（降级 30m） | 自然过期 |

- 值为 JSON 字符串（`StringRedisTemplate` + Jackson），`redis-cli` 里可直接读；
- 高德 key 里带 `maxPoints` 与 `v1`：改配置或改接地逻辑等于换钥匙，旧缓存自然失效，不用手动清；
- **降级原则**：会话类强依赖 Redis（失败返回 503 并提示）；缓存类弱依赖（try/catch 后直接查库）。

## 6. 外部服务一：DeepSeek（行程生成）

- 走 OpenAI 兼容的 `POST /chat/completions`，用 JDK 自带 `HttpClient`，**不引入额外 Maven 依赖**；
- 换模型只需改 `youji.ai.base-url` / `youji.ai.model`，代码不动；
- Key 只从环境变量读取，服务端持有，**不下发前端**。

**为什么流式**：一篇行程要生成十几到几十秒，一次性返回只能看转圈。后端边生成边推，前端逐字渲染。

| SSE 事件 | 数据 | 说明 |
|---|---|---|
| `status` | `{"text":"正在思考行程安排…"}` | 仅提示，不拼进正文 |
| `delta` | `{"text":"..."}` | 正文增量，按顺序拼接 |
| `done` | `{"length":3910}` | 正常结束 |
| `error` | `{"message":"中文提示"}` | 出错，前端直接展示 |

> 模型名会过期（`deepseek-chat` / `deepseek-reasoner` 已下线）。`GET /api/ai/status` 会返回 `availableModels` 与 `modelUsable`，据此更新配置即可。

## 7. 外部服务二：高德（交通接地）

**为什么接**：最初的提示词自相矛盾——要求写「地铁几号线 / 打车多久」又要求「绝不编造」。模型不可能知道两点间距离，没数据只能编。接入后：景点从高德 POI 选（真实存在），交通数字从路径规划取（真实可达），**高德提供事实、模型负责组织成文**。

**调用量**：每城取 `max-points` 个地点两两配对（A→B 与 B→A 合并为一次）。

| max-points | 对数/城市 | 23 城预热一次 |
|---|---|---|
| 8 | 28 | 644 |
| **10（默认）** | **45** | **1035** |
| 12 | 66 | 1518 |

个人 Key 每天约 5000 次驾车规划，冷启动一次就要 45 次——**缓存不是优化，是配额闸门**。

**并发必须为 1**（实测 45 对路线）：

| max-concurrency | 拿到路线 | 撞 10021 限流 | 耗时 |
|---|---|---|---|
| 4 | 43/45 | 31 次 | 16.8s |
| 2 | 43/45 | 29 次 | 18.2s |
| **1** | **45/45** | **12 次** | **19.2s** |

调大并发既拿不到更多数据，又多烧配额（31 次重试 vs 12 次），还可能触发 10004 封停。

**高德永远返回 HTTP 200**，成功与否看响应体 `status` + `infocode`：

| infocode | 含义 | 处理 |
|---|---|---|
| 10001 | Key 无效 / 过期 | 熔断 5 分钟 |
| 10003 / 10044 | 日配额用尽 | 熔断 30 分钟 |
| 10004 | 访问过频（封停一分钟） | 不重试，熔断 62 秒 |
| 10015 / 10020 / 10021 | QPS 超限 | 退避重试（800ms、2000ms） |
| 20011 / 20800–20803 | 无可行车路线 | 正常业务结果，跳过该对 |

**熔断是批量中止**而非逐个重试：无效 Key 只会发出 1 个请求就被短路。

**降级**：没配 Key、超时、报错、配额用尽 → 返回空串，行程照常生成，提示词同步放宽（`systemPrompt(boolean grounded)`）。降级结果只缓存 30 分钟，避免配好 Key 后被空缓存卡一周。

**已知局限**：补充景点用 `keywords=景点` 搜索，高德对该宽泛词会稳定返回同一簇城市公园（成都实测为交子公园、桂溪生态公园等，武侯祠不会出现）。现状是**数据库里的景点做主骨干，高德 POI 只做补充**。

## 8. 图片处理

```
上传（≤25MB，jpg/png/webp）
  → 读尺寸 → 按长边 2400 降采样解码（避免 OOM）
  → 缩放到 1600px、JPEG q0.82 落盘
  → 同时生成 480px 缩略图 xxx_thumb.jpg
  → 返回 /uploads/xxx.jpg
```

列表用缩略图、点开看原图；文件名是 UUID，Nginx 对 `/uploads/` 设 30 天缓存。降采样是必需的：12000px 原图直接解码约需 300MB 内存，1.6G 的机器会 OOM。

## 9. 部署拓扑

```
Ubuntu 24.04（1.6G 内存）
├─ Nginx 1.24        :80      静态直发 + 反代
├─ youji.service     :8080    仅 127.0.0.1；JVM 堆 512MB；Restart=always
├─ MySQL 8           仅 127.0.0.1
├─ Redis 7           仅 127.0.0.1
└─ 每日 03:00 备份    保留 7 天
```

配置通过 systemd `EnvironmentFile` 注入；仓库只保留 `.env.example`。

## 10. 关键取舍

| 决策 | 理由 | 代价 |
|---|---|---|
| 前端零构建 | 双击即可跑，部署零依赖 | 无 SFC / 热更新，组件写在单个 JS |
| 后端托管前端 | 同源、免跨域、单端口 | 静态文件也走 JVM（已改 Nginx 直发缓解） |
| Redis 会话令牌 | 可主动吊销、改密即失效 | 依赖 Redis 可用性 |
| 未引入消息队列 | 通知量小，轮询足够 | 通知最多延迟约 12 秒 |
| 高德只做增强 | 没 Key 也能出行程 | 多一层降级与缓存策略 |
| AI 直连 HTTP，不用 SDK | 少一个依赖，换模型只改配置 | 自行解析 SSE、自行处理错误码 |
