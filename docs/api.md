# 游迹 · 接口说明

> 前后端唯一的接口契约。实现细节见 [架构说明](architecture.md)，开发约定见 [开发说明](development.md)。

## 1. 通用约定

| 项 | 约定 |
|---|---|
| 基础地址 | 同源（页面由后端托管）；本地独立静态服务时为 `http://localhost:8080` |
| 数据格式 | `application/json`；上传为 `multipart/form-data`；AI 为 `text/event-stream` |
| 鉴权 | 写接口需 `Authorization: Bearer <token>`，token 由登录/注册返回 |
| 错误体 | 统一 `{"message": "中文提示"}`，**HTTP 状态码即真实语义** |
| 超时 | 前端普通请求 15s；AI 流式 120s |

**状态码**：`400` 参数不合法 · `401` 未登录/令牌失效 · `404` 资源不存在 · `409` 冲突（重名、重复操作） · `413` 文件过大 · `503` 依赖不可用（如 Redis 未启动）。

> 错误**不会**用 200 返回。前端只判断 `res.ok`，200 包错误会被当成正常数据渲染。

## 2. 接口一览

标注「登录」的接口需要携带 token；未标注的可匿名访问。

### 2.1 账号

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | — | 注册，返回 `{username, token, userNo, nickname, avatar}` |
| POST | `/api/auth/login` | — | 登录，体同上 |
| POST | `/api/auth/logout` | 登录 | 删除 Redis 中的 token |
| GET | `/api/auth/me` | 登录 | 当前用户 `{username, userNo, nickname, avatar}` |
| POST | `/api/auth/avatar` | 登录 | 上传头像（multipart，字段 `file`），返回 `{avatar}` |
| POST | `/api/auth/nickname` | 登录 | 改昵称 `{nickname}` |
| POST | `/api/auth/password` | 登录 | 改密码 `{oldPassword, newPassword}` |
| POST | `/api/auth/password/reset` | 登录 | 凭登录态重设密码 `{newPassword}` |
| POST | `/api/auth/forgot` | — | 生成重置验证码 `{username}` |
| POST | `/api/auth/reset` | — | 用验证码重设 `{username, code, newPassword}` |

### 2.2 目的地

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/destinations` | — | 全部目的地（走 Redis 缓存，TTL 60s） |
| GET | `/api/destinations/{id}` | — | 单个目的地，不存在返回 404 |

### 2.3 社区

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/posts` | — | 列表；支持 `destinationId`、`favorites=true`、`mine=true` |
| POST | `/api/posts` | 登录 | 发帖 `{destinationId, content, images[]}` |
| DELETE | `/api/posts/{id}` | 登录 | 删除自己的帖子（级联清理互动） |
| POST | `/api/posts/{id}/like` | 登录 | 点赞/取消（toggle），返回 `{liked, likeCount}` |
| POST | `/api/posts/{id}/favorite` | 登录 | 收藏/取消，返回 `{favorited, favoriteCount}` |
| GET | `/api/posts/{id}/comments` | — | 评论列表 |
| POST | `/api/posts/{id}/comments` | 登录 | 发表评论 `{content}`（≤300 字） |
| DELETE | `/api/comments/{id}` | 登录 | 删除自己的评论 |
| GET | `/api/notifications` | 登录 | 增量通知 `?afterId=N`，返回最新 20 条 |
| POST | `/api/uploads` | 登录 | 上传图片（multipart，字段 `file`），返回 `{url}` |

### 2.4 AI 与高德

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/ai/itinerary` | — | 生成行程（SSE 流式）`{destinationId, days, preference}` |
| GET | `/api/ai/status` | — | AI 配置自检（Key、模型是否可用） |
| GET | `/api/amap/status` | — | 高德自检（连通性、已缓存的城市） |
| POST | `/api/amap/warmup` | — | 预热接地缓存；`?destinationId=` 单城，`?force=true` 重算 |

## 3. 典型请求

### 3.1 登录

```http
POST /api/auth/login
Content-Type: application/json

{ "username": "xiaowang", "password": "<password>" }
```

```json
200 { "username": "xiaowang", "token": "…32 位…", "userNo": "51188398", "nickname": "小王", "avatar": "/uploads/x.jpg" }
401 { "message": "用户名或密码错误" }
429 { "message": "密码错误次数过多，账号已临时锁定，请 15 分钟后再试" }
```

### 3.2 发帖

```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{ "destinationId": 21, "content": "龙门石窟……", "images": ["/uploads/a.jpg"] }
```

> 图片先调 `/api/uploads` 拿地址，再随正文一起提交；最多 4 张。

### 3.3 AI 行程（SSE）

```http
POST /api/ai/itinerary
Content-Type: application/json

{ "destinationId": 1, "days": 3, "preference": "不想太赶" }
```

事件类型：`status`（提示）、`delta`（正文增量）、`done`（结束）、`error`（中文错误）。

```bash
curl -N -X POST http://localhost:8080/api/ai/itinerary \
     -H "Content-Type: application/json" \
     -d '{"destinationId":1,"days":3}'
```

## 4. 目的地对象

前端依赖的主要字段（完整字段见 `DestinationDTO`）：

| 字段 | 说明 |
|---|---|
| `id` | 数字主键 |
| `name` / `enName` | 中文名 / 英文名（卡片封面装饰） |
| `category` | 分类，列表页筛选标签由数据自动生成 |
| `location` | 所在省份 |
| `rating` | 评分（DECIMAL，输出为数值） |
| `days` / `bestSeason` | 建议时长 / 最佳季节，字符串 |
| `gradient` | 两色渐变，封面图缺失时兜底 |
| `image` | 封面图地址，可为空 |
| `tags` | 标签数组 |
| `hotScore` | 综合热度（排行用，0–100） |
| `highlight` | `{name, desc}`，必去景点详解 |
| `attractions` | 推荐景点：`{name, type, time, desc}` |

## 5. 兼容与变更

- 字段**只增不删**；确需删除时先在 [需求说明](requirements.md) 记录并同步前端；
- 新增接口必须同时更新本文件与 `docs/development.md` 的分层约定；
- 前端所有请求集中在 `travel-app/js/api.js`，接口变更只改这一处。
