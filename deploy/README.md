# 部署说明（阿里云轻量应用服务器）

目标形态：**一台 2C2G 的 Linux 机器**跑 MySQL 8 + Redis 7 + Spring Boot，Nginx 反代 80/443，前端由后端同源托管（无跨域）。

```
浏览器 ──80/443──> Nginx ──127.0.0.1:8080──> travel-server.jar
                                              ├── 静态页面：/opt/youji/travel-app/
                                              ├── MySQL 8：127.0.0.1:3306
                                              └── Redis 7：127.0.0.1:6379
```

## 目录约定

```
/opt/youji/                    ← git clone 出来的仓库根
├── travel-app/                ← 前端（jar 里没有，靠这个目录托管）
├── deploy/                    ← 本目录
└── travel-server/
    └── target/travel-server-1.0.0.jar
```

> **为什么前端必须在磁盘上**：`application.yml` 里配的是
> `static-locations: file:./../travel-app/,file:./travel-app/`。
> 以 `/opt/youji/travel-server` 为工作目录启动时，`./../travel-app` 正好是前端目录。

## 一次性初始化

```bash
# 1. 环境
sudo apt update
sudo apt install -y openjdk-21-jre-headless mysql-server redis-server nginx git maven curl
sudo systemctl enable --now mysql redis-server nginx

# 2. Redis 只监听本机 + 设密码（改了记得同步 application.yml 的 spring.data.redis.password）
sudo sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
sudo systemctl restart redis-server

# 3. 拉代码
sudo mkdir -p /opt/youji && sudo chown $USER /opt/youji
git clone https://github.com/DDD123979/travelogue.git /opt/youji

# 4. 建库导数据（schema.sql 自带 CREATE DATABASE，末尾有 DROP TABLE，只能在新库上跑）
cd /opt/youji/travel-server
mysql -uroot -p --default-character-set=utf8mb4 < sql/schema.sql
mysql -uroot -p --default-character-set=utf8mb4 < sql/data.sql

# 5. 密钥（不要用 git 管理这个文件）
cat > /opt/youji/.env <<'EOF'
DEEPSEEK_API_KEY=sk-你的key
AMAP_API_KEY=你的高德key
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

阿里云控制台的**防火墙**（不是安全组）只需放行 `22`、`80`、`443`，**3306 / 6379 一律不要开**。

## 每日备份（强烈建议）

生产库只在这台机器的一块盘上，误删或磁盘故障就没了。仓库里带了脚本：

```bash
sudo install -m 755 /opt/youji/deploy/backup.sh /usr/local/bin/youji-backup.sh
echo '0 3 * * * root /usr/local/bin/youji-backup.sh >> /var/log/youji-backup.log 2>&1' \
  | sudo tee /etc/cron.d/youji-backup
sudo chmod 644 /etc/cron.d/youji-backup

# 手动跑一次确认能出文件
sudo /usr/local/bin/youji-backup.sh
ls -lh /var/backups/youji/
```

备份落在 `/var/backups/youji/travel_<日期>.sql.gz`，保留 7 天，脚本会校验文件非空且能解压。
**异地**才是真备份——建议每周 `scp` 一份到本地电脑：

```bash
scp root@8.148.81.57:/var/backups/youji/travel_*.sql.gz ./
```

## 生产关闭 SQL 日志

`application.yml` 的 `log-impl` 默认会打印每条 SQL（本地调试好用），线上要在 `/opt/youji/.env` 里关掉：

```ini
MYBATIS_LOG_IMPL=org.apache.ibatis.logging.nologging.NoLoggingImpl
```

改完 `sudo systemctl restart youji`。日志里不再出现 `==>  Preparing:` 就算生效。

## 日常更新

```bash
bash /opt/youji/deploy/deploy.sh
```

或者分步：`git pull` → `mvn -DskipTests package` → `sudo systemctl restart youji`。

## 排错

| 现象 | 检查 |
|---|---|
| 页面 404、接口正常 | 前端目录没就位，`ls /opt/youji/travel-app/index.html` |
| 页面白屏、控制台报 8080 混合内容 | 用域名访问，别用 `file://` 或 https 页面调 http 接口 |
| 启动即退出 | `journalctl -u youji -n 50`，多半是 MySQL 连不上或缺表 |
| `Public Key Retrieval is not allowed` | JDBC URL 缺 `allowPublicKeyRetrieval=true`（仓库里已带） |
| AI 无响应但页面不报错 | Nginx 少了 `proxy_buffering off`，SSE 被缓冲住 |
| 内存告警 | 确认启动参数是 `-Xmx512m`，MySQL `innodb_buffer_pool_size=128M` |

## 上线前务必改掉

- `application.yml` 里 `root` / `123456` 的数据库账号密码 → 建专用用户并用 `${DB_PASSWORD}` 注入
- `DemoDataInitializer` 启动时创建的 `dou123 / 123456` 演示账号 → 上线后删除或改密码
- `sql/schema.sql` 的 `DROP TABLE` → 生产环境不要重跑
