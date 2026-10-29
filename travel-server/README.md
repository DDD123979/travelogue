# 游迹 · 后端服务（travel-server）

配合前端 `../travel-app` 使用。

**技术栈**：Java 21 · Spring Boot 3.5 · MySQL 8 · MyBatis-Plus 3.5 · Redis 7

---

## 一、启动：双击一个文件就行

在项目根目录（`旅游\`）双击 **`启动游迹.bat`**，它会自动：

1. 启动 Redis（已经在跑就跳过）
2. 启动后端（已经在跑就跳过，jar 不存在的话会先自动构建）
3. 等后端就绪后，自动打开浏览器到 **http://localhost:8080**

演示账号 **dou123 / 123456**。停止服务双击 **`停止游迹.bat`**。

> **后端顺便把前端页面也托管了**（`application.yml` 里配了 `spring.web.resources.static-locations`），
> 所以不用再开 python 静态服务、也不会遇到跨域问题 —— 一个 8080 端口就是整个应用。

重复双击也安全：已经跑着的服务会被识别出来跳过，只会再打开一次浏览器。

### 手动启动（想分开看日志时）

```bash
# 1) Redis
travel-server\redis\start-redis.bat          # 双击

# 2) 后端（同时托管前端页面）
cd travel-server
java -jar target\travel-server-1.0.0.jar     # 或 mvn spring-boot:run

# 3) 浏览器打开 http://localhost:8080
```

看到 `Started TravelApplication` 就成功了。**首次启动会自动创建演示账号 `dou123 / 123456`**，
也可以在前端页面上自己注册。

### 建库 + 灌数据（新环境只需要做一次）

```bash
cd travel-server
mysql -uroot -p123456 --default-character-set=utf8mb4 < sql/schema.sql
mysql -uroot -p123456 --default-character-set=utf8mb4 < sql/data.sql
```

执行完可以自查一下：

```sql
SELECT COUNT(*) FROM travel_db.destination;             -- 应为 14
SELECT COUNT(*) FROM travel_db.destination_tag;         -- 应为 42
SELECT COUNT(*) FROM travel_db.destination_attraction;  -- 应为 42
SELECT COUNT(*) FROM travel_db.hotel;                   -- 应为 42
SELECT COUNT(*) FROM travel_db.booking_order;           -- 新库应为 0
```

> `schema.sql` 带 `DROP TABLE`，重跑会把 `t_user` 一起清掉，演示账号由后端启动时的
> `DemoDataInitializer` 重建，不用手动补。

> MySQL 账号密码在 `src/main/resources/application.yml` 里，默认 `root / 123456`，
> 不是这个的话改那里就行。

### 直接双击前端 index.html 呢？

也可以，但那种方式（`file://`）前端**走本地示例数据，不连后端**。
想验证后端必须用 `http://localhost:8080` 打开。

---

## 二、接口清单

前端对返回体的格式是写死的（见 `travel-app/README.md`），所以这里**不用 `{code,data,msg}` 包装**，成功就是裸对象/裸数组，失败才是 `{"message": "中文提示"}`。

