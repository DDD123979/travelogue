-- 攻略版：给目的地加「最特色景点 + 详细介绍」
-- 存量库执行一次；全新环境直接跑 schema.sql + data.sql

ALTER TABLE destination
  ADD COLUMN highlight_name VARCHAR(80) NOT NULL DEFAULT '' COMMENT '最特色景点名' AFTER description,
  ADD COLUMN highlight_desc VARCHAR(600) NOT NULL DEFAULT '' COMMENT '该景点的详细介绍' AFTER highlight_name;

UPDATE destination SET highlight_name = '大熊猫繁育研究基地', highlight_desc = '全国最容易看到大熊猫的地方，园区里有成年熊猫别墅、幼崽产房和月亮产房，早上八点喂食时最活跃。除了熊猫还有小熊猫散养区。建议从新区入口进，先坐观光车到最里面的产房再往回逛，全程约三小时。' WHERE id = 1;
UPDATE destination SET highlight_name = '西湖风景名胜区', highlight_desc = '西湖不是一个景点，而是一圈散落的十景。经典走法是从断桥沿白堤到孤山，再坐船去三潭印月；苏堤适合骑行，杨公堤人最少。清晨六点的湖面几乎没有游客，雾一起就是水墨画。想省力就坐环湖观光车，一站一景。' WHERE id = 2;
UPDATE destination SET highlight_name = '秦始皇兵马俑博物馆', highlight_desc = '三座坑加一个铜车马展厅，一号坑最大也最震撼，六千多个陶俑按军阵排列。建议先看二号、三号坑（人少），再回一号坑。讲解器值得租，否则很容易只看到一堆泥人。距市区约一小时车程，上午出发、下午回城看城墙最顺。' WHERE id = 3;
UPDATE destination SET highlight_name = '亚龙湾', highlight_desc = '三亚沙质最细的一段海湾，海水通透、坡度平缓，适合游泳和浮潜。湾内酒店密集，公共沙滩从亚龙湾广场下去。上午水最清，午后晒得厉害。想避开人群就往东走到热带天堂森林公园一侧，人少景也更开阔。' WHERE id = 4;
UPDATE destination SET highlight_name = '洱海生态廊道', highlight_desc = '沿洱海修的骑行步道，全程几十公里，最精华的是才村到喜洲这一段。租一辆电动车，随时停下来拍海鸥、芦苇和水面。日落前两小时出发最好，光线会从金色变成粉色。湖边风大，防晒和保暖都要带。' WHERE id = 5;
UPDATE destination SET highlight_name = '故宫博物院', highlight_desc = '六百年宫殿群、九千多间房。中轴线走马观花要三小时，认真看要一整天。建议午门进、神武门出，先逛东西六宫再回中轴，珍宝馆和钟表馆值得单独买票。门票需提前七天实名预约，周一闭馆。' WHERE id = 6;
UPDATE destination SET highlight_name = '鼓浪屿', highlight_desc = '岛上禁行机动车，全靠步行。日光岩看全景、菽庄花园看海、老别墅群看建筑，龙头路是商业街可以跳过。船票实名预约，节假日一票难求。建议住一晚，游客散去后的清晨才像座岛。' WHERE id = 7;
UPDATE destination SET highlight_name = '玉龙雪山', highlight_desc = '海拔四千五以上的冰川公园，三条索道里大索道直达最高处。上山前别做剧烈运动，氧气瓶在山下买更便宜。上午云少，下午常被雾遮住主峰。山下的蓝月谷水色发蓝，顺路值得停。' WHERE id = 8;
UPDATE destination SET highlight_name = '广州塔', highlight_desc = '俗称小蛮腰，六百米高，观景台和摩天轮分开售票。日落前一小时上塔，能看到珠江从白天切换到夜景的全过程。想省钱可以坐珠江夜游船，从江面看塔身灯光，视角反而更好。' WHERE id = 9;
UPDATE destination SET highlight_name = '黄鹤楼', highlight_desc = '江南三大名楼之一，现在这座是 1985 年重建的。登顶能同时看到长江大桥、蛇山和武汉三镇。楼内展览一般，价值主要在那个视野。傍晚去，看完下楼正好在司门口一带吃晚饭。' WHERE id = 10;
UPDATE destination SET highlight_name = '橘子洲头', highlight_desc = '湘江中的长条沙洲，尽头立着青年毛泽东雕像。地铁二号线直达洲上，观光车可以坐进去。沿江走一圈约两小时，春秋最舒服。周六晚上有焰火，人非常多，要提前占位置。' WHERE id = 11;
UPDATE destination SET highlight_name = '夫子庙 · 秦淮河', highlight_desc = '夫子庙、江南贡院和秦淮河连成一片，夜里画舫灯船最有氛围。商业气息重，但清晨的河边能看到本地人打太极、遛鸟。贡院值得进去看看古代考场，一墙之隔就是热闹街市。' WHERE id = 12;
UPDATE destination SET highlight_name = '外滩 · 陆家嘴', highlight_desc = '西岸是二十多栋万国建筑，东岸是陆家嘴天际线。傍晚坐轮渡过江只要两块钱，能同时看到两岸亮灯。想拍全景去北外滩或白玉兰广场，人比外滩少，角度还更好。' WHERE id = 13;
UPDATE destination SET highlight_name = '深圳湾公园', highlight_desc = '红树林海岸线，骑行道一直通到蛇口，全程十几公里。冬天有候鸟，傍晚能看到对岸香港的灯火。适合跑步、骑行和发呆，是深圳少有的不收费、不商业化的海岸。' WHERE id = 14;
