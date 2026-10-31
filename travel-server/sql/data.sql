-- =========================================================
-- 游迹 · 初始数据（14 个目的地 + 标签 + 推荐景点）
--
-- 【这份数据和前端是两份】file:// 双击打开走 travel-app/js/mock-data.js，
-- 连后端走这个文件。改任何一块数据，两边都要改且逐字一致，
-- 否则两种打开方式看到的不是同一份内容。
--
-- 执行：mysql -uroot -p123456 --default-character-set=utf8mb4 travel_db < data.sql
-- =========================================================

USE travel_db;

-- 从表在前：先清子表再清主表，避免外键顺序问题
DELETE FROM destination_attraction;
DELETE FROM destination_tag;
DELETE FROM destination;

-- 1. 成都（四川省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (1, '成都', 'CHENGDU', '美食休闲', '四川省', 4.8, 1280, '3-4 天', '3-6 月 / 9-11 月', '#F2A65A', '#E8734B', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.kWYtd52T85vk6lyqRou5mAHaFj?pid=1.7', '一座把“慢”刻进日常的城市——在人民公园喝一盏盖碗茶，去巷子里涮一顿热辣火锅，再到熊猫基地看滚滚打滚。成都的松弛感，值得专程前往。', 1);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (1, '火锅', 1), (1, '大熊猫', 2), (1, '慢生活', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (1, '大熊猫繁育研究基地', '自然生态', '半天', '看熊猫最省心的一站，成年熊猫、幼崽和产房各有展区。熊猫上午最活跃，建议八点前后入园，避开中午集体午睡的时间。', 1),
  (1, '宽窄巷子', '街区市集', '2-3 小时', '由宽巷子、窄巷子、井巷子三条清代街巷组成，青砖灰瓦里塞满茶馆、采耳和小吃。适合傍晚来，坐进院子喝碗盖碗茶看人来人往。', 2),
  (1, '都江堰 · 青城山', '人文古迹', '一天', '一座用了两千多年仍在灌溉成都平原的水利工程，加上道教名山青城山。两地相隔不远，一天刚好：上午看鱼嘴分水，下午上山走一段。', 3);

-- 2. 杭州（浙江省 · 江南水乡）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (2, '杭州', 'HANGZHOU', '江南水乡', '浙江省', 4.7, 1250, '2-3 天', '3-5 月 / 9-11 月', '#6FAE8E', '#4F8F70', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.qWwGEn3poNnSGDvfEOBKRwHaDQ?pid=1.7', '从西湖十景到龙井茶山，杭州把江南的婉约揉进了日常。春天的苏堤春晓、秋天的满陇桂雨，随便挑个周末都值得去住两天。', 2);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (2, '西湖', 1), (2, '茶山', 2), (2, '江南', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (2, '西湖风景名胜区', '自然生态', '半天', '十景散在湖的四周，走路逛不完。推荐从断桥出发沿白堤到孤山，再坐船去三潭印月；清晨和雨天人最少，也最像画。', 1),
  (2, '灵隐寺 · 飞来峰', '人文古迹', '半天', '东晋古刹加五代石窟造像，飞来峰的石刻就在进寺路上，很多人只顾上香错过了。早上七点开门，人少清净，香火气也淡一些。', 2),
  (2, '龙井村', '自然生态', '2-3 小时', '西湖边上的茶山村落，春天满山采茶人。可以沿茶园步道走一圈，在农家喝一杯当季龙井，看炒茶师傅用手掌翻锅。', 3);

-- 3. 西安（陕西省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (3, '西安', 'XIAN', '历史古迹', '陕西省', 4.7, 1380, '3 天', '3-5 月 / 9-10 月', '#CE9B6A', '#B0794E', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.uYrlzJpJd7Dt6MrMj2jDiQHaE7?pid=1.7', '十三朝古都，一步一历史。在城墙上骑行看落日，去兵马俑穿越回秦代，晚上以回民街的一碗泡馍收尾——古都的厚重与烟火气并存。', 3);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (3, '古都', 1), (3, '兵马俑', 2), (3, '美食', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (3, '秦始皇兵马俑博物馆', '人文古迹', '半天', '三个坑看下来至少三小时，一号坑最震撼但人最多。建议先看三号坑和二号坑再回一号坑，动线顺、人少。需实名预约。', 1),
  (3, '西安城墙', '人文古迹', '2 小时', '明代城墙完整一圈约 13.7 公里，租辆自行车骑完要两小时。傍晚从永宁门上墙，能一路骑到日落亮灯。', 2),
  (3, '大唐不夜城', '观景夜景', '夜间', '一条仿唐风格的步行街，白天普通、夜里完全变样：灯光、街头表演、汉服人群。建议天黑后再来，从大雁塔北广场往南走。', 3);

-- 4. 三亚（海南省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (4, '三亚', 'SANYA', '海岛度假', '海南省', 4.6, 2280, '4-5 天', '10 月-次年 4 月', '#58AAD1', '#3B87B5', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.IVy_n3FSBVgsnaDEswiNSAHaE8?pid=1.7', '中国最南端的热带海滨。亚龙湾的白沙滩、蜈支洲岛的潜水、后海村的日落冲浪——冬天避寒、夏天玩水，度假感直接拉满。', 4);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (4, '海岛', 1), (4, '潜水', 2), (4, '度假', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (4, '亚龙湾', '自然生态', '半天', '三亚沙质最细的一段海湾，水清、坡缓，适合下海。酒店多集中在湾内，公共沙滩入口有限，建议早点去占位置。', 1),
  (4, '蜈支洲岛', '自然生态', '一天', '需要坐船上岛，浮潜和海上项目集中在这里。上岛要趁早，十点后码头排队很长；岛上餐饮偏贵，可以自带水和零食。', 2),
  (4, '后海村', '自然生态', '半天', '冲浪爱好者的聚集地，浪小、适合新手，村里到处是板店和咖啡馆。傍晚坐在沙滩看冲浪的人，比景区自在。', 3);

-- 5. 大理（云南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (5, '大理', 'DALI', '自然风光', '云南省', 4.8, 1050, '3-4 天', '3-5 月 / 11-12 月', '#7FA8D9', '#5C82B8', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.oiSYeDts7lozStuVyxD-TgHaEK?pid=1.7', '苍山洱海间的小城故事。租一辆电动车环洱海，在喜洲看稻田与白族院落，傍晚坐在古城墙下听风——大理适合所有想停下来的人。', 5);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (5, '洱海', 1), (5, '古城', 2), (5, '风花雪月', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (5, '洱海生态廊道', '自然生态', '半天', '沿洱海修的骑行步道，全程几十公里，最热门的是才村到喜洲一段。租电动车或自行车，随时停下来拍照，日落时最好看。', 1),
  (5, '喜洲古镇', '人文古迹', '2-3 小时', '白族民居保存得最完整的地方，严家大院可以看三坊一照壁的格局。镇外的稻田随季节变色，配着老墙很好拍。', 2),
  (5, '苍山', '自然生态', '半天', '十九峰横在洱海西侧，索道有三条，感通索道最省力。山上温差大，夏天也要带件外套；云雾天看不到洱海全景。', 3);

-- 6. 北京（北京市 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (6, '北京', 'BEIJING', '历史古迹', '北京市', 4.9, 1680, '4 天', '4-5 月 / 9-10 月', '#C96A5E', '#A84E44', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.04DCfcfZK6E_pNMteKz3hwHaEK?pid=1.7', '红墙金瓦与胡同烟火同框。清晨看一次天安门升旗，下午钻进胡同里喝茶，傍晚登景山俯瞰故宫全景——经典与生活感可以兼得。', 6);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (6, '故宫', 1), (6, '长城', 2), (6, '胡同', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (6, '故宫博物院', '人文古迹', '半天', '明清两代皇宫，中轴线走马观花也要三小时。热门时段人极多，建议午门进、神武门出，先看东西六宫再回中轴。需提前七天实名预约。', 1),
  (6, '八达岭长城', '人文古迹', '半天', '最经典也最方便的一段，索道和滑车都能上。想避开人流就往北八楼方向走，早上八点前到，城墙上看不到几个人。', 2),
  (6, '什刹海 · 胡同', '街区市集', '2-3 小时', '前海后海连成一片，岸边是酒吧和胡同院落。可以坐三轮车逛胡同，也可以自己钻进去看门墩和影壁，傍晚最热闹。', 3);

-- 7. 厦门（福建省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (7, '厦门', 'XIAMEN', '海岛度假', '福建省', 4.6, 1180, '3 天', '4-6 月 / 9-11 月', '#5FB8A5', '#3E9A87', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.bGG31Z_caTYG32T7mwVY3AHaEH?pid=1.7', '一座适合 City Walk 的海上花园。鼓浪屿的老别墅、环岛路的骑行海风、沙坡尾的文艺小店——节奏慢、风景好，怎么逛都舒服。', 7);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (7, '海滨', 1), (7, '文艺', 2), (7, 'CityWalk', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (7, '鼓浪屿', '人文古迹', '一天', '岛上不通汽车，全靠步行。老别墅、钢琴博物馆和海边小路是重点，别只走龙头路商业街。船票要提前买，节假日一票难求。', 1),
  (7, '环岛路', '自然生态', '2-3 小时', '沿海公路，骑车或跑步都合适，从白城沙滩到会展中心一段风景最好。清晨和傍晚人少，中午晒得厉害。', 2),
  (7, '沙坡尾', '街区市集', '2 小时', '老渔港改造的街区，避风坞里停着小船，周边是咖啡馆和设计小店。适合慢慢逛，傍晚在岸边看日落。', 3);

-- 8. 丽江（云南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (8, '丽江', 'LIJIANG', '自然风光', '云南省', 4.5, 1320, '3-4 天', '4-6 月 / 9-11 月', '#9C8FC4', '#7A6BA8', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.OtJaU0g07mYhUS0OJdPFOAHaDv?pid=1.7', '玉龙雪山下的柔软时光。白天上雪山看冰川，傍晚在四方街晒太阳，夜里听一场纳西古乐——也可以哪儿都不去，就在客栈院子里发呆。', 8);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (8, '雪山', 1), (8, '古城', 2), (8, '民宿', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (8, '玉龙雪山', '自然生态', '一天', '海拔 4500 米以上的冰川公园，索道直达。上山前别剧烈运动，氧气瓶在山下买更便宜；下午云雾多，尽量上午上。', 1),
  (8, '丽江古城', '人文古迹', '半天', '纳西族的老城，水系穿街过巷。白天游客多，清晨七八点的石板路没人，才是它本来的样子。住宿建议选古城边缘，安静。', 2),
  (8, '束河古镇', '人文古迹', '半天', '比丽江古城小一半，也安静一半。青龙桥、四方街和溪边的院子值得慢走，商业化程度低一些，适合住一晚。', 3);

-- 9. 广州（广东省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (9, '广州', 'GUANGZHOU', '美食休闲', '广东省', 4.6, 1100, '2-3 天', '10 月-次年 3 月', '#EBB15C', '#DE9435', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.vS-OKpXo-DCW8LihhulvSAHaFj?pid=1.7', '“食在广州”名不虚传：早茶一盅两件、街头烧腊与糖水，从西关老骑楼一路吃到珠江新城。美食之外，还有沙面的欧式街巷与夜游珠江。', 9);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (9, '早茶', 1), (9, '美食', 2), (9, '夜游珠江', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (9, '沙面岛', '人文古迹', '2 小时', '珠江边的沙洲，保留着一百多栋欧式建筑，现在多是咖啡馆和领事馆旧址。适合散步拍照，一小时能走完。', 1),
  (9, '广州塔', '观景夜景', '2-3 小时', '俗称小蛮腰，登塔看珠江两岸。摩天轮和观景台分开售票，日落后一小时上塔，能看到白天转夜景的整个过程。', 2),
  (9, '陈家祠', '人文古迹', '1-2 小时', '清末陈氏宗族的合族祠，木雕、砖雕、陶塑密集到夸张，是岭南建筑工艺的集大成。一小时能看完，适合雨天。', 3);

-- 10. 武汉（湖北省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (10, '武汉', 'WUHAN', '历史古迹', '湖北省', 4.6, 1080, '3 天', '3-5 月 / 9-11 月', '#E58BA8', '#C4657F', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.3qgHfDDXpp1nYcRHMj2quwHaEA?pid=1.7', '长江与汉水交汇处的“九省通衢”。登黄鹤楼看大江东去，三月去武大赴一场樱花雨，早上以一碗热干面开场、夜宵用小龙虾收尾——江湖气与烟火气都很足的江城。', 10);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (10, '黄鹤楼', 1), (10, '樱花', 2), (10, '热干面', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (10, '黄鹤楼', '人文古迹', '2 小时', '江南三大名楼之一，现楼是 1985 年重建的。登顶能看长江大桥和武汉三镇，傍晚光线最好；楼内展览一般，重点在视野。', 1),
  (10, '武汉大学 · 东湖', '自然生态', '半天', '武大老斋舍和樱花道在春天最出名，平时也值得走。东湖绿道可以骑车绕湖，一圈下来半天就没了。', 2),
  (10, '户部巷 · 江汉路', '街区市集', '2-3 小时', '两条街连着逛：户部巷吃热干面、豆皮，江汉路看近代建筑。早上来吃早点最地道，晚上来是另一副样子。', 3);

-- 11. 长沙（湖南省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (11, '长沙', 'CHANGSHA', '美食休闲', '湖南省', 4.6, 980, '2-3 天', '3-5 月 / 9-11 月', '#D9553F', '#AE3A2A', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.qVqPnNBz7zY4YKdHNUb1-gHaE-?pid=1.7', '把辣和夜生活都拉到顶的城市。白天登岳麓山、去橘子洲头看湘江北去，晚上钻进坡子街一路吃到深夜——长沙的快乐来得很直接。', 11);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (11, '湘菜', 1), (11, '橘子洲', 2), (11, '夜生活', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (11, '橘子洲头', '自然生态', '2 小时', '湘江中间的沙洲，尽头是青年毛泽东雕像。建议坐地铁到洲头，沿江走一圈，周末晚上有焰火。', 1),
  (11, '岳麓山 · 岳麓书院', '人文古迹', '半天', '书院是中国古代四大书院之一，讲堂、御书楼都还在。上山可以坐索道，下来走爱晚亭一线，秋天枫叶最好。', 2),
  (11, '坡子街 · 太平老街', '街区市集', '2-3 小时', '长沙小吃最密集的一片，臭豆腐、糖油粑粑、口味虾都在附近。晚上八点后最热闹，也最挤。', 3);

-- 12. 南京（江苏省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (12, '南京', 'NANJING', '历史古迹', '江苏省', 4.7, 1150, '2-3 天', '3-5 月 / 10-11 月', '#B6A15E', '#8E7A3F', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.dOg9dJwc2Aogdrd_c1EtggHaE8?pid=1.7', '六朝古都，也是被梧桐树包住的城市。中山陵的长阶、明孝陵的神道、入夜后秦淮河上的桨声灯影——南京的厚重里带着一点温柔。', 12);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (12, '六朝古都', 1), (12, '梧桐', 2), (12, '秦淮河', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (12, '夫子庙 · 秦淮河', '街区市集', '2-3 小时', '夫子庙、贡院和秦淮河连在一起，夜里画舫灯船最有氛围。商业味重，想安静就早上来，看本地人在河边晨练。', 1),
  (12, '中山陵 · 明孝陵', '人文古迹', '半天', '中山陵免费但需预约，392 级台阶爬上去能俯瞰南京。明孝陵的石象路秋天最好，两处之间可以坐摆渡车。', 2),
  (12, '南京博物院', '人文古迹', '2-3 小时', '馆藏从史前到民国，民国馆整条街复原得很有意思。免费不免票，提前在公众号预约，至少留三小时。', 3);

-- 13. 上海（上海市 · 都市风情）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (13, '上海', 'SHANGHAI', '都市风情', '上海市', 4.8, 1580, '3-4 天', '3-5 月 / 9-11 月', '#5468A8', '#39467C', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.i5wUMb5aTFSB-TGWt-b62wHaE7?pid=1.7', '一边是外滩的万国建筑与陆家嘴的天际线，一边是武康路、安福路的梧桐街区。上海适合用 CityWalk 的方式慢慢逛，咖啡馆和小马路永远逛不完。', 13);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (13, '外滩', 1), (13, '梧桐区', 2), (13, 'CityWalk', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (13, '外滩 · 陆家嘴', '观景夜景', '半天', '黄浦江两侧对望：西岸万国建筑，东岸摩天楼。傍晚坐轮渡过江最划算，两块钱看两岸亮灯。', 1),
  (13, '武康路 · 安福路', '街区市集', '2-3 小时', '梧桐树下的老洋房街区，咖啡馆、买手店和网红建筑密集。适合下午慢慢走，周末人多到需要排队。', 2),
  (13, '豫园 · 城隍庙', '人文古迹', '2 小时', '明代园林加庙市，豫园本身要门票，外面一圈小吃街免费但很挤。想看园林就早上开园时进，避开人流。', 3);

-- 14. 深圳（广东省 · 都市风情）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (14, '深圳', 'SHENZHEN', '都市风情', '广东省', 4.5, 1250, '2-3 天', '10 月-次年 4 月', '#2F9BA8', '#1C717E', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.Bp20dUqVCiv1sKaDy0GWDQHaE7?pid=1.7', '四十多年长成的一座年轻都市，高楼与海岸线挤在同一帧画面里。白天逛华侨城创意园，傍晚去深圳湾看对岸香港的灯火，夜里再上平安金融中心俯瞰全城。', 14);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (14, '天际线', 1), (14, '海滨', 2), (14, '科技感', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (14, '深圳湾公园', '自然生态', '2 小时', '红树林海岸线，沿海骑行道一直通到蛇口。冬天有候鸟，傍晚能看对岸香港的灯火，适合跑步和放空。', 1),
  (14, '平安金融中心 · 市民中心', '观景夜景', '2-3 小时', '福田中轴线的高楼群，平安金融中心云际观光层可俯瞰全城。日落前上去，能看到城市从白天切到夜晚。', 2),
  (14, '大鹏所城 · 西涌', '人文古迹', '一天', '明代海防古城加深圳最长的沙滩，一天刚好。古城里巷子安静，西涌适合下水，交通靠自驾或包车。', 3);

-- =========================================================
--  酒店（「预订」功能里用户可选的住宿，共 42 家 = 14 城 × 3 家）
--
--  这段【从一开始就是手工维护的】，没有生成脚本（见文件头说明）。
--
--  用描述性名称（「春熙路 · 设计民宿」）而不是真实酒店品牌名：
--  本表价格是编出来的演示数据，把它安到真实存在的酒店头上不合适。
--
--  价格是【每间每晚】，不是每人。人数对总价的影响体现在房间数上
--  （每间住 2 人，见 booking_order.rooms）。三档价位拉开距离，
--  这样「选酒店」这个动作才真的影响最后的总价。
-- =========================================================

-- 1. 成都（四川省 · 美食休闲）

-- 2. 杭州（浙江省 · 江南水乡）

-- 3. 西安（陕西省 · 历史古迹）

-- 4. 三亚（海南省 · 海岛度假）

-- 5. 大理（云南省 · 自然风光）

-- 6. 北京（北京市 · 历史古迹）

-- 7. 厦门（福建省 · 海岛度假）

-- 8. 丽江（云南省 · 自然风光）

-- 9. 广州（广东省 · 美食休闲）

-- 10. 武汉（湖北省 · 历史古迹）

-- 11. 长沙（湖南省 · 美食休闲）

-- 12. 南京（江苏省 · 历史古迹）

-- 13. 上海（上海市 · 都市风情）

-- 14. 深圳（广东省 · 都市风情）

-- 合计：14 个目的地、42 个标签、42 个推荐景点、42 家酒店

-- 15. 重庆（重庆市 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (15, '重庆', 'CHONGQING', '美食休闲', '重庆市', 4.7, 1180, '3 天', '3-5 月 / 9-11 月', '#E8734B', '#B8451F', 'img/destinations/chongqing.jpg', '立体到有点魔幻的山城：轻轨从居民楼里穿过，洪崖洞的灯一亮像动画，长江索道横跨江面。火锅和小面是日常，爬坡上坎是运动。', '洪崖洞', '吊脚楼式的建筑群沿江叠了十一层，晚上亮灯后整面崖壁都是暖黄色。建议从顶层往下走，一路是小吃和观景平台；拍全景最好的位置在千厮门大桥上，傍晚六点前上去能占到机位。', 93, 15);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (15, '火锅', 1), (15, '山城', 2), (15, '夜景', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (15, '洪崖洞', '街区市集', '2 小时', '吊脚楼建筑群，夜里亮灯最出片，从顶层往下逛不累。', 1),
  (15, '李子坝轻轨站', '街区市集', '1 小时', '轻轨从居民楼里穿过去，观景台在马路对面，等两趟就能拍到。', 2),
  (15, '磁器口古镇', '人文古迹', '半天', '嘉陵江边的老码头，往巷子深处走人少，麻花铺子排长队的未必最好。', 3);

-- 16. 桂林（广西壮族自治区 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (16, '桂林', 'GUILIN', '自然风光', '广西壮族自治区', 4.6, 1320, '3 天', '4-10 月', '#6FAE8E', '#3F7D68', 'img/destinations/guilin.jpg', '喀斯特山水甲天下：漓江竹筏、阳朔田园、遇龙河的稻田与峰林，随手一拍都是水墨画。', '漓江 · 兴坪段', '桂林山水的精华就在杨堤到兴坪这一段，二十元人民币背面的取景地也在其中。竹筏漂流约两小时，早上雾气未散时最好看；旺季要提前订筏，雨后的水色偏黄，晴天倒影最清。', 86, 16);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (16, '山水', 1), (16, '竹筏', 2), (16, '阳朔', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (16, '漓江 · 兴坪', '自然生态', '半天', '竹筏漂流的经典段，二十元背景取景地就在兴坪。', 1),
  (16, '遇龙河', '自然生态', '半天', '比漓江安静的支流，竹筏慢漂，两岸是稻田和峰林。', 2),
  (16, '西街', '街区市集', '2 小时', '阳朔的老街，白天清净晚上热闹，酒吧和啤酒鱼都集中在这。', 3);

-- 17. 苏州（江苏省 · 江南水乡）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (17, '苏州', 'SUZHOU', '江南水乡', '江苏省', 4.7, 1080, '2-3 天', '3-5 月 / 9-11 月', '#8FB8A8', '#5E8F7E', 'img/destinations/suzhou.jpg', '园林与评弹组成的江南：拙政园一步一景，平江路的巷子适合慢慢走，晚上听一段昆曲就更完整了。', '拙政园', '四大名园之首，水面占了三分之一，四季各有看头。建议开园就进，人少光线也软；从东园进、西园出，走完约两小时。旺季需提前预约，园内的借景与框景值得停下来细看。', 85, 17);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (17, '园林', 1), (17, '评弹', 2), (17, '水乡', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (17, '拙政园', '人文古迹', '2 小时', '四大名园之首，水面与亭台的借景是精华，开园时人最少。', 1),
  (17, '平江路', '街区市集', '2 小时', '沿河的青石板老街，评弹馆和小吃藏在巷子深处。', 2),
  (17, '苏州博物馆', '人文古迹', '2 小时', '贝聿铭设计的收官之作，白墙灰瓦配几何光影，需提前预约。', 3);

-- 18. 青岛（山东省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (18, '青岛', 'QINGDAO', '海岛度假', '山东省', 4.6, 1260, '3 天', '5-10 月', '#7FB6D9', '#4A83AB', 'img/destinations/qingdao.jpg', '红瓦绿树、碧海蓝天：老城区的德式建筑、八大关的梧桐、夏天配一袋散装啤酒，是北方最舒服的海边城市。', '八大关', '十条以关隘命名的路，两侧是各国风格的老别墅，春天樱花、秋天银杏。走到花石楼就能下到第二海水浴场；建议下午四点后去，光斜着穿过梧桐最好看，人也不多。', 84, 18);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (18, '海滨', 1), (18, '老建筑', 2), (18, '啤酒', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (18, '八大关', '人文古迹', '半天', '各国风格别墅群，春樱秋杏，走到海边只要十分钟。', 1),
  (18, '栈桥', '观景夜景', '2 小时', '老青岛的象征，尽头回望老城红瓦，冬天有成群海鸥。', 2),
  (18, '崂山', '自然生态', '一天', '海上第一名山，仰口看海、巨峰看日出，山与海同框。', 3);

-- 19. 张家界（湖南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (19, '张家界', 'ZHANGJIAJIE', '自然风光', '湖南省', 4.7, 1420, '3-4 天', '4-10 月', '#7FA87F', '#4E7A4E', 'img/destinations/zhangjiajie.jpg', '石英砂岩峰林拔地而起，云雾一起就像悬浮的山，也是电影取景地。爬山强度大，但风景值回票价。', '张家界国家森林公园', '三千多座石峰组成的峰林，电影里悬浮山的原型。袁家界的哈利路亚山、天子山的观景台是必看，索道和百龙天梯能省不少体力。雨后云雾最出片，但栈道会滑，鞋一定要防滑。', 87, 19);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (19, '峰林', 1), (19, '云雾', 2), (19, '徒步', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (19, '张家界国家森林公园', '自然生态', '一天', '袁家界与天子山的峰林，云雾天像悬浮山，门票四天有效。', 1),
  (19, '天门山', '自然生态', '一天', '玻璃栈道与九十九道弯盘山路，索道从市区直接上山。', 2),
  (19, '凤凰古城', '人文古迹', '一天', '沱江边的吊脚楼，夜里灯一亮就是沈从文笔下的样子。', 3);

-- 20. 敦煌（甘肃省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (20, '敦煌', 'DUNHUANG', '历史古迹', '甘肃省', 4.8, 1560, '3 天', '5-10 月', '#D9A566', '#A87338', 'img/destinations/dunhuang.jpg', '戈壁上的千年佛国：莫高窟的壁画、鸣沙山的落日、夜市里的杏皮水，一次把历史与荒漠都看了。', '莫高窟', '七百多个洞窟保存着四世纪到十四世纪的壁画与彩塑。每个讲解员带看八个洞窟，随机分配，能看到哪些全凭运气。旺季需提前一个月在官网预约，洞窟内禁止拍照，光线是讲解员用手电打出来的。', 89, 20);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (20, '壁画', 1), (20, '戈壁', 2), (20, '丝路', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (20, '莫高窟', '人文古迹', '半天', '千年壁画与彩塑，需提前预约，每批只能看八个洞窟。', 1),
  (20, '鸣沙山 · 月牙泉', '自然生态', '半天', '沙山环抱一弯泉水，傍晚骑骆驼看落日，起风时沙子会响。', 2),
  (20, '敦煌夜市', '街区市集', '2 小时', '杏皮水、驴肉黄面、胡杨木雕，晚上十点最热闹。', 3);

-- 1. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (1, '人民公园', '街区市集', '2 小时', '鹤鸣茶社喝盖碗茶、看采耳，成都人晒太阳的地方，周末最热闹。', 4),
  (1, '春熙路 · 太古里', '街区市集', '2 小时', 'IFS 熊猫打卡、太古里逛街，晚上灯光和街拍最好看。', 5);

-- 2. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (2, '河坊街', '街区市集', '2 小时', '南宋御街一带，小吃和手作铺子集中，晚上灯笼亮起更热闹。', 4),
  (2, '西溪湿地', '自然生态', '半天', '芦苇与水巷交错的湿地，坐船比走路更能看到深处。', 5);

-- 3. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (3, '回民街', '街区市集', '2 小时', '泡馍、肉夹馍、甑糕一条街，往里走到洒金桥更本地。', 4),
  (3, '陕西历史博物馆', '人文古迹', '半天', '从周秦汉唐一路看下来，何家村窖藏是重点，需提前预约。', 5);

-- 4. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (4, '第一市场', '街区市集', '2 小时', '买海鲜找店加工，晚上最热闹，记得先问价再称重。', 4),
  (4, '天涯海角', '自然生态', '半天', '两块刻字巨石和一段海岸线，日落时人少一些。', 5);

-- 5. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (5, '大理古城', '街区市集', '2 小时', '五华楼与洋人街，白天逛小店，晚上酒吧街热闹。', 4),
  (5, '崇圣寺三塔', '人文古迹', '2 小时', '三塔倒影是大理的标志，公园里的倒影池角度最好。', 5);

-- 6. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (6, '天坛公园', '人文古迹', '半天', '祈年殿与回音壁，清晨能撞见本地人晨练、唱戏。', 4),
  (6, '南锣鼓巷', '街区市集', '2 小时', '胡同商业街，往两边支巷走人少，更有生活气。', 5);

-- 7. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (7, '曾厝垵', '街区市集', '2 小时', '小吃与民宿集中的村子，晚上灯串一亮全是吃的。', 4),
  (7, '南普陀寺', '人文古迹', '2 小时', '背靠五老峰，素饼有名，爬到后山能俯瞰厦大。', 5);

-- 8. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (8, '拉市海', '自然生态', '半天', '湿地与候鸟，骑马划船的集散地，认准正规马场。', 4),
  (8, '束河四方街', '街区市集', '2 小时', '溪边喝茶听纳西古乐，比大研古城安静很多。', 5);

-- 9. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (9, '北京路', '街区市集', '2 小时', '千年古道遗址就在脚下，骑楼与小吃街混在一起。', 4),
  (9, '越秀公园', '自然生态', '2 小时', '五羊石像是广州城徽，镇海楼里是广州博物馆。', 5);

-- 10. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (10, '江汉路步行街', '街区市集', '2 小时', '近代建筑群与老字号，晚上灯光亮起来最好看。', 4),
  (10, '湖北省博物馆', '人文古迹', '半天', '曾侯乙编钟与越王勾践剑，免费但需提前预约。', 5);

-- 11. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (11, '爱晚亭 · 岳麓山南门', '自然生态', '2 小时', '秋天枫叶最盛，从南门上到爱晚亭约一小时。', 4),
  (11, '文和友', '街区市集', '2 小时', '复古市井场景配小龙虾，排队要趁早取号。', 5);

-- 12. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (12, '总统府', '人文古迹', '2 小时', '从两江总督署到民国政府，园林与办公旧址并存。', 4),
  (12, '老门东', '街区市集', '2 小时', '青砖小巷与先锋书店分店，晚上灯串亮起很出片。', 5);

-- 13. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (13, '田子坊', '街区市集', '2 小时', '石库门弄堂里的手作店，巷子窄、人多，工作日更舒服。', 4),
  (13, '上海博物馆', '人文古迹', '半天', '青铜与陶瓷馆是强项，免费但需预约，至少留两小时。', 5);

-- 14. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (14, '华侨城创意园', '街区市集', '2 小时', '旧厂房改造的艺术区，咖啡、展览和二手书店。', 4),
  (14, '深圳湾日落', '观景夜景', '1 小时', '人才公园一带看日落，对岸就是香港，风大记得带外套。', 5);

-- 15. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (15, '解放碑', '街区市集', '2 小时', '重庆的地标商圈，晚上人最多，周边小吃密集。', 4),
  (15, '长江索道', '观景夜景', '1 小时', '横跨长江的空中巴士，从南岸往北岸坐人少一些。', 5);

-- 16. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (16, '象鼻山', '自然生态', '2 小时', '桂林城徽，江边看象鼻吸水，清晨有雾时最好看。', 4),
  (16, '东西巷', '街区市集', '2 小时', '靖江王府旁的老街，晚上灯笼亮起，小吃集中。', 5);

-- 17. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (17, '虎丘', '人文古迹', '半天', '斜塔与剑池，苏东坡说"到苏州不游虎丘乃憾事"。', 4),
  (17, '七里山塘', '街区市集', '2 小时', '沿河的老街，夜里灯笼与画舫，坐船看更完整。', 5);

-- 18. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (18, '青岛啤酒博物馆', '人文古迹', '2 小时', '百年厂房里看酿造流程，门票含两杯原浆，别开车。', 4),
  (18, '天主教堂', '人文古迹', '1 小时', '哥特式双塔，教堂前广场是拍婚纱的聚集地。', 5);

-- 19. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (19, '十里画廊', '自然生态', '半天', '小火车穿行峰林，走路单程约一小时，风景在路上。', 4),
  (19, '黄龙洞', '自然生态', '半天', '溶洞里的石笋与地下河，洞内恒温，夏天很凉快。', 5);

-- 20. 补充景点（第 4、5 个）
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (20, '玉门关', '人文古迹', '半天', '"春风不度玉门关"的汉代关隘，戈壁风大，帽子要拿稳。', 4),
  (20, '沙洲夜市', '街区市集', '2 小时', '烤肉、杏皮水与手工艺品，晚上十点最热闹。', 5);

-- 21. 洛阳（河南省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (21, '洛阳', 'LUOYANG', '历史古迹', '河南省', 4.7, 1100, '3 天', '4-5 月 / 9-10 月', '#C9A227', '#93761A', 'img/destinations/luoyang.jpg', '十三朝古都：伊河两岸的佛龛、白马寺的钟声、四月满城的牡丹，还有一碗牛肉汤配饼的早晨。', '龙门石窟', '伊河两岸的崖壁上凿了十万余尊佛像，奉先寺的卢舍那大佛高十七米，是唐代造像的巅峰。建议北门进、南门出，走完约三小时；四月牡丹花季人最多，清晨开园时最安静。', 85, 21);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (21, '古都', 1), (21, '石窟', 2), (21, '牡丹', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (21, '龙门石窟', '人文古迹', '半天', '伊河两岸十万余尊造像，卢舍那大佛是精华，建议北门进。', 1),
  (21, '白马寺', '人文古迹', '半天', '中国第一座官办佛寺，齐云塔院和异国佛殿都值得走一圈。', 2),
  (21, '洛阳老城 · 十字街', '街区市集', '2 小时', '晚上的小吃一条街，水席和不翻汤值得一试。', 3),
  (21, '洛阳博物馆', '人文古迹', '2 小时', '唐三彩与石刻馆是强项，免费但需提前预约。', 4),
  (21, '隋唐洛阳城 · 明堂天堂', '观景夜景', '2 小时', '复原的唐代宫城建筑，夜里亮灯后很有盛唐气象。', 5);

-- 22. 开封（河南省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (22, '开封', 'KAIFENG', '历史古迹', '河南省', 4.5, 900, '2 天', '3-5 月 / 9-11 月', '#C58B58', '#8D5A32', 'img/destinations/kaifeng.jpg', '北宋汴京的旧地：清明上河园把画里的市井搬了出来，鼓楼夜市从傍晚一直吃到深夜。', '清明上河园', '按《清明上河图》复原的宋文化园区，虹桥、汴河、勾栏瓦舍都在。白天有包公巡街、王员外招婿这类实景演出，晚上是《大宋·东京梦华》水上实景剧。建议下午进园，一直待到夜场。', 80, 22);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (22, '宋韵', 1), (22, '夜市', 2), (22, '实景演出', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (22, '清明上河园', '人文古迹', '一天', '按《清明上河图》复原，白天看演出、晚上看水上实景剧。', 1),
  (22, '龙亭公园', '人文古迹', '2 小时', '宋代皇宫遗址上的高台，两侧潘杨二湖，秋天有菊花展。', 2),
  (22, '开封府', '人文古迹', '2 小时', '包公断案的地方，每天上午有仿古开衙仪式。', 3),
  (22, '鼓楼夜市', '街区市集', '2 小时', '灌汤包、炒凉粉、杏仁茶，晚上七点后最热闹。', 4),
  (22, '大相国寺', '人文古迹', '1-2 小时', '千年皇家寺院，千手千眼观音由整块银杏木雕成。', 5);

-- 23. 威海（山东省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (23, '威海', 'WEIHAI', '海岛度假', '山东省', 4.6, 1150, '3 天', '5-10 月', '#6FB6C9', '#3D7E93', 'img/destinations/weihai.jpg', '山东半岛最东端：海岸线干净、人比青岛少，成山头的日出、刘公岛的历史、海鲜市场的实惠都在这。', '成山头', '中国大陆海岸线最东端，被称作"天尽头"，是看日出的绝佳位置。夏天日出在四点五十左右，景区门口就有观景台；海边风大浪急，栈道注意安全，冬天有成群天鹅飞来。', 79, 23);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (23, '海岸线', 1), (23, '日出', 2), (23, '海鲜', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (23, '成山头', '自然生态', '半天', '海岸线最东端，看日出最佳，夏天约四点五十。', 1),
  (23, '刘公岛', '人文古迹', '半天', '甲午战争纪念地，坐船上岛，岛上还有森林公园。', 2),
  (23, '那香海 · 海水浴场', '自然生态', '半天', '沙质细、人比青岛少，夏天适合下海。', 3),
  (23, '华夏城', '人文古迹', '半天', '废弃矿坑改成的山水园区，晚上有实景演出。', 4),
  (23, '威海海鲜市场', '街区市集', '2 小时', '买了就近找店加工，价格比景区便宜不少。', 5);