| 方法 | 路径 | 说明 | 成功 | 失败 |
|---|---|---|---|---|
| GET | `/api/destinations` | 全部目的地（走 Redis 缓存） | 200 数组 | — |
| GET | `/api/destinations/{id}` | 单个目的地 | 200 对象 | 404 `{message}` |
| GET | `/api/hotels` | 酒店列表，可带 `?destinationId=`（不带就返回全部 42 家） | 200 数组 | — |
| POST | `/api/auth/register` | 注册，body `{username,password}` | 200 `{username,token}` | 400 / 409 |
| POST | `/api/auth/login` | 登录，body `{username,password}` | 200 `{username,token}` | 401 |
| POST | `/api/auth/logout` | 退出，头 `Authorization: Bearer <token>` | 200 `{message}` | — |
| GET | `/api/auth/me` | 当前登录用户（演示 Redis 登录态用） | 200 `{username}` | 401 |
| POST | `/api/bookings` | 下单，头 `Authorization`，body `{destinationId,hotelId,checkIn,days,people}`。`checkIn` 须在 **今天起两个月内**（`MAX_MONTHS_AHEAD`） | 200 订单 | 400 / 401 / 404 |
| GET | `/api/bookings` | 我的订单，按下单时间倒序 | 200 数组 | 401 |
| POST | `/api/bookings/{id}/cancel` | 取消订单（改状态，不删行） | 200 订单 | 401 / 404 / 409 |
| POST | `/api/ai/itinerary` | AI 生成行程（SSE 流式，详见第五节） | 200 事件流 | 流内 `error` 事件 |
| GET | `/api/ai/status` | AI 配置自检：Key 配没配、模型名能不能用 | 200 对象 | — |
| GET | `/api/amap/status` | 高德自检：Key 配没配、通不通、哪些城市预热过（详见第六节） | 200 对象 | — |
| POST | `/api/amap/warmup` | 预热高德交通数据，可带 `?destinationId=&force=` | 200 对象 | 503 `{message}` |

自测命令：

```bash
curl http://localhost:8080/api/destinations
curl http://localhost:8080/api/destinations/1
curl "http://localhost:8080/api/hotels?destinationId=1"     # 公开，不需要 token
curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"dou123","password":"123456"}'
```

下单要带登录拿到的 token（下面的 `$TOKEN` 换成上一步返回的 token）：

```bash
curl -X POST http://localhost:8080/api/bookings \
     -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
     -d '{"destinationId":1,"hotelId":2,"checkIn":"2026-09-20","days":3,"people":3}'

curl http://localhost:8080/api/bookings -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8080/api/bookings/1/cancel -H "Authorization: Bearer $TOKEN"
```

不带 `Authorization` 会拿到 **401 `{"message":"登录状态已失效，请重新登录"}`**。
如果拿到的是 400「缺少请求头」，说明 `@RequestHeader` 上漏了 `required = false` —— 见 `BookingController` 里的注释。

---

## 三、Redis 用在哪（三个地方）

### 1. 登录态：`youji:token:<token>` → 用户名（TTL 2 小时）

登录/注册成功后签发一个不透明 token 存进 Redis，前端放进 `localStorage`，后续请求用
`Authorization: Bearer <token>` 带上。选这个而不是 JWT 的原因：**退出登录时直接删 key 就能让 token 立即失效**。

```bash
redis/redis-cli.exe -p 6379 keys "*"          # 看有哪些 key
redis/redis-cli.exe -p 6379 get youji:token:xxx
redis/redis-cli.exe -p 6379 ttl youji:token:xxx
```

### 2. 目的地列表缓存：`youji:destinations:list`（TTL 60 秒）

标准的 cache-aside：先读 Redis，没有就查 MySQL 再写回。存的是 JSON 字符串
（用 `StringRedisTemplate` + Jackson，不是默认的 JDK 二进制序列化，所以 redis-cli 里能直接看懂）。

验证缓存确实生效：连点两次列表接口，第二次查询日志里不会新增 SQL。

> **Redis 挂了不会拖垮列表页**：读缓存、写缓存都包了 try/catch，失败只打 warn 日志并回源数据库。
> 只有登录接口对 Redis 是强依赖，连不上时返回 503 和「请先启动 Redis」的提示。

### 3. 高德交通数据：`youji:amap:ground:v1:<maxPoints>:<目的地ID>`（TTL 7 天）

这个 key 里带 `maxPoints` 是有意的：改了配置就等于换了一把钥匙，旧缓存自然失效，不用手动清 Redis。
`v1` 是规则版本号，以后接地逻辑大改时提到 `v2` 就能一次性作废旧缓存。

这层缓存不是「优化」而是**配额闸门** —— 一个城市冷算一次要发 45 个请求，
个人 Key 每天只有约 5000 次驾车路径规划的额度。详见第六节。

```bash
redis/redis-cli.exe -p 6379 --scan --pattern "youji:amap:*"
redis/redis-cli.exe -p 6379 ttl youji:amap:ground:v1:10:1     # 1800 = 降级结果，604800 = 正常结果
```

