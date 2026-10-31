#!/usr/bin/env bash
# 每日备份 travel_db，保留 7 天。
#
# 安装（服务器上执行一次）：
#   sudo install -m 755 /opt/youji/deploy/backup.sh /usr/local/bin/youji-backup.sh
#   echo '0 3 * * * root /usr/local/bin/youji-backup.sh >> /var/log/youji-backup.log 2>&1' \
#     | sudo tee /etc/cron.d/youji-backup
#   sudo chmod 644 /etc/cron.d/youji-backup
#
# 手动跑一次验证：
#   sudo /usr/local/bin/youji-backup.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/youji}"
KEEP_DAYS="${KEEP_DAYS:-7}"
DB="${DB:-travel_db}"
STAMP="$(date +%F_%H%M)"
OUT="$BACKUP_DIR/travel_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[$(date '+%F %T')] start -> $OUT"

# root 走 auth_socket，不需要密码；--single-transaction 不锁表且保证一致性
mysqldump --single-transaction --quick --default-character-set=utf8mb4 "$DB" | gzip > "$OUT"

# 校验：不允许空文件，且必须能正常解压
SIZE="$(stat -c %s "$OUT")"
if [ "$SIZE" -lt 1024 ]; then
  echo "[$(date '+%F %T')] ERROR: dump 太小（${SIZE} 字节），已删除" >&2
  rm -f "$OUT"
  exit 1
fi
gunzip -t "$OUT"

echo "[$(date '+%F %T')] ok: $(du -h "$OUT" | cut -f1)"

# 清理过期备份
find "$BACKUP_DIR" -name 'travel_*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "[$(date '+%F %T')] done，现存 $(find "$BACKUP_DIR" -name 'travel_*.sql.gz' | wc -l) 份"
