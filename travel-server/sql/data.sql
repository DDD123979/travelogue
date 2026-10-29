-- =========================================================
-- 游迹 · 初始数据（14 个目的地 + 标签 + 推荐景点 + 酒店）
--
-- 【这份数据是手工和前端同步的】目的地/标签/景点三块原先由 gen-data-sql.js
-- 从 travel-app/js/api.js 的 MOCK_DESTINATIONS 生成，但那个脚本已经不在仓库里了；
-- 酒店块从一开始就是手写的。所以：改任何一块数据，都要同时改这里和 api.js 里
-- 对应的 MOCK_* 常量，两边逐字一致 —— file:// 双击打开时走 MOCK_*，
-- 连后端时走这个文件，两边不一致会导致两种打开方式看到的不是同一份数据。
--
-- 执行：mysql -uroot -p123456 --default-character-set=utf8mb4 travel_db < data.sql
-- =========================================================

USE travel_db;

-- 从表在前。订单排最前是因为它引用酒店和目的地。
-- 想保留已经下过的订单，把 DELETE FROM booking_order 这一行删掉即可
-- （hotel 的 id 是显式写死的，重跑本文件不会让历史订单的 hotel_id 失联）。
DELETE FROM booking_order;
DELETE FROM hotel;
DELETE FROM destination_attraction;
DELETE FROM destination_tag;
DELETE FROM destination;