---

## 四、数据库设计

| 表 | 说明 |
|---|---|
| `t_user` | 用户，密码存 BCrypt 哈希（不存明文） |
| `destination` | 目的地主表 |
| `destination_tag` | 卡片上的标签，靠 `sort_order` 保证顺序 |
| `destination_attraction` | 推荐景点 |
| `hotel` | 酒店，每个目的地 3 家，共 42 家 |
| `booking_order` | 预订订单 |

几个刻意为之、别改回去的点：

- **表名 `t_user`**：`user` 是 MySQL 保留字。
- **表名 `booking_order`**：`order` 同样是保留字，理由和 `t_user` 一样。
- **列名 `attr_desc` / `hotel_desc`**：`desc` 是 MySQL 保留字。实体字段叫 `attrDesc` / `hotelDesc`（若叫 `desc`，MyBatis-Plus 会生成 `hotel_desc AS desc`，别名照样是保留字，直接语法错误）；对外 JSON 仍是 `desc`。
- **订单上的三个「快照」列**（`destination_name` / `hotel_name` / `unit_price`）：酒店调价、改名、下架，历史订单上的金额和名字都不跟着变。订单记的是「当时谈好的事」，不是「现在数据库里是什么」。顺带让「我的订单」成了一次单表查询，不用 JOIN。
- **`total_amount` 一律后端算**：请求体里就算塞了 `totalAmount` 也直接忽略，否则改一下请求体就能一块钱订五星酒店。
- **`days` / `best_season` 用 VARCHAR**：前端展示的是「3-4 天」「3-5 月 / 9-11 月」，建成 INT 会只剩数字。
- **`rating` 用 DECIMAL(2,1)**：用 float 会被序列化成 `4.800000190734863`。
- 数据用「3 次批量查询 + 内存分组」组装嵌套 JSON，不用 XML 嵌套 resultMap —— 没有 N+1，也不会踩 JOIN 笛卡尔积。

---

## 五、AI 行程规划（接大模型）

前端「AI 规划」页会让大模型**基于本站数据库里的景点**排一份逐日行程，流式输出、边写边显示。

### 用哪家、怎么接的

DeepSeek，走 OpenAI 兼容的 `POST /chat/completions`，用 JDK 自带的 `java.net.http.HttpClient`
直接发 HTTP —— **没有引入任何新的 Maven 依赖**，不用等依赖下载，也不担心 SDK 版本升级。

想换别家（通义、智谱等）：改 `application.yml` 里的 `youji.ai.base-url` 和 `youji.ai.model` 两行即可，
代码不用动。

### API Key 配置

Key 放在环境变量里，**不要写进 `application.yml`**（那个文件会提交到仓库）。

```bash
# Windows，设完要重启后端
setx DEEPSEEK_API_KEY "sk-你的key"
```

申请地址：<https://platform.deepseek.com> 。没配 Key 也不影响其它功能，只是点生成时会收到一条
中文提示告诉你去配。

### 先自检，再排查

浏览器打开 <http://localhost:8080/api/ai/status> ，它会实时列一遍账号可用的模型名：

```json
{
  "baseUrl": "https://api.deepseek.com",
  "model": "deepseek-flash",
  "apiKeyConfigured": true,
  "availableModels": ["deepseek-flash", "deepseek-v4-pro"],
  "modelUsable": true
}
```

> **模型名是会过期的**：`deepseek-chat` / `deepseek-reasoner` 已于 2026-07-24 停用，用旧名直接报错。
> `modelUsable` 为 false 时，把 `availableModels` 里任意一个填回 `application.yml` 的 `youji.ai.model` 就行。

### 为什么用 SSE 流式

一篇行程要生成十几到几十秒，一次性返回的话用户只能盯着转圈。所以后端边生成边推，
前端页面上是打字机效果。事件类型：

