/* 生成「地图导览」的绿色中国地图与打点坐标
 *
 * 用法（在仓库根目录）：
 *   node travel-app/tools/gen-china-map.js <省界 GeoJSON 路径>
 *
 * 数据源：https://github.com/longwosion/geojson-map-china 的 china.json（省级要素）
 * 产物：
 *   travel-app/img/china-map.svg        绿色中国地图（省级色块，无外链）
 *   travel-app/js/data/china-pins.js    23 个目的地的百分比坐标（与 SVG 同一套墨卡托投影）
 *
 * 改了城市经纬度后重新跑一次即可，不要手改产物。
 */

/* 生成绿色中国地图 SVG + 目的地投影坐标
 * 数据源：longwosion/geojson-map-china 的 china.json（省级要素）
 * 投影：墨卡托（与前端饼点定位一致）
 */
const fs = require('fs');
const path = require('path');

const GEO = process.argv[2] || 'china.json';  // 省界 GeoJSON 路径（见文件头说明）
const OUT_SVG = 'travel-app/img/china-map.svg';

const geo = JSON.parse(fs.readFileSync(GEO, 'utf8'));

// 23 个目的地经纬度（近似市中心坐标，用于打点，不参与导航计算）
const CITIES = {
  成都: [104.07, 30.57], 杭州: [120.15, 30.27], 西安: [108.94, 34.34],
  三亚: [109.51, 18.25], 大理: [100.23, 25.6], 北京: [116.4, 39.9],
  厦门: [118.09, 24.48], 丽江: [100.23, 26.87], 广州: [113.26, 23.13],
  武汉: [114.3, 30.59], 长沙: [112.94, 28.23], 南京: [118.8, 32.06],
  上海: [121.47, 31.23], 深圳: [114.06, 22.55], 重庆: [106.55, 29.56],
  桂林: [110.29, 25.27], 苏州: [120.58, 31.3], 青岛: [120.38, 36.07],
  张家界: [110.48, 29.13], 敦煌: [94.66, 40.14], 洛阳: [112.45, 34.62],
  开封: [114.31, 34.8], 威海: [122.12, 37.51],
};

// 墨卡托 y：转成「度」与经度同量纲，否则宽高比会算成 1:0.01
const mercY = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;

function rings(feature) {
  const g = feature.geometry;
  if (!g) return [];
  if (g.type === 'Polygon') return [g.coordinates[0]];
  if (g.type === 'MultiPolygon') return g.coordinates.map((p) => p[0]);
  return [];
}

// 1) 求所有坐标的投影包围盒
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const f of geo.features) {
  for (const ring of rings(f)) {
    for (const [lng, lat] of ring) {
      const y = mercY(lat);
      if (lng < minX) minX = lng;
      if (lng > maxX) maxX = lng;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
// 留 1.5% 边距，避免描边被裁
const padX = (maxX - minX) * 0.015;
const padY = (maxY - minY) * 0.015;
minX -= padX; maxX += padX; minY -= padY; maxY += padY;

const W = 1000;
const H = Math.round((W * (maxY - minY)) / (maxX - minX));
const toX = (lng) => ((lng - minX) / (maxX - minX)) * W;
const toY = (lat) => ((maxY - mercY(lat)) / (maxY - minY)) * H;

// 2) 省级多边形 → path（投影后按 0.1 精度取整，体积可控）
const palette = ['#b6d8c0', '#a9d0b5', '#9fc9ac', '#b2d5bd', '#a6cdb2', '#badcc4'];
const shapes = [];
let order = 0;
for (const f of geo.features) {
  const name = (f.properties && (f.properties.name || f.properties.NAME)) || '';
  const fill = palette[order % palette.length];
  order++;
  for (const ring of rings(f)) {
    const d = ring
      .map(([lng, lat], i) => (i === 0 ? 'M' : 'L') + toX(lng).toFixed(1) + ' ' + toY(lat).toFixed(1))
      .join('') + 'Z';
    shapes.push(`<path d="${d}" fill="${fill}" stroke="#ffffff" stroke-width="1.1" stroke-opacity="0.9"><title>${name}</title></path>`);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="中国地图">
<defs>
  <linearGradient id="mapTint" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#eaf5ec" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#dcefdf" stop-opacity="0.15"/>
  </linearGradient>
</defs>
<g>${shapes.join('')}</g>
<rect width="${W}" height="${H}" fill="url(#mapTint)" pointer-events="none"/>
</svg>`;

fs.writeFileSync(OUT_SVG, svg, 'utf8');

// 3) 目的地坐标 → 百分比（供组件绝对定位使用）
const pins = {};
for (const [name, [lng, lat]] of Object.entries(CITIES)) {
  pins[name] = [+(((lng - minX) / (maxX - minX)) * 100).toFixed(2), +(((maxY - mercY(lat)) / (maxY - minY)) * 100).toFixed(2)];
}

const js = `/* =========================================================
 * data/china-pins.js — 「地图导览」打点坐标（百分比，左上原点）
 * 由 scripts/gen-china-map.js 生成，与 img/china-map.svg 使用同一套墨卡托投影。
 * 改坐标请回到生成脚本，不要手改本文件。
 * ========================================================= */
const CHINA_PINS = ${JSON.stringify(pins, null, 2)};
`;
fs.writeFileSync('travel-app/js/data/china-pins.js', js, 'utf8');

console.log('  地图 SVG: ' + OUT_SVG + '  ' + Math.round(svg.length / 1024) + ' KB  viewBox 0 0 ' + W + ' ' + H);
console.log('  打点数量: ' + Object.keys(pins).length);
console.log('  示例: 北京 ' + JSON.stringify(pins['北京']) + '  三亚 ' + JSON.stringify(pins['三亚']) + '  敦煌 ' + JSON.stringify(pins['敦煌']));
