-- 新增 3 个目的地：洛阳 / 开封 / 威海（各 5 个景点）
-- 在存量库上执行一次

-- 21. 洛阳（河南省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (21, '洛阳', 'LUOYANG', '历史古迹', '河南省', 4.7, 1100, '3 天', '4-5 月 / 9-10 月', '#C9A227', '#93761A', '', '十三朝古都：伊河两岸的佛龛、白马寺的钟声、四月满城的牡丹，还有一碗牛肉汤配饼的早晨。', '龙门石窟', '伊河两岸的崖壁上凿了十万余尊佛像，奉先寺的卢舍那大佛高十七米，是唐代造像的巅峰。建议北门进、南门出，走完约三小时；四月牡丹花季人最多，清晨开园时最安静。', 85, 21);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (21, '古都', 1), (21, '石窟', 2), (21, '牡丹', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (21, '龙门石窟', '人文古迹', '半天', '伊河两岸十万余尊造像，卢舍那大佛是精华，建议北门进。', 1),
  (21, '白马寺', '人文古迹', '半天', '中国第一座官办佛寺，齐云塔院和异国佛殿都值得走一圈。', 2),
  (21, '洛阳老城 · 十字街', '街区市集', '2 小时', '晚上的小吃一条街，水席和不翻汤值得一试。', 3),
  (21, '洛阳博物馆', '人文古迹', '2 小时', '唐三彩与石刻馆是强项，免费但需提前预约。', 4),
  (21, '隋唐洛阳城 · 明堂天堂', '观景夜景', '2 小时', '复原的唐代宫城建筑，夜里亮灯后很有盛唐气象。', 5);

-- 22. 开封（河南省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (22, '开封', 'KAIFENG', '历史古迹', '河南省', 4.5, 900, '2 天', '3-5 月 / 9-11 月', '#C58B58', '#8D5A32', '', '北宋汴京的旧地：清明上河园把画里的市井搬了出来，鼓楼夜市从傍晚一直吃到深夜。', '清明上河园', '按《清明上河图》复原的宋文化园区，虹桥、汴河、勾栏瓦舍都在。白天有包公巡街、王员外招婿这类实景演出，晚上是《大宋·东京梦华》水上实景剧。建议下午进园，一直待到夜场。', 80, 22);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (22, '宋韵', 1), (22, '夜市', 2), (22, '实景演出', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (22, '清明上河园', '人文古迹', '一天', '按《清明上河图》复原，白天看演出、晚上看水上实景剧。', 1),
  (22, '龙亭公园', '人文古迹', '2 小时', '宋代皇宫遗址上的高台，两侧潘杨二湖，秋天有菊花展。', 2),
  (22, '开封府', '人文古迹', '2 小时', '包公断案的地方，每天上午有仿古开衙仪式。', 3),
  (22, '鼓楼夜市', '街区市集', '2 小时', '灌汤包、炒凉粉、杏仁茶，晚上七点后最热闹。', 4),
  (22, '大相国寺', '人文古迹', '1-2 小时', '千年皇家寺院，千手千眼观音由整块银杏木雕成。', 5);

-- 23. 威海（山东省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, hot_score, sort_order) VALUES (23, '威海', 'WEIHAI', '海岛度假', '山东省', 4.6, 1150, '3 天', '5-10 月', '#6FB6C9', '#3D7E93', '', '山东半岛最东端：海岸线干净、人比青岛少，成山头的日出、刘公岛的历史、海鲜市场的实惠都在这。', '成山头', '中国大陆海岸线最东端，被称作"天尽头"，是看日出的绝佳位置。夏天日出在四点五十左右，景区门口就有观景台；海边风大浪急，栈道注意安全，冬天有成群天鹅飞来。', 79, 23);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (23, '海岸线', 1), (23, '日出', 2), (23, '海鲜', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (23, '成山头', '自然生态', '半天', '海岸线最东端，看日出最佳，夏天约四点五十。', 1),
  (23, '刘公岛', '人文古迹', '半天', '甲午战争纪念地，坐船上岛，岛上还有森林公园。', 2),
  (23, '那香海 · 海水浴场', '自然生态', '半天', '沙质细、人比青岛少，夏天适合下海。', 3),
  (23, '华夏城', '人文古迹', '半天', '废弃矿坑改成的山水园区，晚上有实景演出。', 4),
  (23, '威海海鲜市场', '街区市集', '2 小时', '买了就近找店加工，价格比景区便宜不少。', 5);