-- 1. 成都（四川省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (1, '成都', 'CHENGDU', '美食休闲', '四川省', 4.8, 1280, '3-4 天', '3-6 月 / 9-11 月', '#F2A65A', '#E8734B', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.kWYtd52T85vk6lyqRou5mAHaFj?pid=1.7', '一座把“慢”刻进日常的城市——在人民公园喝一盏盖碗茶，去巷子里涮一顿热辣火锅，再到熊猫基地看滚滚打滚。成都的松弛感，值得专程前往。', 1);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (1, '火锅', 1), (1, '大熊猫', 2), (1, '慢生活', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (1, '大熊猫繁育研究基地', '半天', '近距离观察国宝大熊猫，建议早上前往，熊猫更活跃。', 1),
  (1, '宽窄巷子', '2-3 小时', '清代古街巷，体验老成都的茶馆文化与市井生活。', 2),
  (1, '都江堰 · 青城山', '一天', '两千余年历史的水利工程与世界文化遗产名山。', 3);

-- 2. 杭州（浙江省 · 江南水乡）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (2, '杭州', 'HANGZHOU', '江南水乡', '浙江省', 4.7, 1250, '2-3 天', '3-5 月 / 9-11 月', '#6FAE8E', '#4F8F70', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.qWwGEn3poNnSGDvfEOBKRwHaDQ?pid=1.7', '从西湖十景到龙井茶山，杭州把江南的婉约揉进了日常。春天的苏堤春晓、秋天的满陇桂雨，随便挑个周末都值得去住两天。', 2);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (2, '西湖', 1), (2, '茶山', 2), (2, '江南', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (2, '西湖风景名胜区', '半天', '环湖骑行或漫步苏堤白堤，经典十景一路串联。', 1),
  (2, '灵隐寺 · 飞来峰', '半天', '千年古刹与五代石窟造像，清晨人少更清净。', 2),
  (2, '龙井村', '2-3 小时', '茶山步道漫步，春季可体验采茶与炒茶。', 3);

-- 3. 西安（陕西省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (3, '西安', 'XIAN', '历史古迹', '陕西省', 4.7, 1380, '3 天', '3-5 月 / 9-10 月', '#CE9B6A', '#B0794E', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.uYrlzJpJd7Dt6MrMj2jDiQHaE7?pid=1.7', '十三朝古都，一步一历史。在城墙上骑行看落日，去兵马俑穿越回秦代，晚上以回民街的一碗泡馍收尾——古都的厚重与烟火气并存。', 3);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (3, '古都', 1), (3, '兵马俑', 2), (3, '美食', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (3, '秦始皇兵马俑博物馆', '半天', '世界第八大奇迹，建议提前预约讲解。', 1),
  (3, '西安城墙', '2 小时', '保存最完整的古代城垣，傍晚骑行体验最佳。', 2),
  (3, '大唐不夜城', '夜间', '灯火璀璨的唐风街区，感受盛唐夜色。', 3);

-- 4. 三亚（海南省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (4, '三亚', 'SANYA', '海岛度假', '海南省', 4.6, 2280, '4-5 天', '10 月-次年 4 月', '#58AAD1', '#3B87B5', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.IVy_n3FSBVgsnaDEswiNSAHaE8?pid=1.7', '中国最南端的热带海滨。亚龙湾的白沙滩、蜈支洲岛的潜水、后海村的日落冲浪——冬天避寒、夏天玩水，度假感直接拉满。', 4);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (4, '海岛', 1), (4, '潜水', 2), (4, '度假', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (4, '亚龙湾', '半天', '“天下第一湾”，沙白水清，适合亲子与休闲。', 1),
  (4, '蜈支洲岛', '一天', '水质极佳的潜水胜地，水上项目丰富。', 2),
  (4, '后海村', '半天', '冲浪爱好者聚集地，日落时分尤其治愈。', 3);

-- 5. 大理（云南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (5, '大理', 'DALI', '自然风光', '云南省', 4.8, 1050, '3-4 天', '3-5 月 / 11-12 月', '#7FA8D9', '#5C82B8', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.oiSYeDts7lozStuVyxD-TgHaEK?pid=1.7', '苍山洱海间的小城故事。租一辆电动车环洱海，在喜洲看稻田与白族院落，傍晚坐在古城墙下听风——大理适合所有想停下来的人。', 5);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (5, '洱海', 1), (5, '古城', 2), (5, '风花雪月', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (5, '洱海生态廊道', '半天', '骑行或自驾环海，随手一拍都是屏保。', 1),
  (5, '喜洲古镇', '2-3 小时', '白族民居与稻田风光，破酥粑粑值得一尝。', 2),
  (5, '苍山', '半天', '乘感通索道登山，俯瞰洱海全景。', 3);

-- 6. 北京（北京市 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (6, '北京', 'BEIJING', '历史古迹', '北京市', 4.9, 1680, '4 天', '4-5 月 / 9-10 月', '#C96A5E', '#A84E44', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.04DCfcfZK6E_pNMteKz3hwHaEK?pid=1.7', '红墙金瓦与胡同烟火同框。清晨看一次天安门升旗，下午钻进胡同里喝茶，傍晚登景山俯瞰故宫全景——经典与生活感可以兼得。', 6);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (6, '故宫', 1), (6, '长城', 2), (6, '胡同', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (6, '故宫博物院', '半天', '明清两代皇宫，需提前 7 天实名预约。', 1),
  (6, '八达岭长城', '半天', '“不到长城非好汉”，建议早出发避开人流。', 2),
  (6, '什刹海 · 胡同', '2-3 小时', '鼓楼一带串胡同，感受老北京的日常。', 3);

-- 7. 厦门（福建省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (7, '厦门', 'XIAMEN', '海岛度假', '福建省', 4.6, 1180, '3 天', '4-6 月 / 9-11 月', '#5FB8A5', '#3E9A87', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.bGG31Z_caTYG32T7mwVY3AHaEH?pid=1.7', '一座适合 City Walk 的海上花园。鼓浪屿的老别墅、环岛路的骑行海风、沙坡尾的文艺小店——节奏慢、风景好，怎么逛都舒服。', 7);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (7, '海滨', 1), (7, '文艺', 2), (7, 'CityWalk', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (7, '鼓浪屿', '一天', '万国建筑博览与琴岛巷弄，轮渡前往。', 1),
  (7, '环岛路', '2-3 小时', '沿海骑行绿道，一边是海一边是城。', 2),
  (7, '沙坡尾', '2 小时', '老渔港改造的文艺街区，咖啡与市集。', 3);

-- 8. 丽江（云南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (8, '丽江', 'LIJIANG', '自然风光', '云南省', 4.5, 1320, '3-4 天', '4-6 月 / 9-11 月', '#9C8FC4', '#7A6BA8', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.OtJaU0g07mYhUS0OJdPFOAHaDv?pid=1.7', '玉龙雪山下的柔软时光。白天上雪山看冰川，傍晚在四方街晒太阳，夜里听一场纳西古乐——也可以哪儿都不去，就在客栈院子里发呆。', 8);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (8, '雪山', 1), (8, '古城', 2), (8, '民宿', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (8, '玉龙雪山', '一天', '乘大索道登4506米冰川公园，记得提前订票。', 1),
  (8, '丽江古城', '半天', '世界文化遗产，小桥流水与纳西院落。', 2),
  (8, '束河古镇', '半天', '比大研古镇更安静，适合喝茶发呆。', 3);

-- 9. 广州（广东省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (9, '广州', 'GUANGZHOU', '美食休闲', '广东省', 4.6, 1100, '2-3 天', '10 月-次年 3 月', '#EBB15C', '#DE9435', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.vS-OKpXo-DCW8LihhulvSAHaFj?pid=1.7', '“食在广州”名不虚传：早茶一盅两件、街头烧腊与糖水，从西关老骑楼一路吃到珠江新城。美食之外，还有沙面的欧式街巷与夜游珠江。', 9);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (9, '早茶', 1), (9, '美食', 2), (9, '夜游珠江', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (9, '沙面岛', '2 小时', '珠江畔的欧式建筑群，适合漫步拍照。', 1),
  (9, '广州塔', '2-3 小时', '登塔俯瞰珠江夜景，城市地标。', 2),
  (9, '陈家祠', '1-2 小时', '岭南建筑艺术的巅峰，砖雕灰塑精美。', 3);

-- 10. 武汉（湖北省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (10, '武汉', 'WUHAN', '历史古迹', '湖北省', 4.6, 1080, '3 天', '3-5 月 / 9-11 月', '#E58BA8', '#C4657F', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.3qgHfDDXpp1nYcRHMj2quwHaEA?pid=1.7', '长江与汉水交汇处的“九省通衢”。登黄鹤楼看大江东去，三月去武大赴一场樱花雨，早上以一碗热干面开场、夜宵用小龙虾收尾——江湖气与烟火气都很足的江城。', 10);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (10, '黄鹤楼', 1), (10, '樱花', 2), (10, '热干面', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (10, '黄鹤楼', '2 小时', '江南三大名楼之首，登楼可俯瞰长江大桥与武汉三镇。', 1),
  (10, '武汉大学 · 东湖', '半天', '三月樱花季最美，平日的珞珈山与东湖绿道也值得慢走。', 2),
  (10, '户部巷 · 江汉路', '2-3 小时', '早点一条街与百年老建筑，热干面、豆皮、鸭脖一路吃过去。', 3);

-- 11. 长沙（湖南省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (11, '长沙', 'CHANGSHA', '美食休闲', '湖南省', 4.6, 980, '2-3 天', '3-5 月 / 9-11 月', '#D9553F', '#AE3A2A', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.qVqPnNBz7zY4YKdHNUb1-gHaE-?pid=1.7', '把辣和夜生活都拉到顶的城市。白天登岳麓山、去橘子洲头看湘江北去，晚上钻进坡子街一路吃到深夜——长沙的快乐来得很直接。', 11);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (11, '湘菜', 1), (11, '橘子洲', 2), (11, '夜生活', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (11, '橘子洲头', '2 小时', '湘江中的狭长洲岛，看青年艺术雕塑与两岸江景。', 1),
  (11, '岳麓山 · 岳麓书院', '半天', '千年学府与山林步道，秋天爱晚亭一带红叶最好看。', 2),
  (11, '坡子街 · 太平老街', '2-3 小时', '小吃与夜市集中地，臭豆腐、糖油粑粑一路尝过去。', 3);

-- 12. 南京（江苏省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (12, '南京', 'NANJING', '历史古迹', '江苏省', 4.7, 1150, '2-3 天', '3-5 月 / 10-11 月', '#B6A15E', '#8E7A3F', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.dOg9dJwc2Aogdrd_c1EtggHaE8?pid=1.7', '六朝古都，也是被梧桐树包住的城市。中山陵的长阶、明孝陵的神道、入夜后秦淮河上的桨声灯影——南京的厚重里带着一点温柔。', 12);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (12, '六朝古都', 1), (12, '梧桐', 2), (12, '秦淮河', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (12, '夫子庙 · 秦淮河', '2-3 小时', '夜游画舫看两岸灯火，江南贡院与乌衣巷都在附近。', 1),
  (12, '中山陵 · 明孝陵', '半天', '钟山风景区一线串联，秋天的石象路色彩最好。', 2),
  (12, '南京博物院', '2-3 小时', '国内三大博物馆之一，需提前预约。', 3);

-- 13. 上海（上海市 · 都市风情）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (13, '上海', 'SHANGHAI', '都市风情', '上海市', 4.8, 1580, '3-4 天', '3-5 月 / 9-11 月', '#5468A8', '#39467C', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.i5wUMb5aTFSB-TGWt-b62wHaE7?pid=1.7', '一边是外滩的万国建筑与陆家嘴的天际线，一边是武康路、安福路的梧桐街区。上海适合用 CityWalk 的方式慢慢逛，咖啡馆和小马路永远逛不完。', 13);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (13, '外滩', 1), (13, '梧桐区', 2), (13, 'CityWalk', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (13, '外滩 · 陆家嘴', '半天', '黄浦江两岸对望，亮灯后江景最好看，可乘轮渡往返。', 1),
  (13, '武康路 · 安福路', '2-3 小时', '梧桐树下的老洋房与咖啡馆，适合散步拍照。', 2),
  (13, '豫园 · 城隍庙', '2 小时', '明代园林与老城厢小吃，人多建议早去。', 3);

-- 14. 深圳（广东省 · 都市风情）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, sort_order) VALUES (14, '深圳', 'SHENZHEN', '都市风情', '广东省', 4.5, 1250, '2-3 天', '10 月-次年 4 月', '#2F9BA8', '#1C717E', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.Bp20dUqVCiv1sKaDy0GWDQHaE7?pid=1.7', '四十多年长成的一座年轻都市，高楼与海岸线挤在同一帧画面里。白天逛华侨城创意园，傍晚去深圳湾看对岸香港的灯火，夜里再上平安金融中心俯瞰全城。', 14);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (14, '天际线', 1), (14, '海滨', 2), (14, '科技感', 3);
INSERT INTO destination_attraction (destination_id, name, duration, attr_desc, sort_order) VALUES
  (14, '深圳湾公园', '2 小时', '沿海骑行与观鸟，傍晚可看对岸香港的灯火。', 1),
  (14, '平安金融中心 · 市民中心', '2-3 小时', '福田中轴线的高楼群，云际观光层可俯瞰全城。', 2),
  (14, '大鹏所城 · 西涌', '一天', '古城与海滩一线，是深圳少见的慢节奏去处。', 3);

-- =========================================================
--  酒店（「预订」功能里用户可选的住宿，共 42 家 = 14 城 × 3 家）
--
--  这段【从一开始就是手工维护的】，没有生成脚本（见文件头说明）。
--  改数据请同时改这里和 api.js 的 MOCK_HOTELS。
--
--  用描述性名称（「春熙路 · 设计民宿」）而不是真实酒店品牌名：
--  本表价格是编出来的演示数据，把它安到真实存在的酒店头上不合适。
--
--  价格是【每间每晚】，不是每人。人数对总价的影响体现在房间数上
--  （每间住 2 人，见 booking_order.rooms）。三档价位拉开距离，
--  这样「选酒店」这个动作才真的影响最后的总价。
-- =========================================================

-- 1. 成都（四川省 · 美食休闲）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (1, 1, '春熙路 · 设计民宿',   4, 420, '春熙路',   4.7, '老楼改造的小院，出门就是太古里，晚上很安静。', 1),
  (2, 1, '宽窄巷子 · 川西客栈', 3, 280, '宽窄巷子', 4.5, '青砖木梁的川西院子，早上能吃到现做的抄手。',   2),
  (3, 1, '天府广场 · 云端酒店', 5, 760, '天府广场', 4.8, '高层落地窗正对城市中轴，行政酒廊含早餐。',     3);

-- 2. 杭州（浙江省 · 江南水乡）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (4, 2, '西湖 · 湖景度假酒店', 5, 980, '西湖景区', 4.9, '推窗就是湖面，清晨沿苏堤散步五分钟可达。',   1),
  (5, 2, '龙井 · 茶山民宿',     4, 560, '龙井村',   4.7, '茶园环绕的独栋小楼，老板娘会泡自家新茶。',   2),
  (6, 2, '武林广场 · 商务酒店', 4, 480, '武林广场', 4.5, '地铁 1 号线直达，去西湖只要两站路。',        3);

-- 3. 西安（陕西省 · 历史古迹）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (7, 3, '钟楼 · 城墙景观酒店', 5, 720, '钟楼',     4.8, '房间正对城墙，夜里亮灯之后从窗边看很震撼。', 1),
  (8, 3, '回民街 · 关中客栈',   3, 300, '回民街',   4.4, '出门就是小吃街，老板会告诉你哪家泡馍地道。', 2),
  (9, 3, '大雁塔 · 唐风酒店',   4, 460, '大雁塔',   4.6, '仿唐建筑，晚上步行去不夜城只要十分钟。',     3);

-- 4. 三亚（海南省 · 海岛度假）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (10, 4, '亚龙湾 · 海景度假村', 5, 1200, '亚龙湾',   4.9, '带私家沙滩，房间阳台正对南海。',             1),
  (11, 4, '大东海 · 亲子酒店',   4,  680, '大东海',   4.6, '儿童泳池和托管服务齐全，适合带小孩来。',     2),
  (12, 4, '后海村 · 冲浪民宿',   3,  380, '后海村',   4.7, '冲浪板免费借，天台能看到日落。',             3);

-- 5. 大理（云南省 · 自然风光）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (13, 5, '洱海 · 海景客栈',     4, 560, '才村码头',   4.8, '房间正对洱海，早上有海鸥停在阳台栏杆上。', 1),
  (14, 5, '大理古城 · 白族院落', 4, 420, '古城人民路', 4.6, '三坊一照壁的白族院子，院里有棵老桂花树。', 2),
  (15, 5, '双廊 · 日出民宿',     3, 320, '双廊古镇',   4.5, '落地窗朝正东，躺在床上就能看日出。',       3);

-- 6. 北京（北京市 · 历史古迹）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (16, 6, '王府井 · 老城酒店',     5, 980, '王府井',   4.7, '步行到故宫东华门十五分钟。',                 1),
  (17, 6, '什刹海 · 胡同四合院',   4, 620, '什刹海',   4.8, '四合院改的，晚上能听见胡同里的自行车铃声。', 2),
  (18, 6, '国贸 · 高层商务酒店',   4, 580, '国贸',     4.5, '地铁 1 号线与 10 号线换乘站旁边。',          3);

-- 7. 厦门（福建省 · 海岛度假）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (19, 7, '鼓浪屿 · 老别墅酒店', 5, 860, '鼓浪屿',   4.8, '民国老别墅改造，院子里有棵百年榕树。',     1),
  (20, 7, '环岛路 · 海景民宿',   4, 520, '环岛路',   4.6, '出门就是沙滩，可以借自行车骑环岛路。',     2),
  (21, 7, '中山路 · 骑楼客栈',   3, 340, '中山路',   4.4, '骑楼老建筑，楼下就是开了几十年的沙茶面。', 3);

-- 8. 丽江（云南省 · 自然风光）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (22, 8, '大研古城 · 纳西院落', 4, 460, '大研古城', 4.7, '纳西风格三合院，不挨着酒吧街，晚上很安静。', 1),
  (23, 8, '束河 · 溪边客栈',     3, 300, '束河古镇', 4.6, '院里有溪水流过，比大研清净得多。',           2),
  (24, 8, '玉龙雪山 · 观景酒店', 5, 780, '白沙古镇', 4.8, '天气好的时候在房间里就能看到雪山主峰。',     3);

-- 9. 广州（广东省 · 美食休闲）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (25, 9, '珠江新城 · 云端酒店',   5, 780, '珠江新城', 4.7, '高层能俯瞰珠江夜景和小蛮腰。',               1),
  (26, 9, '上下九 · 西关骑楼客栈', 4, 420, '上下九',   4.5, '骑楼老宅改造，出门就是小吃一条街。',         2),
  (27, 9, '沙面 · 江畔精品酒店',   4, 520, '沙面',     4.6, '欧陆风情的老租界区，安静，也很好拍。',       3);

-- 10. 武汉（湖北省 · 历史古迹）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (28, 10, '江汉路 · 江景酒店',   5, 680, '江汉路', 4.6, '正对长江，晚上能看两岸的灯光秀。',         1),
  (29, 10, '户部巷 · 老城客栈',   3, 280, '户部巷', 4.4, '步行到黄鹤楼十分钟，楼下是热干面老店。',   2),
  (30, 10, '东湖 · 湖畔度假酒店', 4, 520, '东湖',   4.7, '临湖而建，早上可以沿着湖跑一圈。',         3);

-- 11. 长沙（湖南省 · 美食休闲）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (31, 11, '五一广场 · 设计酒店', 5, 620, '五一广场', 4.7, '地铁 1、2 号线换乘站旁边，去哪都方便。', 1),
  (32, 11, '太平街 · 老巷民宿',   3, 300, '太平街',   4.5, '老街深处的院子，晚上出门就是小吃摊。',   2),
  (33, 11, '橘子洲 · 江景酒店',   4, 460, '橘子洲',   4.6, '房间能看到湘江和橘子洲头。',             3);

-- 12. 南京（江苏省 · 历史古迹）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (34, 12, '夫子庙 · 秦淮河景酒店', 5, 680, '夫子庙',   4.7, '推窗就是秦淮河，晚上能看画舫来往。',     1),
  (35, 12, '老门东 · 明清院落客栈', 4, 440, '老门东',   4.6, '明清风格院落，青砖小瓦，出门就是老街。', 2),
  (36, 12, '新街口 · 商务酒店',     4, 400, '新街口',   4.4, '地铁 1、2 号线换乘，逛街吃饭都方便。',   3);

-- 13. 上海（上海市 · 都市风情）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (37, 13, '外滩 · 江景酒店',     5, 1100, '外滩',     4.9, '正对陆家嘴三件套，这一片窗景是上海最贵的。', 1),
  (38, 13, '武康路 · 老洋房民宿', 4,  720, '武康路',   4.8, '梧桐区老洋房改造，楼下就是武康大楼。',       2),
  (39, 13, '人民广场 · 商务酒店', 4,  600, '人民广场', 4.5, '地铁 1、2、8 号线三线换乘，去机场直达。',    3);

-- 14. 深圳（广东省 · 都市风情）
INSERT INTO hotel (id, destination_id, name, star, price_per_night, district, rating, hotel_desc, sort_order) VALUES
  (40, 14, '深圳湾 · 海景公寓酒店', 5, 860, '深圳湾',   4.7, '高层正对深圳湾，天气好能看到对岸的香港。', 1),
  (41, 14, '华侨城 · 创意园酒店',   4, 560, '华侨城',   4.6, '挨着创意园和美术馆，住的多是年轻人。',     2),
  (42, 14, '大鹏所城 · 海边民宿',   3, 380, '大鹏新区', 4.5, '古城里的院子，步行到西涌沙滩二十分钟。',   3);

-- 合计：14 个目的地、42 个标签、42 个推荐景点、42 家酒店
