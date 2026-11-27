# 部署说明（阿里云轻量应用服务器）

一台 Linux 机器跑 MySQL 8 + Redis 7 + Spring Boot，Nginx 反代 80/443，前端由后端同源托管。
拓扑与各组件职责见 [架构说明 §9](../docs/architecture.md#9-部署拓扑)，本文只讲**怎么装、怎么更**。

## 目录约定

```
/opt/youji/                    ← git clone 出来的仓库根
├── travel-app/                ← 前端（不在 jar 里，靠这个目录托管）
├── deploy/                    ← 本目录
└── travel-server/
    └── target/travel-server-1.0.0.jar
```

> 前端必须在磁盘上：`application.yml` 配的是
> `static-locations: file:./../travel-app/,file:./travel-app/`；
> 以 `/opt/youji/travel-server` 为工作目录启动时，`./../travel-app` 正好指向前端目录。

## 一次性初始化

```bash
# 1. 环境
sudo apt update
sudo apt install -y openjdk-21-jre-headless mysql-server redis-server nginx git maven curl
sudo systemctl enable --now mysql redis-server nginx

# 2. Redis 只监听本机（当前应用未配置 Redis 密码，勿单独开 requirepass）
sudo sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
sudo systemctl restart redis-server

# 3. 拉代码
sudo mkdir -p /opt/youji && sudo chown $USER /opt/youji
git clone https://github.com/DDD123979/travelogue.git /opt/youji

# 4. 建库导数据（schema.sql 带 DROP TABLE，只能在新库上跑）
cd /opt/youji/travel-server
mysql -u <user> -p --default-character-set=utf8mb4 < sql/schema.sql
mysql -u <user> -p --default-character-set=utf8mb4 < sql/data.sql

# 5. 配置（数据库账号密码必填，无默认值；AI/高德可选）
cat > /opt/youji/.env <<'EOF'
DB_USERNAME=youji
DB_PASSWORD=你的数据库密码
DEEPSEEK_API_KEY=
AMAP_API_KEY=
EOF
chmod 600 /opt/youji/.env

# 6. 打包
cd /opt/youji/travel-server && mvn -B -DskipTests clean package

# 7. 服务与反代
sudo cp /opt/youji/deploy/youji.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now youji

sudo cp /opt/youji/deploy/nginx-youji.conf /etc/nginx/sites-available/youji
sudo ln -sf /etc/nginx/sites-available/youji /etc/nginx/sites-enabled/youji
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 8. 验收
curl -s http://127.0.0.1:8080/api/destinations | head -c 200
curl -s http://127.0.0.1:8080/api/ai/status
```

阿里云控制台的**防火墙**只需放行 `22`、`80`、`443`，**3306 / 6379 一律不要开**。

## 每日备份

生产库只在这台机器的一块盘上，误删或磁盘故障就没了。仓库带了脚本：

```bash
sudo install -m 755 /opt/youji/deploy/backup.sh /usr/local/bin/youji-backup.sh
echo '0 3 * * * root /usr/local/bin/youji-backup.sh >> /var/log/youji-backup.log 2>&1' \
  | sudo tee /etc/cron.d/youji-backup
sudo chmod 644 /etc/cron.d/youji-backup

# 手动跑一次确认能出文件
sudo /usr/local/bin/youji-backup.sh
ls -lh /var/backups/youji/
```

备份落在 `/var/backups/youji/travel_<日期>.sql.gz`，保留 7 天，脚本会校验非空且可解压。
**异地才是真备份**，建议每周拉一份到本地：

```bash
scp <user>@<your-host>:/var/backups/youji/travel_*.sql.gz ./
```

## 生产关闭 SQL 日志

`application.yml` 的 `log-impl` 默认打印每条 SQL（本地调试好用），线上在 `/opt/youji/.env` 关掉：

```ini
MYBATIS_LOG_IMPL=org.apache.ibatis.logging.nologging.NoLoggingImpl
```

改完 `sudo systemctl restart youji`，日志里不再出现 `==>  Preparing:` 即生效。

## 日常更新

```bash
bash /opt/youji/deploy/deploy.sh          # 拉代码 → 打包 → 重启 → 健康检查
```

或分步：`git pull` → `mvn -DskipTests package` → `sudo systemctl restart youji`。

> 涉及配置变更（如 `server.address` 改为仅监听本机）也需要重启才生效；重启前确认 `.env` 里有 `DB_USERNAME` / `DB_PASSWORD`。

## 排错

| 现象 | 检查 |
|---|---|
| 页面 404、接口正常 | 前端目录没就位，`ls /opt/youji/travel-app/index.html` |
| 页面白屏、控制台报混合内容 | 用域名访问，别用 `file://` 或 https 页面调 http 接口 |
| 启动即退出 | `journalctl -u youji -n 50`；多半是 MySQL 连不上、缺表或缺数据库环境变量 |
| `Public Key Retrieval is not allowed` | JDBC URL 缺 `allowPublicKeyRetrieval=true`（仓库已带） |
| AI 无响应但页面不报错 | Nginx 少了 `proxy_buffering off`，SSE 被缓冲 |
| 内存告警 | 确认启动参数 `-Xmx512m`，MySQL `innodb_buffer_pool_size=128M` |

## 上线前检查清单

- [ ] `.env` 已设置 `DB_USERNAME` / `DB_PASSWORD`（**无默认值**，缺失会启动失败），并使用最小权限账号
- [ ] `MYBATIS_LOG_IMPL` 已切到 NoLogging
- [ ] 删除或改写 `DemoDataInitializer` 创建的演示账号（口令固定在代码中）
- [ ] 不要在生产重跑 `sql/schema.sql`（含 `DROP TABLE`）
- [ ] 备份任务已生效并做过一次异地拉取
- [ ] 待办：HTTPS（需域名与证书）
