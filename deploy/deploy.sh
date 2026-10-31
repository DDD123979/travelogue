#!/usr/bin/env bash
# 服务器端更新脚本：拉代码 → 打包 → 重启 → 健康检查
#
# 用法（在服务器的 /opt/youji 下）：
#   bash deploy/deploy.sh
#
# 如果服务器内存只有 2G，也可以在本机打包后 scp 覆盖 jar，再用
#   sudo systemctl restart youji
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/youji}"
SERVICE="${SERVICE:-youji}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/destinations}"

cd "$APP_DIR"

echo "==> 1/4 拉取最新代码"
git pull --ff-only

echo "==> 2/4 打包（跳过测试）"
cd travel-server
mvn -B -q -DskipTests clean package

echo "==> 3/4 重启服务"
sudo systemctl restart "$SERVICE"

echo "==> 4/4 健康检查"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 "$HEALTH_URL" >/dev/null 2>&1; then
    echo "OK：接口已就绪，部署完成"
    exit 0
  fi
  sleep 2
done

echo "启动失败，最近 40 行日志："
sudo journalctl -u "$SERVICE" -n 40 --no-pager
exit 1
