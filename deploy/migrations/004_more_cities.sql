-- 新增 6 个目的地（增量，不删旧数据）
-- 在存量库上执行一次

-- 15. 重庆（重庆市 · 美食休闲）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (15, '重庆', 'CHONGQING', '美食休闲', '重庆市', 4.7, 1180, '3 天', '3-5 月 / 9-11 月', '#E8734B', '#B8451F', '', '立体到有点魔幻的山城：轻轨从居民楼里穿过，洪崖洞的灯一亮像动画，长江索道横跨江面。火锅和小面是日常，爬坡上坎是运动。', '洪崖洞', '吊脚楼式的建筑群沿江叠了十一层，晚上亮灯后整面崖壁都是暖黄色。建议从顶层往下走，一路是小吃和观景平台；拍全景最好的位置在千厮门大桥上，傍晚六点前上去能占到机位。', 15);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (15, '火锅', 1), (15, '山城', 2), (15, '夜景', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (15, '洪崖洞', '街区市集', '2 小时', '吊脚楼建筑群，夜里亮灯最出片，从顶层往下逛不累。', 1),
  (15, '李子坝轻轨站', '街区市集', '1 小时', '轻轨从居民楼里穿过去，观景台在马路对面，等两趟就能拍到。', 2),
  (15, '磁器口古镇', '人文古迹', '半天', '嘉陵江边的老码头，往巷子深处走人少，麻花铺子排长队的未必最好。', 3);

-- 16. 桂林（广西壮族自治区 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (16, '桂林', 'GUILIN', '自然风光', '广西壮族自治区', 4.6, 1320, '3 天', '4-10 月', '#6FAE8E', '#3F7D68', '', '喀斯特山水甲天下：漓江竹筏、阳朔田园、遇龙河的稻田与峰林，随手一拍都是水墨画。', '漓江 · 兴坪段', '桂林山水的精华就在杨堤到兴坪这一段，二十元人民币背面的取景地也在其中。竹筏漂流约两小时，早上雾气未散时最好看；旺季要提前订筏，雨后的水色偏黄，晴天倒影最清。', 16);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (16, '山水', 1), (16, '竹筏', 2), (16, '阳朔', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (16, '漓江 · 兴坪', '自然生态', '半天', '竹筏漂流的经典段，二十元背景取景地就在兴坪。', 1),
  (16, '遇龙河', '自然生态', '半天', '比漓江安静的支流，竹筏慢漂，两岸是稻田和峰林。', 2),
  (16, '西街', '街区市集', '2 小时', '阳朔的老街，白天清净晚上热闹，酒吧和啤酒鱼都集中在这。', 3);

-- 17. 苏州（江苏省 · 江南水乡）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (17, '苏州', 'SUZHOU', '江南水乡', '江苏省', 4.7, 1080, '2-3 天', '3-5 月 / 9-11 月', '#8FB8A8', '#5E8F7E', '', '园林与评弹组成的江南：拙政园一步一景，平江路的巷子适合慢慢走，晚上听一段昆曲就更完整了。', '拙政园', '四大名园之首，水面占了三分之一，四季各有看头。建议开园就进，人少光线也软；从东园进、西园出，走完约两小时。旺季需提前预约，园内的借景与框景值得停下来细看。', 17);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (17, '园林', 1), (17, '评弹', 2), (17, '水乡', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (17, '拙政园', '人文古迹', '2 小时', '四大名园之首，水面与亭台的借景是精华，开园时人最少。', 1),
  (17, '平江路', '街区市集', '2 小时', '沿河的青石板老街，评弹馆和小吃藏在巷子深处。', 2),
  (17, '苏州博物馆', '人文古迹', '2 小时', '贝聿铭设计的收官之作，白墙灰瓦配几何光影，需提前预约。', 3);

-- 18. 青岛（山东省 · 海岛度假）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (18, '青岛', 'QINGDAO', '海岛度假', '山东省', 4.6, 1260, '3 天', '5-10 月', '#7FB6D9', '#4A83AB', '', '红瓦绿树、碧海蓝天：老城区的德式建筑、八大关的梧桐、夏天配一袋散装啤酒，是北方最舒服的海边城市。', '八大关', '十条以关隘命名的路，两侧是各国风格的老别墅，春天樱花、秋天银杏。走到花石楼就能下到第二海水浴场；建议下午四点后去，光斜着穿过梧桐最好看，人也不多。', 18);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (18, '海滨', 1), (18, '老建筑', 2), (18, '啤酒', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (18, '八大关', '人文古迹', '半天', '各国风格别墅群，春樱秋杏，走到海边只要十分钟。', 1),
  (18, '栈桥', '观景夜景', '2 小时', '老青岛的象征，尽头回望老城红瓦，冬天有成群海鸥。', 2),
  (18, '崂山', '自然生态', '一天', '海上第一名山，仰口看海、巨峰看日出，山与海同框。', 3);

-- 19. 张家界（湖南省 · 自然风光）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (19, '张家界', 'ZHANGJIAJIE', '自然风光', '湖南省', 4.7, 1420, '3-4 天', '4-10 月', '#7FA87F', '#4E7A4E', '', '石英砂岩峰林拔地而起，云雾一起就像悬浮的山，也是电影取景地。爬山强度大，但风景值回票价。', '张家界国家森林公园', '三千多座石峰组成的峰林，电影里悬浮山的原型。袁家界的哈利路亚山、天子山的观景台是必看，索道和百龙天梯能省不少体力。雨后云雾最出片，但栈道会滑，鞋一定要防滑。', 19);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (19, '峰林', 1), (19, '云雾', 2), (19, '徒步', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (19, '张家界国家森林公园', '自然生态', '一天', '袁家界与天子山的峰林，云雾天像悬浮山，门票四天有效。', 1),
  (19, '天门山', '自然生态', '一天', '玻璃栈道与九十九道弯盘山路，索道从市区直接上山。', 2),
  (19, '凤凰古城', '人文古迹', '一天', '沱江边的吊脚楼，夜里灯一亮就是沈从文笔下的样子。', 3);

-- 20. 敦煌（甘肃省 · 历史古迹）
INSERT INTO destination (id, name, en_name, category, location, rating, price_from, days, best_season, gradient_start, gradient_end, image, description, highlight_name, highlight_desc, sort_order) VALUES (20, '敦煌', 'DUNHUANG', '历史古迹', '甘肃省', 4.8, 1560, '3 天', '5-10 月', '#D9A566', '#A87338', '', '戈壁上的千年佛国：莫高窟的壁画、鸣沙山的落日、夜市里的杏皮水，一次把历史与荒漠都看了。', '莫高窟', '七百多个洞窟保存着四世纪到十四世纪的壁画与彩塑。每个讲解员带看八个洞窟，随机分配，能看到哪些全凭运气。旺季需提前一个月在官网预约，洞窟内禁止拍照，光线是讲解员用手电打出来的。', 20);
INSERT INTO destination_tag (destination_id, tag, sort_order) VALUES (20, '壁画', 1), (20, '戈壁', 2), (20, '丝路', 3);
INSERT INTO destination_attraction (destination_id, name, attraction_type, duration, attr_desc, sort_order) VALUES
  (20, '莫高窟', '人文古迹', '半天', '千年壁画与彩塑，需提前预约，每批只能看八个洞窟。', 1),
  (20, '鸣沙山 · 月牙泉', '自然生态', '半天', '沙山环抱一弯泉水，傍晚骑骆驼看落日，起风时沙子会响。', 2),
  (20, '敦煌夜市', '街区市集', '2 小时', '杏皮水、驴肉黄面、胡杨木雕，晚上十点最热闹。', 3);
