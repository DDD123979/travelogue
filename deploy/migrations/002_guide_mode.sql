-- 攻略模式：删除酒店 / 订单表，并刷新 42 条景点介绍
-- 在存量库上执行一次；全新环境直接跑 schema.sql + data.sql

DROP TABLE IF EXISTS booking_order;
DROP TABLE IF EXISTS hotel;

UPDATE destination_attraction SET attr_desc = '看熊猫最省心的一站，成年熊猫、幼崽和产房各有展区。熊猫上午最活跃，建议八点前后入园，避开中午集体午睡的时间。' WHERE name = '大熊猫繁育研究基地';
UPDATE destination_attraction SET attr_desc = '由宽巷子、窄巷子、井巷子三条清代街巷组成，青砖灰瓦里塞满茶馆、采耳和小吃。适合傍晚来，坐进院子喝碗盖碗茶看人来人往。' WHERE name = '宽窄巷子';
UPDATE destination_attraction SET attr_desc = '一座用了两千多年仍在灌溉成都平原的水利工程，加上道教名山青城山。两地相隔不远，一天刚好：上午看鱼嘴分水，下午上山走一段。' WHERE name = '都江堰 · 青城山';
UPDATE destination_attraction SET attr_desc = '十景散在湖的四周，走路逛不完。推荐从断桥出发沿白堤到孤山，再坐船去三潭印月；清晨和雨天人最少，也最像画。' WHERE name = '西湖风景名胜区';
UPDATE destination_attraction SET attr_desc = '东晋古刹加五代石窟造像，飞来峰的石刻就在进寺路上，很多人只顾上香错过了。早上七点开门，人少清净，香火气也淡一些。' WHERE name = '灵隐寺 · 飞来峰';
UPDATE destination_attraction SET attr_desc = '西湖边上的茶山村落，春天满山采茶人。可以沿茶园步道走一圈，在农家喝一杯当季龙井，看炒茶师傅用手掌翻锅。' WHERE name = '龙井村';
UPDATE destination_attraction SET attr_desc = '三个坑看下来至少三小时，一号坑最震撼但人最多。建议先看三号坑和二号坑再回一号坑，动线顺、人少。需实名预约。' WHERE name = '秦始皇兵马俑博物馆';
UPDATE destination_attraction SET attr_desc = '明代城墙完整一圈约 13.7 公里，租辆自行车骑完要两小时。傍晚从永宁门上墙，能一路骑到日落亮灯。' WHERE name = '西安城墙';
UPDATE destination_attraction SET attr_desc = '一条仿唐风格的步行街，白天普通、夜里完全变样：灯光、街头表演、汉服人群。建议天黑后再来，从大雁塔北广场往南走。' WHERE name = '大唐不夜城';
UPDATE destination_attraction SET attr_desc = '三亚沙质最细的一段海湾，水清、坡缓，适合下海。酒店多集中在湾内，公共沙滩入口有限，建议早点去占位置。' WHERE name = '亚龙湾';
UPDATE destination_attraction SET attr_desc = '需要坐船上岛，浮潜和海上项目集中在这里。上岛要趁早，十点后码头排队很长；岛上餐饮偏贵，可以自带水和零食。' WHERE name = '蜈支洲岛';
UPDATE destination_attraction SET attr_desc = '冲浪爱好者的聚集地，浪小、适合新手，村里到处是板店和咖啡馆。傍晚坐在沙滩看冲浪的人，比景区自在。' WHERE name = '后海村';
UPDATE destination_attraction SET attr_desc = '沿洱海修的骑行步道，全程几十公里，最热门的是才村到喜洲一段。租电动车或自行车，随时停下来拍照，日落时最好看。' WHERE name = '洱海生态廊道';
UPDATE destination_attraction SET attr_desc = '白族民居保存得最完整的地方，严家大院可以看三坊一照壁的格局。镇外的稻田随季节变色，配着老墙很好拍。' WHERE name = '喜洲古镇';
UPDATE destination_attraction SET attr_desc = '十九峰横在洱海西侧，索道有三条，感通索道最省力。山上温差大，夏天也要带件外套；云雾天看不到洱海全景。' WHERE name = '苍山';
UPDATE destination_attraction SET attr_desc = '明清两代皇宫，中轴线走马观花也要三小时。热门时段人极多，建议午门进、神武门出，先看东西六宫再回中轴。需提前七天实名预约。' WHERE name = '故宫博物院';
UPDATE destination_attraction SET attr_desc = '最经典也最方便的一段，索道和滑车都能上。想避开人流就往北八楼方向走，早上八点前到，城墙上看不到几个人。' WHERE name = '八达岭长城';
UPDATE destination_attraction SET attr_desc = '前海后海连成一片，岸边是酒吧和胡同院落。可以坐三轮车逛胡同，也可以自己钻进去看门墩和影壁，傍晚最热闹。' WHERE name = '什刹海 · 胡同';
UPDATE destination_attraction SET attr_desc = '岛上不通汽车，全靠步行。老别墅、钢琴博物馆和海边小路是重点，别只走龙头路商业街。船票要提前买，节假日一票难求。' WHERE name = '鼓浪屿';
UPDATE destination_attraction SET attr_desc = '沿海公路，骑车或跑步都合适，从白城沙滩到会展中心一段风景最好。清晨和傍晚人少，中午晒得厉害。' WHERE name = '环岛路';
UPDATE destination_attraction SET attr_desc = '老渔港改造的街区，避风坞里停着小船，周边是咖啡馆和设计小店。适合慢慢逛，傍晚在岸边看日落。' WHERE name = '沙坡尾';
UPDATE destination_attraction SET attr_desc = '海拔 4500 米以上的冰川公园，索道直达。上山前别剧烈运动，氧气瓶在山下买更便宜；下午云雾多，尽量上午上。' WHERE name = '玉龙雪山';
UPDATE destination_attraction SET attr_desc = '纳西族的老城，水系穿街过巷。白天游客多，清晨七八点的石板路没人，才是它本来的样子。住宿建议选古城边缘，安静。' WHERE name = '丽江古城';
UPDATE destination_attraction SET attr_desc = '比丽江古城小一半，也安静一半。青龙桥、四方街和溪边的院子值得慢走，商业化程度低一些，适合住一晚。' WHERE name = '束河古镇';
UPDATE destination_attraction SET attr_desc = '珠江边的沙洲，保留着一百多栋欧式建筑，现在多是咖啡馆和领事馆旧址。适合散步拍照，一小时能走完。' WHERE name = '沙面岛';
UPDATE destination_attraction SET attr_desc = '俗称小蛮腰，登塔看珠江两岸。摩天轮和观景台分开售票，日落后一小时上塔，能看到白天转夜景的整个过程。' WHERE name = '广州塔';
UPDATE destination_attraction SET attr_desc = '清末陈氏宗族的合族祠，木雕、砖雕、陶塑密集到夸张，是岭南建筑工艺的集大成。一小时能看完，适合雨天。' WHERE name = '陈家祠';
UPDATE destination_attraction SET attr_desc = '江南三大名楼之一，现楼是 1985 年重建的。登顶能看长江大桥和武汉三镇，傍晚光线最好；楼内展览一般，重点在视野。' WHERE name = '黄鹤楼';
UPDATE destination_attraction SET attr_desc = '武大老斋舍和樱花道在春天最出名，平时也值得走。东湖绿道可以骑车绕湖，一圈下来半天就没了。' WHERE name = '武汉大学 · 东湖';
UPDATE destination_attraction SET attr_desc = '两条街连着逛：户部巷吃热干面、豆皮，江汉路看近代建筑。早上来吃早点最地道，晚上来是另一副样子。' WHERE name = '户部巷 · 江汉路';
UPDATE destination_attraction SET attr_desc = '湘江中间的沙洲，尽头是青年毛泽东雕像。建议坐地铁到洲头，沿江走一圈，周末晚上有焰火。' WHERE name = '橘子洲头';
UPDATE destination_attraction SET attr_desc = '书院是中国古代四大书院之一，讲堂、御书楼都还在。上山可以坐索道，下来走爱晚亭一线，秋天枫叶最好。' WHERE name = '岳麓山 · 岳麓书院';
UPDATE destination_attraction SET attr_desc = '长沙小吃最密集的一片，臭豆腐、糖油粑粑、口味虾都在附近。晚上八点后最热闹，也最挤。' WHERE name = '坡子街 · 太平老街';
UPDATE destination_attraction SET attr_desc = '夫子庙、贡院和秦淮河连在一起，夜里画舫灯船最有氛围。商业味重，想安静就早上来，看本地人在河边晨练。' WHERE name = '夫子庙 · 秦淮河';
UPDATE destination_attraction SET attr_desc = '中山陵免费但需预约，392 级台阶爬上去能俯瞰南京。明孝陵的石象路秋天最好，两处之间可以坐摆渡车。' WHERE name = '中山陵 · 明孝陵';
UPDATE destination_attraction SET attr_desc = '馆藏从史前到民国，民国馆整条街复原得很有意思。免费不免票，提前在公众号预约，至少留三小时。' WHERE name = '南京博物院';
UPDATE destination_attraction SET attr_desc = '黄浦江两侧对望：西岸万国建筑，东岸摩天楼。傍晚坐轮渡过江最划算，两块钱看两岸亮灯。' WHERE name = '外滩 · 陆家嘴';
UPDATE destination_attraction SET attr_desc = '梧桐树下的老洋房街区，咖啡馆、买手店和网红建筑密集。适合下午慢慢走，周末人多到需要排队。' WHERE name = '武康路 · 安福路';
UPDATE destination_attraction SET attr_desc = '明代园林加庙市，豫园本身要门票，外面一圈小吃街免费但很挤。想看园林就早上开园时进，避开人流。' WHERE name = '豫园 · 城隍庙';
UPDATE destination_attraction SET attr_desc = '红树林海岸线，沿海骑行道一直通到蛇口。冬天有候鸟，傍晚能看对岸香港的灯火，适合跑步和放空。' WHERE name = '深圳湾公园';
UPDATE destination_attraction SET attr_desc = '福田中轴线的高楼群，平安金融中心云际观光层可俯瞰全城。日落前上去，能看到城市从白天切到夜晚。' WHERE name = '平安金融中心 · 市民中心';
UPDATE destination_attraction SET attr_desc = '明代海防古城加深圳最长的沙滩，一天刚好。古城里巷子安静，西涌适合下水，交通靠自驾或包车。' WHERE name = '大鹏所城 · 西涌';
