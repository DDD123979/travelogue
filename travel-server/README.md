# 游迹 · 后端说明

Spring Boot 服务，同时提供 REST 接口、SSE 流式输出与前端静态托管。

- 技术栈：Java 21 · Spring Boot 3.5 · MyBatis-Plus 3.5 · MySQL 8 · Redis 7 · BCrypt
- 架构与设计细节（认证、缓存、AI 与高德集成）见 [架构说明](../docs/architecture.md)
- 开发规范（分层、错误契约、数据库变更）见 [开发说明](../docs/development.md)
- 完整接口清单见 [接口说明](../docs/api.md)

## 启动

```bash
# 方式一：直接运行
cd travel-server
mvn spring-boot:run

# 方式二：打包后运行
mvn -DskipTests package
java -jar target/travel-server-1.0.0.jar
```

启动后访问 <http://localhost:8080> 即为完整应用（后端同时托管前端页面）。需要 Redis 已启动。

## 数据库初始化

```bash
cd travel-server
mysql -u <user> -p --default-character-set=utf8mb4 < sql/schema.sql
mysql -u <user> -p --default-character-set=utf8mb4 < sql/data.sql
```

`schema.sql` 自带 `DROP TABLE`，重复执行会清空数据；种子数据为 23 个目的地 / 115 个景点 / 69 个标签。

> 字段命名与类型有若干刻意设计（保留字、DECIMAL 精度等），改动前先看 [架构说明 §4](../docs/architecture.md#4-数据模型)。

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `DB_USERNAME` | ✅ | 数据库账号，**无默认值**；请用最小权限业务账号 |
| `DB_PASSWORD` | ✅ | 数据库密码，**无默认值**；缺失时启动失败 |
| `DB_URL` | | 默认连本机 `travel_db` |
| `DEEPSEEK_API_KEY` | | 不配则 AI 行程提示「未配置」 |
| `AMAP_API_KEY` | | 不配则交通耗时退化为估算 |
| `MYBATIS_LOG_IMPL` | | 生产建议关闭 SQL 日志 |

本地开发：

```bash
cp .env.example .env      # 填写 DB_USERNAME / DB_PASSWORD
set -a; source .env; set +a
```

生产由 systemd 的 `EnvironmentFile` 注入。AI / 高德 Key 只在服务端使用，不会下发前端。

## 核心接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/destinations`、`/api/destinations/{id}` | 目的地列表 / 详情（Redis 缓存 60s） |
| POST | `/api/auth/register`、`/login`、`/logout` | 注册 / 登录 / 退出 |
| GET | `/api/auth/me` | 当前用户 |
| POST | `/api/ai/itinerary` | AI 生成行程（SSE 流式） |
| GET | `/api/posts` | 社区列表（可按城市 / 收藏 / 我的过滤） |
| POST | `/api/posts/{id}/like`、`/favorite`、`/comments` | 点赞 / 收藏 / 评论 |
| GET | `/api/notifications` | 互动通知（轮询增量） |
| POST | `/api/uploads` | 图片上传（压缩 + 缩略图） |

完整清单、鉴权要求与请求示例见 [接口说明](../docs/api.md)。

## 常见故障排查

| 现象 | 原因 / 解决 |
|---|---|
| 启动报 `Public Key Retrieval is not allowed` | JDBC URL 少了 `allowPublicKeyRetrieval=true`（默认已带） |
| 启动报 `Table 'travel_db.destination' doesn't exist` | 还没执行 `sql/schema.sql` 与 `sql/data.sql` |
| 启动报找不到 `DB_USERNAME` / `DB_PASSWORD` | 环境变量未注入；本地 `source .env`，线上检查 systemd 的 `EnvironmentFile` |
| 登录报 503「请先启动 Redis」 | Redis 未启动或 6379 被占用 |
| 点「生成行程」报「还没有配置大模型 API Key」 | 未设 `DEEPSEEK_API_KEY`，或设完没重启进程 |
| 报「模型名不可用」 | 模型名过期，访问 `/api/ai/status` 看 `availableModels` 并更新配置 |
| `/api/amap/status` 报 `10002` / `10009` | Key 的服务平台选错，必须是「Web 服务」 |
| `/api/amap/status` 报 `10007` / `10008` | Key 开了「数字签名」，到高德控制台关闭 |
| 行程里没有交通数字 | 本次未拿到高德数据，提示词已自动放宽；看 `/api/amap/status` 的 `reachable` |
| 同一城市第二次仍要等几秒 | 降级结果只缓存 30 分钟（正常结果 7 天），属预期 |

更多工程类问题（构建、编码、端口占用）见 [开发说明 §5](../docs/development.md#5-常见开发问题)。
