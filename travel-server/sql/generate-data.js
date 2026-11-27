/* 从 travel-app/js/mock-data.js 生成 travel-server/sql/data.sql
 *
 * 用法（在仓库根目录）：
 *   node travel-server/sql/generate-data.js
 *
 * 为什么要有它：data.sql 与 mock-data.js 是同一批数据的两份副本，
 * 手改任何一边都会漏同步；改数据请只改 mock-data.js，再跑本脚本重新生成。
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const mockPath = path.join(root, 'travel-app/js/mock-data.js');
const outPath = path.join(root, 'travel-server/sql/data.sql');

const src = fs.readFileSync(mockPath, 'utf8');
const ctx = { console };
vm.createContext(ctx);
// 顶层 const 不会挂到 context 上，用表达式取回
const list = vm.runInContext(src + '\n;MOCK_DESTINATIONS', ctx);
if (!Array.isArray(list) || list.length === 0) throw new Error('MOCK_DESTINATIONS 读取失败');

const q = (v) => {
  if (v === null || v === undefined) return 'NULL';
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
};
const n = (v) => (v === null || v === undefined || v === '' ? '0' : Number(v));

const out = [];
out.push('-- =========================================================');
out.push('-- 游迹 · 初始数据（' + list.length + ' 个目的地 + 标签 + 推荐景点）');
out.push('--');
out.push('-- 本文件由 travel-app/js/mock-data.js 生成，两边内容必须逐字一致；');
out.push('-- 改数据请先改 mock-data.js，再执行 node travel-server/sql/generate-data.js');
out.push('--');
out.push('-- 执行：mysql -uroot -p --default-character-set=utf8mb4 < data.sql');
out.push('-- =========================================================');
out.push('');
out.push('USE travel_db;');
out.push('');
out.push('-- 从表在前：先清子表再清主表，避免外键顺序问题');
out.push('DELETE FROM destination_attraction;');
out.push('DELETE FROM destination_tag;');
out.push('DELETE FROM destination;');
out.push('');

list.forEach((d, i) => {
  const g = d.gradient || ['#E8EEF3', '#CBD8E2'];
  const hl = d.highlight || {};
  out.push('-- ' + (i + 1) + '. ' + d.name + '（' + d.location + ' · ' + d.category + '）');
  out.push(
    'INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (' +
      [
        n(d.id),
        q(d.name),
        q(d.enName || ''),
        q(d.category),
        q(d.location),
        Number(d.rating || 0).toFixed(1),
        n(d.priceFrom),
        q(d.days || ''),
        q(d.bestSeason || ''),
        q(g[0]),
        q(g[1]),
        q(d.image || ''),
        q(d.description || ''),
        q(hl.name || ''),
        q(hl.desc || ''),
        n(d.hotScore),
        i + 1,
      ].join(', ') +
      ');'
  );

  if (Array.isArray(d.tags) && d.tags.length) {
    out.push(
      'INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES ' +
        d.tags.map((t, k) => '(' + n(d.id) + ', ' + q(t) + ', ' + (k + 1) + ')').join(', ') +
        ';'
    );
  }

  if (Array.isArray(d.attractions) && d.attractions.length) {
    out.push(
      'INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES'
    );
    out.push(
      d.attractions
        .map(
          (a, k) =>
            '  (' +
            [n(d.id), q(a.name), q(a.type || ''), q(a.time || ''), q(a.desc || ''), k + 1].join(', ') +
            ')'
        )
        .join(',\n') + ';'
    );
  }
  out.push('');
});

fs.writeFileSync(outPath, out.join('\n'), 'utf8');
console.log('已生成 ' + outPath);
console.log('  目的地 ' + list.length +
  ' / 标签 ' + list.reduce((s, d) => s + (d.tags || []).length, 0) +
  ' / 景点 ' + list.reduce((s, d) => s + (d.attractions || []).length, 0));
