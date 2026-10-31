-- 给景点加「类型」字段，并回填 42 条数据。
-- 只在已存在的线上库执行一次；全新环境直接用 schema.sql + data.sql。
-- 重复执行会因为列已存在而报错，属正常。

ALTER TABLE destination_attraction
  ADD COLUMN attraction_type VARCHAR(20) NOT NULL DEFAULT '人文古迹'
    COMMENT '景点类型：自然生态 / 人文古迹 / 街区市集 / 观景夜景' AFTER name,
  ADD KEY idx_type (attraction_type);

UPDATE destination_attraction SET attraction_type = '自然生态' WHERE name IN ('大熊猫繁育研究基地', '西湖风景名胜区', '龙井村', '亚龙湾', '蜈支洲岛', '后海村', '洱海生态廊道', '苍山', '环岛路', '玉龙雪山', '武汉大学 · 东湖', '橘子洲头', '深圳湾公园');

UPDATE destination_attraction SET attraction_type = '人文古迹' WHERE name IN ('都江堰 · 青城山', '灵隐寺 · 飞来峰', '秦始皇兵马俑博物馆', '西安城墙', '喜洲古镇', '故宫博物院', '八达岭长城', '鼓浪屿', '丽江古城', '束河古镇', '沙面岛', '陈家祠', '黄鹤楼', '岳麓山 · 岳麓书院', '中山陵 · 明孝陵', '南京博物院', '豫园 · 城隍庙', '大鹏所城 · 西涌');

UPDATE destination_attraction SET attraction_type = '街区市集' WHERE name IN ('宽窄巷子', '夫子庙 · 秦淮河', '什刹海 · 胡同', '户部巷 · 江汉路', '坡子街 · 太平老街', '武康路 · 安福路', '沙坡尾');

UPDATE destination_attraction SET attraction_type = '观景夜景' WHERE name IN ('广州塔', '平安金融中心 · 市民中心', '外滩 · 陆家嘴', '大唐不夜城');

