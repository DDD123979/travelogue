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
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (1, '成都', 'CHENGDU', '美食休闲', '四川省', 4.8, 1280, '3-4 天', '3-6 月 / 9-11 月', '#F2A65A', '#E8734B', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.kWYtd52T85vk6lyqRou5mAHaFj?pid=1.7', '一座把“慢”刻进日常的城市——在人民公园喝一盏盖碗茶，去巷子里涮一顿热辣火锅，再到熊猫基地看滚滚打滚。成都的松弛感，值得专程前往。', 1);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (1, '火锅', 1), (1, '大熊猫', 2), (1, '慢生活', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (1, '大熊猫繁育研究基地', '自然生态', '半天', '看熊猫最省心的一站，成年熊猫、幼崽和产房各有展区。熊猫上午最活跃，建议八点前后入园，避开中午集体午睡的时间。', 1),
  (1, '宽窄巷子', '街区市集', '2-3 小时', '由宽巷子、窄巷子、井巷子三条清代街巷组成，青砖灰瓦里塞满茶馆、采耳和小吃。适合傍晚来，坐进院子喝碗盖碗茶看人来人往。', 2),
  (1, '都江堰 · 青城山', '人文古迹', '一天', '一座用了两千多年仍在灌溉成都平原的水利工程，加上道教名山青城山。两地相隔不远，一天刚好：上午看鱼嘴分水，下午上山走一段。', 3);

-- 2. 杭州（浙江省 · 江南水乡）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (2, '杭州', 'HANGZHOU', '江南水乡', '浙江省', 4.7, 1250, '2-3 天', '3-5 月 / 9-11 月', '#6FAE8E', '#4F8F70', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.qWwGEn3poNnSGDvfEOBKRwHaDQ?pid=1.7', '从西湖十景到龙井茶山，杭州把江南的婉约揉进了日常。春天的苏堤春晓、秋天的满陇桂雨，随便挑个周末都值得去住两天。', 2);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (2, '西湖', 1), (2, '茶山', 2), (2, '江南', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (2, '西湖风景名胜区', '自然生态', '半天', '十景散在湖的四周，走路逛不完。推荐从断桥出发沿白堤到孤山，再坐船去三潭印月；清晨和雨天人最少，也最像画。', 1),
  (2, '灵隐寺 · 飞来峰', '人文古迹', '半天', '东晋古刹加五代石窟造像，飞来峰的石刻就在进寺路上，很多人只顾上香错过了。早上七点开门，人少清净，香火气也淡一些。', 2),
  (2, '龙井村', '自然生态', '2-3 小时', '西湖边上的茶山村落，春天满山采茶人。可以沿茶园步道走一圈，在农家喝一杯当季龙井，看炒茶师傅用手掌翻锅。', 3);

-- 3. 西安（陕西省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (3, '西安', 'XIAN', '历史古迹', '陕西省', 4.7, 1380, '3 天', '3-5 月 / 9-10 月', '#CE9B6A', '#B0794E', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.uYrlzJpJd7Dt6MrMj2jDiQHaE7?pid=1.7', '十三朝古都，一步一历史。在城墙上骑行看落日，去兵马俑穿越回秦代，晚上以回民街的一碗泡馍收尾——古都的厚重与烟火气并存。', 3);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (3, '古都', 1), (3, '兵马俑', 2), (3, '美食', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (3, '秦始皇兵马俑博物馆', '人文古迹', '半天', '三个坑看下来至少三小时，一号坑最震撼但人最多。建议先看三号坑和二号坑再回一号坑，动线顺、人少。需实名预约。', 1),
  (3, '西安城墙', '人文古迹', '2 小时', '明代城墙完整一圈约 13.7 公里，租辆自行车骑完要两小时。傍晚从永宁门上墙，能一路骑到日落亮灯。', 2),
  (3, '大唐不夜城', '观景夜景', '夜间', '一条仿唐风格的步行街，白天普通、夜里完全变样：灯光、街头表演、汉服人群。建议天黑后再来，从大雁塔北广场往南走。', 3);

-- 4. 三亚（海南省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (4, '三亚', 'SANYA', '海岛度假', '海南省', 4.6, 2280, '4-5 天', '10 月-次年 4 月', '#58AAD1', '#3B87B5', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.IVy_n3FSBVgsnaDEswiNSAHaE8?pid=1.7', '中国最南端的热带海滨。亚龙湾的白沙滩、蜈支洲岛的潜水、后海村的日落冲浪——冬天避寒、夏天玩水，度假感直接拉满。', 4);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (4, '海岛', 1), (4, '潜水', 2), (4, '度假', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (4, '亚龙湾', '自然生态', '半天', '三亚沙质最细的一段海湾，水清、坡缓，适合下海。酒店多集中在湾内，公共沙滩入口有限，建议早点去占位置。', 1),
  (4, '蜈支洲岛', '自然生态', '一天', '需要坐船上岛，浮潜和海上项目集中在这里。上岛要趁早，十点后码头排队很长；岛上餐饮偏贵，可以自带水和零食。', 2),
  (4, '后海村', '自然生态', '半天', '冲浪爱好者的聚集地，浪小、适合新手，村里到处是板店和咖啡馆。傍晚坐在沙滩看冲浪的人，比景区自在。', 3);

-- 5. 大理（云南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (5, '大理', 'DALI', '自然风光', '云南省', 4.8, 1050, '3-4 天', '3-5 月 / 11-12 月', '#7FA8D9', '#5C82B8', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.oiSYeDts7lozStuVyxD-TgHaEK?pid=1.7', '苍山洱海间的小城故事。租一辆电动车环洱海，在喜洲看稻田与白族院落，傍晚坐在古城墙下听风——大理适合所有想停下来的人。', 5);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (5, '洱海', 1), (5, '古城', 2), (5, '风花雪月', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (5, '洱海生态廊道', '自然生态', '半天', '沿洱海修的骑行步道，全程几十公里，最热门的是才村到喜洲一段。租电动车或自行车，随时停下来拍照，日落时最好看。', 1),
  (5, '喜洲古镇', '人文古迹', '2-3 小时', '白族民居保存得最完整的地方，严家大院可以看三坊一照壁的格局。镇外的稻田随季节变色，配着老墙很好拍。', 2),
  (5, '苍山', '自然生态', '半天', '十九峰横在洱海西侧，索道有三条，感通索道最省力。山上温差大，夏天也要带件外套；云雾天看不到洱海全景。', 3);

-- 6. 北京（北京市 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (6, '北京', 'BEIJING', '历史古迹', '北京市', 4.9, 1680, '4 天', '4-5 月 / 9-10 月', '#C96A5E', '#A84E44', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.04DCfcfZK6E_pNMteKz3hwHaEK?pid=1.7', '红墙金瓦与胡同烟火同框。清晨看一次天安门升旗，下午钻进胡同里喝茶，傍晚登景山俯瞰故宫全景——经典与生活感可以兼得。', 6);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (6, '故宫', 1), (6, '长城', 2), (6, '胡同', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (6, '故宫博物院', '人文古迹', '半天', '明清两代皇宫，中轴线走马观花也要三小时。热门时段人极多，建议午门进、神武门出，先看东西六宫再回中轴。需提前七天实名预约。', 1),
  (6, '八达岭长城', '人文古迹', '半天', '最经典也最方便的一段，索道和滑车都能上。想避开人流就往北八楼方向走，早上八点前到，城墙上看不到几个人。', 2),
  (6, '什刹海 · 胡同', '街区市集', '2-3 小时', '前海后海连成一片，岸边是酒吧和胡同院落。可以坐三轮车逛胡同，也可以自己钻进去看门墩和影壁，傍晚最热闹。', 3);

-- 7. 厦门（福建省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (7, '厦门', 'XIAMEN', '海岛度假', '福建省', 4.6, 1180, '3 天', '4-6 月 / 9-11 月', '#5FB8A5', '#3E9A87', 'https://tse3-mm.cn.bing.net/th/id/OIP-C.bGG31Z_caTYG32T7mwVY3AHaEH?pid=1.7', '一座适合 City Walk 的海上花园。鼓浪屿的老别墅、环岛路的骑行海风、沙坡尾的文艺小店——节奏慢、风景好，怎么逛都舒服。', 7);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (7, '海滨', 1), (7, '文艺', 2), (7, 'CityWalk', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (7, '鼓浪屿', '人文古迹', '一天', '岛上不通汽车，全靠步行。老别墅、钢琴博物馆和海边小路是重点，别只走龙头路商业街。船票要提前买，节假日一票难求。', 1),
  (7, '环岛路', '自然生态', '2-3 小时', '沿海公路，骑车或跑步都合适，从白城沙滩到会展中心一段风景最好。清晨和傍晚人少，中午晒得厉害。', 2),
  (7, '沙坡尾', '街区市集', '2 小时', '老渔港改造的街区，避风坞里停着小船，周边是咖啡馆和设计小店。适合慢慢逛，傍晚在岸边看日落。', 3);

-- 8. 丽江（云南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (8, '丽江', 'LIJIANG', '自然风光', '云南省', 4.5, 1320, '3-4 天', '4-6 月 / 9-11 月', '#9C8FC4', '#7A6BA8', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.OtJaU0g07mYhUS0OJdPFOAHaDv?pid=1.7', '玉龙雪山下的柔软时光。白天上雪山看冰川，傍晚在四方街晒太阳，夜里听一场纳西古乐——也可以哪儿都不去，就在客栈院子里发呆。', 8);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (8, '雪山', 1), (8, '古城', 2), (8, '民宿', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (8, '玉龙雪山', '自然生态', '一天', '海拔 4500 米以上的冰川公园，索道直达。上山前别剧烈运动，氧气瓶在山下买更便宜；下午云雾多，尽量上午上。', 1),
  (8, '丽江古城', '人文古迹', '半天', '纳西族的老城，水系穿街过巷。白天游客多，清晨七八点的石板路没人，才是它本来的样子。住宿建议选古城边缘，安静。', 2),
  (8, '束河古镇', '人文古迹', '半天', '比丽江古城小一半，也安静一半。青龙桥、四方街和溪边的院子值得慢走，商业化程度低一些，适合住一晚。', 3);

-- 9. 广州（广东省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (9, '广州', 'GUANGZHOU', '美食休闲', '广东省', 4.6, 1100, '2-3 天', '10 月-次年 3 月', '#EBB15C', '#DE9435', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.vS-OKpXo-DCW8LihhulvSAHaFj?pid=1.7', '“食在广州”名不虚传：早茶一盅两件、街头烧腊与糖水，从西关老骑楼一路吃到珠江新城。美食之外，还有沙面的欧式街巷与夜游珠江。', 9);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (9, '早茶', 1), (9, '美食', 2), (9, '夜游珠江', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (9, '沙面岛', '人文古迹', '2 小时', '珠江边的沙洲，保留着一百多栋欧式建筑，现在多是咖啡馆和领事馆旧址。适合散步拍照，一小时能走完。', 1),
  (9, '广州塔', '观景夜景', '2-3 小时', '俗称小蛮腰，登塔看珠江两岸。摩天轮和观景台分开售票，日落后一小时上塔，能看到白天转夜景的整个过程。', 2),
  (9, '陈家祠', '人文古迹', '1-2 小时', '清末陈氏宗族的合族祠，木雕、砖雕、陶塑密集到夸张，是岭南建筑工艺的集大成。一小时能看完，适合雨天。', 3);

-- 10. 武汉（湖北省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (10, '武汉', 'WUHAN', '历史古迹', '湖北省', 4.6, 1080, '3 天', '3-5 月 / 9-11 月', '#E58BA8', '#C4657F', 'https://tse4-mm.cn.bing.net/th/id/OIP-C.3qgHfDDXpp1nYcRHMj2quwHaEA?pid=1.7', '长江与汉水交汇处的“九省通衢”。登黄鹤楼看大江东去，三月去武大赴一场樱花雨，早上以一碗热干面开场、夜宵用小龙虾收尾——江湖气与烟火气都很足的江城。', 10);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (10, '黄鹤楼', 1), (10, '樱花', 2), (10, '热干面', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (10, '黄鹤楼', '人文古迹', '2 小时', '江南三大名楼之一，现楼是 1985 年重建的。登顶能看长江大桥和武汉三镇，傍晚光线最好；楼内展览一般，重点在视野。', 1),
  (10, '武汉大学 · 东湖', '自然生态', '半天', '武大老斋舍和樱花道在春天最出名，平时也值得走。东湖绿道可以骑车绕湖，一圈下来半天就没了。', 2),
  (10, '户部巷 · 江汉路', '街区市集', '2-3 小时', '两条街连着逛：户部巷吃热干面、豆皮，江汉路看近代建筑。早上来吃早点最地道，晚上来是另一副样子。', 3);

-- 11. 长沙（湖南省 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (11, '长沙', 'CHANGSHA', '美食休闲', '湖南省', 4.6, 980, '2-3 天', '3-5 月 / 9-11 月', '#D9553F', '#AE3A2A', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.qVqPnNBz7zY4YKdHNUb1-gHaE-?pid=1.7', '把辣和夜生活都拉到顶的城市。白天登岳麓山、去橘子洲头看湘江北去，晚上钻进坡子街一路吃到深夜——长沙的快乐来得很直接。', 11);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (11, '湘菜', 1), (11, '橘子洲', 2), (11, '夜生活', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (11, '橘子洲头', '自然生态', '2 小时', '湘江中间的沙洲，尽头是青年毛泽东雕像。建议坐地铁到洲头，沿江走一圈，周末晚上有焰火。', 1),
  (11, '岳麓山 · 岳麓书院', '人文古迹', '半天', '书院是中国古代四大书院之一，讲堂、御书楼都还在。上山可以坐索道，下来走爱晚亭一线，秋天枫叶最好。', 2),
  (11, '坡子街 · 太平老街', '街区市集', '2-3 小时', '长沙小吃最密集的一片，臭豆腐、糖油粑粑、口味虾都在附近。晚上八点后最热闹，也最挤。', 3);

-- 12. 南京（江苏省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (12, '南京', 'NANJING', '历史古迹', '江苏省', 4.7, 1150, '2-3 天', '3-5 月 / 10-11 月', '#B6A15E', '#8E7A3F', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.dOg9dJwc2Aogdrd_c1EtggHaE8?pid=1.7', '六朝古都，也是被梧桐树包住的城市。中山陵的长阶、明孝陵的神道、入夜后秦淮河上的桨声灯影——南京的厚重里带着一点温柔。', 12);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (12, '六朝古都', 1), (12, '梧桐', 2), (12, '秦淮河', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (12, '夫子庙 · 秦淮河', '街区市集', '2-3 小时', '夫子庙、贡院和秦淮河连在一起，夜里画舫灯船最有氛围。商业味重，想安静就早上来，看本地人在河边晨练。', 1),
  (12, '中山陵 · 明孝陵', '人文古迹', '半天', '中山陵免费但需预约，392 级台阶爬上去能俯瞰南京。明孝陵的石象路秋天最好，两处之间可以坐摆渡车。', 2),
  (12, '南京博物院', '人文古迹', '2-3 小时', '馆藏从史前到民国，民国馆整条街复原得很有意思。免费不免票，提前在公众号预约，至少留三小时。', 3);

-- 13. 上海（上海市 · 都市风情）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (13, '上海', 'SHANGHAI', '都市风情', '上海市', 4.8, 1580, '3-4 天', '3-5 月 / 9-11 月', '#5468A8', '#39467C', 'https://tse1-mm.cn.bing.net/th/id/OIP-C.i5wUMb5aTFSB-TGWt-b62wHaE7?pid=1.7', '一边是外滩的万国建筑与陆家嘴的天际线，一边是武康路、安福路的梧桐街区。上海适合用 CityWalk 的方式慢慢逛，咖啡馆和小马路永远逛不完。', 13);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (13, '外滩', 1), (13, '梧桐区', 2), (13, 'CityWalk', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (13, '外滩 · 陆家嘴', '观景夜景', '半天', '黄浦江两侧对望：西岸万国建筑，东岸摩天楼。傍晚坐轮渡过江最划算，两块钱看两岸亮灯。', 1),
  (13, '武康路 · 安福路', '街区市集', '2-3 小时', '梧桐树下的老洋房街区，咖啡馆、买手店和网红建筑密集。适合下午慢慢走，周末人多到需要排队。', 2),
  (13, '豫园 · 城隍庙', '人文古迹', '2 小时', '明代园林加庙市，豫园本身要门票，外面一圈小吃街免费但很挤。想看园林就早上开园时进，避开人流。', 3);

-- 14. 深圳（广东省 · 都市风情）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (14, '深圳', 'SHENZHEN', '都市风情', '广东省', 4.5, 1250, '2-3 天', '10 月-次年 4 月', '#2F9BA8', '#1C717E', 'https://tse2-mm.cn.bing.net/th/id/OIP-C.Bp20dUqVCiv1sKaDy0GWDQHaE7?pid=1.7', '四十多年长成的一座年轻都市，高楼与海岸线挤在同一帧画面里。白天逛华侨城创意园，傍晚去深圳湾看对岸香港的灯火，夜里再上平安金融中心俯瞰全城。', 14);
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