| 事件 | 数据 | 说明 |
|---|---|---|
| `status` | `{"text":"正在思考行程安排…"}` | 仅提示，不拼进正文 |
| `delta` | `{"text":"..."}` | 正文增量，按顺序拼接 |
| `done` | `{"length":3910}` | 正常结束 |
| `error` | `{"message":"中文提示"}` | 出错，前端直接显示 |

自测（`-N` 关掉 curl 缓冲，才看得到流式效果）：

```bash
curl -N -X POST http://localhost:8080/api/ai/itinerary \
     -H "Content-Type: application/json" \
     -d '{"destinationId":1,"days":3,"preference":"不想太赶"}'
```

> 演示技巧：`youji.ai.thinking` 默认**不发送**，是否思考交给服务端默认行为。
> 答辩时想让出字更快，取消 `application.yml` 里 `thinking: false` 的注释即可（更快更省，质量略降）。

---

## 六、高德地图（给行程喂真实交通数据）

### 为什么要接它

第五节的提示词原本是**自相矛盾**的：第 4 条要求写「交通方式（地铁几号线 / 打车大概多少钱多久）」，
第 3 条又要求「绝对不要编造」。模型不可能知道西湖到灵隐寺多远、打车多少钱 ——
没有数据它只能编，提示词自己在逼它说谎。

接高德之后，景点从高德 POI 里挑（真实存在），交通数字从高德路径规划里取（真实可达）。
**高德提供事实，DeepSeek 负责组织成文**，各干各的。

> 高德**没有**开放的文本生成大模型 API。官方的 MCP Server 底层调的是通义千问，
> 而那个模型在阿里云百炼、不在高德。所以这里走的是纯 REST 调用，
> 依然守着 `AiItineraryService` 类注释里那条「没有引入任何新的 Maven 依赖」。

### API Key 配置

```bash
# Windows，设完要重启后端
setx AMAP_API_KEY "你的32位key"
```

申请地址 <https://lbs.amap.com> → 创建应用 → 添加 Key。两个选项选错会直接报错：

| 选项 | 必须选 | 选错的后果 |
|---|---|---|
| 服务平台 | **Web服务** | 选成「Web端(JS API)」或「Android」→ `10002` / `10009` |
| 数字签名 | **保持关闭** | 开了之后每个请求都要再补一个 `sig` 参数 → `10007` / `10008` |

**没配 Key 不影响行程生成**，只是交通数字会退化成「打车前往」这类模糊表述。
这一点和高德在系统里的定位一致：它是**增强**，不是依赖。（不像 `DEEPSEEK_API_KEY`，那个没配直接报错。）

### 自检与预热

```bash
curl http://localhost:8080/api/amap/status
```

```json
{
  "enabled": true,
  "apiKeyConfigured": true,
  "baseUrl": "https://restapi.amap.com",
  "maxPoints": 10,
  "pairCountPerCity": 45,
  "cacheTtlHours": 168,
  "cachedDestinations": [1, 2, 3]
}
```

配了 Key 的话它会真发一次请求探连通性，不通报错并给出中文原因。`cachedDestinations`
列出哪些城市已经预热过 —— 空列表说明首次生成会多等几秒。

```bash
curl -X POST http://localhost:8080/api/amap/warmup                # 全部 14 个城市
curl -X POST "http://localhost:8080/api/amap/warmup?destinationId=1"
curl -X POST "http://localhost:8080/api/amap/warmup?force=true"   # 已缓存的也重算
```

全部预热约一到两分钟（14 城 × 45 对）。返回体的 `unresolved` 是调复合景点名规则的抓手，
出问题时一眼能看出是哪个名字没解析出来：

```json
{"warmed":1,"skipped":0,"failed":0,
 "details":[{"destinationId":1,"city":"成都","points":10,"routes":45,
             "degraded":false,"unresolved":["什刹海 · 胡同"]}]}
```

> **没配 Key 时预热返回 503**，而不是报一个 `warmed:0` 的假成功 —— 预热本来就没有意义，
> 与其让你猜为什么全是 0 个地点，不如直接说清楚先去配 Key。

### 调用量账

