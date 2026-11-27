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

// 社区示例帖：只在新库（帖子表为空）时插入，避免重跑 data.sql 覆盖用户内容
const posts = [
  ['dou123', 1, '第一次去成都，最大的经验是：熊猫基地一定要早上八点前进园。中午熊猫全在睡觉，看到的都是毛球。下午去宽窄巷子喝茶，一天刚刚好。', '', 0, 48],
  ['dou123', 6, '故宫真的太大了，中轴线走完就已经累瘫。建议午门进、神武门出，东西六宫挑两个看，珍宝馆别错过。提前七天抢票，手慢无。', '', 0, 24],
  ['dou123', 21, '龙门石窟比想象中震撼，卢舍那大佛那一龛光线最好的是下午。从北门进、南门出，一路走一路看，三个小时不太够。', '/img/destinations/luoyang.jpg', 0, 5],
];

out.push('-- 社区示例帖（仅当帖子表为空时插入，重跑不会覆盖已有内容）');
out.push('INSERT INTO travel_post (username, destination_id, content, images, like_count, created_at)');
out.push('SELECT u, d, c, i, l, t FROM (');
posts.forEach((p, i) => {
  const cols = ' AS u, ' + n(p[1]) + ' AS d, ' + q(p[2]) + ' AS c, ' + q(p[3]) + ' AS i, ' + n(p[4]) + ' AS l, NOW() - INTERVAL ' + p[5] + ' HOUR AS t';
  out.push((i === 0 ? '  SELECT ' : '  UNION ALL SELECT ') + q(p[0]) + cols);
});
out.push(') AS seed');
out.push('WHERE NOT EXISTS (SELECT 1 FROM travel_post);');
out.push('');

fs.writeFileSync(outPath, out.join('\n'), 'utf8');
console.log('已生成 ' + outPath);
console.log('  目的地 ' + list.length +
  ' / 标签 ' + list.reduce((s, d) => s + (d.tags || []).length, 0) +
  ' / 景点 ' + list.reduce((s, d) => s + (d.attractions || []).length, 0));