每个城市取 `max-points` 个地点，两两配对算驾车方案（A→B 和 B→A 合并成一次，
距离耗时基本对称，打车费差几块钱不值得翻倍配额）：

| max-points | 对数/城市 | 14 城预热一次 |
|---|---|---|
| 8 | 28 | 392 |
| **10（默认）** | **45** | **630** |
| 12 | 66 | 924 |

个人认证开发者每天约 5000 次驾车路径规划，默认档预热一次占 12%。
**但冷启动每次请求就是 45 次** —— 不缓存的话，一百来次生成就把当天配额吃光。
所以缓存不是优化，是必需品。改 `application.yml` 里的 `youji.amap.max-points` 即可，
key 里带着这个值，改了旧缓存自动失效。

### `max-concurrency` 必须是 1（实测，别凭直觉调大）

瓶颈在高德那侧的限流，不在我们的并发度上。同一套代码跑到 45 对路线的实测：

| max-concurrency | 拿到的路线 | 撞 10021 限流 | 耗时 |
|---|---|---|---|
| 4 | 43/45 | 31 次 | 16.8 秒 |
| 2 | 43/45 | 29 次 | 18.2 秒 |
| **1** | **45/45** | **12 次** | **19.2 秒** |

并发调大既拿不到更多数据，又白白多烧配额（31 次重试 vs 12 次），还可能触发
10004「封停一分钟」。并发 1 时请求照样会被限流，但退避重试能把它们全部补回来；
并发一高，重试和新增请求互相挤，最后总有几条补不回来。

> 所以预热一次约 19 秒/城市，14 城全量约 3 分半，全部 45/45 完整。

### 高德永远返回 HTTP 200

成功失败要看响应体里的 `status`（字符串 `"1"` / `"0"`）和 `infocode`，
所以第五节的 `describeUpstreamError` 那套按状态码分派的写法在这里完全用不上。几个关键码：

| infocode | 含义 | 处理 |
|---|---|---|
| `10001` | Key 无效或过期 | 熔断 5 分钟 |
| `10003` / `10044` | 日配额用尽 | 熔断 30 分钟 |
| `10004` | 访问过频（封停一分钟） | **不重试**，熔断 62 秒 |
| `10015` / `10020` / `10021` | QPS 超限 | 退避重试（800ms、2000ms） |
| `20011` / `20800`-`20803` | 该组合无可行车路线 | 正常业务结果，跳过这一对，不记 warn |

**熔断是「批量中止」而不是「逐个重试」**：逐对算矩阵时会一口气发几十个请求，
Key 无效的话每个都重试就是几十倍的浪费调用。实测一个无效 Key 只会发出 **1 个**请求就被短路。

### 降级：绝不阻断生成

没配 Key、超时、报错、配额用尽 —— 统一返回空串，行程照常生成，提示词相应放宽
（`systemPrompt(boolean grounded)`）。**提示词必须跟着降级**：接地块为空时
不能再要求「只能引用表里的数字」，否则模型会干脆一个字都不写交通，反而不如让它给个模糊量级。

降级结果按 `degraded-ttl`（默认 30 分钟）缓存而不是 7 天 —— 否则用户之后配好 Key，
还要被那个空缓存卡住一周。判定条件是「没算完」**或**「连 2 个地点都没解析出来」，
而不是「算出来几条路线」：有些组合高德确实没有可行车路线（隔海、超出规划范围），
那是正常结果，不该算降级。

### 已知局限：POI 候选集偏弱

补进来的同城景点是用 `keywords=景点` 搜的，而**高德对这个宽泛词的权重排序会稳定返回同一簇现代城市公园**。
以成都为例，实测拿到的固定是交子公园、铁像寺水街、双子塔、桂溪生态公园、锦城公园这一批
（全在武侯区），而武侯祠、杜甫草堂这类标志性去处不会出现。

换关键词救不了：`景区` 返回**完全相同**的一簇，`types=110000` 反而更差（莲花寺、河游寺这类 3.5-4.2 分的冷门点）。
它们只在窄类目下才冒头（`博物馆` → 武侯祠，`古镇` → 安仁古镇、黄龙溪古镇），
但那些点都在一小时车程外，混进来**可能让行程变差而不是变好**。

所以现状是：**数据库里那 3-4 个景点是行程的骨干，高德 POI 只做补充**。
要改进的话，可行方向是「多个窄类目关键词分别搜、合并去重」，但那需要先想清楚怎么把偏远点挡在外面。

### 演示建议

答辩前跑一次 `POST /api/amap/warmup`（14 城约 3 分半，每城 45/45 条路线），
之后每次生成都是缓存命中、零额外等待。
别把它做成定时任务 —— 那会在没人用的时候白烧配额。

---

## 七、常见问题

| 现象 | 原因 / 解决 |
|---|---|
| 启动报 `Public Key Retrieval is not allowed` | JDBC URL 少了 `allowPublicKeyRetrieval=true`（已默认带上） |
| 启动报 `Table 'travel_db.destination' doesn't exist` | 还没执行 `sql/schema.sql` 和 `sql/data.sql` |
| 登录报 503「请先启动 Redis」 | `redis/start-redis.bat` 没开，或 6379 被占用 |
| 页面报「请求失败」 | 后端没起 / 前端是用 `file://` 打开的（那种方式走本地示例数据，不连后端） |
| 8080 端口被占用 | 改 `application.yml` 的 `server.port`，同时改 `travel-app/js/api.js` 里的 `API_BASE` |
| 改了数据库但页面一分钟内没变 | 列表缓存 TTL 是 60 秒，等一会儿或调小 `DestinationCache` 里的 `TTL` |
| `mvn clean` 报 `Failed to delete ...\target` | VS Code 的 Java 语言服务器（redhat.java 扩展）占着 target 目录。关掉 VS Code 里的 Java 扩展再构建，或先手动删掉 `target` 文件夹 |
| 构建成功但启动报找不到数据源 | 检查 `target/classes/application.yml` 在不在、jar 里 `BOOT-INF/classes/application.yml` 在不在（`unzip -l target\*.jar`）。构建目录被别的进程占用时会出现这种残缺包，重新构建即可 |
| 建库时中文变成 `???` | 用 `mysql --default-character-set=utf8mb4` 执行，或先在 cmd 里 `chcp 65001` |
| 点「生成行程」报「还没有配置大模型 API Key」 | 没设环境变量 `DEEPSEEK_API_KEY`，或者设完没重启后端（`setx` 只对新开的进程生效） |
| 报「模型名不可用」 | 模型名过期了。访问 `/api/ai/status` 看 `availableModels`，把其中一个填回 `application.yml` 的 `youji.ai.model` |
| 行程生成到一半卡住 | 页面上的错误提示会说明原因（超时 / 余额不足 / 限流）；后端详细日志在 `logs/server.log` |
| `/api/amap/status` 报 `10002` / `10009` | 申请 Key 时「服务平台」选成了「Web端(JS API)」等。必须选「**Web服务**」，改完要重新申请一个 Key |
| `/api/amap/status` 报 `10007` / `10008` | 该 Key 开了「数字签名」。到高德控制台关掉它，或自行补 `sig` 参数 |
| 预热报 503「还没配置高德 Key」 | 没设 `AMAP_API_KEY`，或者设完没重启后端（`setx` 只对新开的进程生效） |
| 预热成功但 `points` 是 0、`degraded` 是 true | Key 本身没通（多半是上面两条）。看后端日志里的 `infocode`，`10001` 就是 Key 无效 |
| 行程里的交通数字消失了 | 说明这次没拿到高德数据，提示词自动放宽了。访问 `/api/amap/status` 看 `reachable` 和 `error`；也可能只是当日配额用尽（`10003`），次日自动恢复 |
| 同一个城市第二次生成还要等几秒 | 正常结果缓存 7 天，但**降级结果只缓存 30 分钟**，所以会重算。查 `redis-cli ttl youji:amap:ground:v1:10:1`：1800 就是降级了 |
