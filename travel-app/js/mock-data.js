/* =========================================================
 * mock-data.js — 本地示例数据（只在 file:// 打开时使用）
 *
 * 这批数据原本住在 api.js 里，占了 350 多行，把 60 行的接口层淹没了，
 * 所以拆出来单独放。加载顺序在 index.html 里：mock-data.js 先于 api.js。
 *
 * 【改数据要改两处】这里的酒店与 travel-server/sql/data.sql 是同一批，
 * 两边不一致时，file:// 演示和后端演示看到的会是两份数据。
 * ========================================================= */
/* ---------- 本地示例数据（模拟后端返回） ---------- */

/*
 * 关于 image 字段（目的地封面照片）：
 *   - 值为外链图片地址，使用的是 Bing 图片 CDN 直链（国内外均可访问，无防盗链），
 *     每条都逐个请求验证过确实返回 image/jpeg 的横图。
 *   - 地址末尾只带 ?pid=1.7，**不要再加 w / h 尺寸参数**：Bing 一旦收到宽度和高度，
 *     就会按目标比例给图片补白边（实测每张 84% 都是白边、照片缩在正中间），
 *     只带 pid 时才会原样返回整张照片，封面才能真正铺满卡片。
 *   - 对接自己的后端时，把 image 换成你自己图床/OSS 的地址即可，前端无需改动。
 *   - 断网或链接失效时不会有破图：卡片会自动退回该目的地的 gradient 渐变色封面。
 */
const MOCK_DESTINATIONS = [
  {
    id: 1,
    name: '成都',
    enName: 'CHENGDU',
    category: '美食休闲',
    location: '四川省',
    rating: 4.8,
    priceFrom: 1280,
    days: '3-4 天',
    bestSeason: '3-6 月 / 9-11 月',
    gradient: ['#F2A65A', '#E8734B'],
    image: 'https://tse3-mm.cn.bing.net/th/id/OIP-C.kWYtd52T85vk6lyqRou5mAHaFj?pid=1.7',
    tags: ['火锅', '大熊猫', '慢生活'],
    description: '一座把“慢”刻进日常的城市——在人民公园喝一盏盖碗茶，去巷子里涮一顿热辣火锅，再到熊猫基地看滚滚打滚。成都的松弛感，值得专程前往。',
    attractions: [
      { name: '大熊猫繁育研究基地', time: '半天', desc: '近距离观察国宝大熊猫，建议早上前往，熊猫更活跃。' },
      { name: '宽窄巷子', time: '2-3 小时', desc: '清代古街巷，体验老成都的茶馆文化与市井生活。' },
      { name: '都江堰 · 青城山', time: '一天', desc: '两千余年历史的水利工程与世界文化遗产名山。' },
    ],
  },
  {
    id: 2,
    name: '杭州',
    enName: 'HANGZHOU',
    category: '江南水乡',
    location: '浙江省',
    rating: 4.7,
    priceFrom: 1250,
    days: '2-3 天',
    bestSeason: '3-5 月 / 9-11 月',
    gradient: ['#6FAE8E', '#4F8F70'],
    image: 'https://tse4-mm.cn.bing.net/th/id/OIP-C.qWwGEn3poNnSGDvfEOBKRwHaDQ?pid=1.7',
    tags: ['西湖', '茶山', '江南'],
    description: '从西湖十景到龙井茶山，杭州把江南的婉约揉进了日常。春天的苏堤春晓、秋天的满陇桂雨，随便挑个周末都值得去住两天。',
    attractions: [
      { name: '西湖风景名胜区', time: '半天', desc: '环湖骑行或漫步苏堤白堤，经典十景一路串联。' },
      { name: '灵隐寺 · 飞来峰', time: '半天', desc: '千年古刹与五代石窟造像，清晨人少更清净。' },
      { name: '龙井村', time: '2-3 小时', desc: '茶山步道漫步，春季可体验采茶与炒茶。' },
    ],
  },
  {
    id: 3,
    name: '西安',
    enName: 'XIAN',
    category: '历史古迹',
    location: '陕西省',
    rating: 4.7,
    priceFrom: 1380,
    days: '3 天',
    bestSeason: '3-5 月 / 9-10 月',
    gradient: ['#CE9B6A', '#B0794E'],
    image: 'https://tse1-mm.cn.bing.net/th/id/OIP-C.uYrlzJpJd7Dt6MrMj2jDiQHaE7?pid=1.7',
    tags: ['古都', '兵马俑', '美食'],
    description: '十三朝古都，一步一历史。在城墙上骑行看落日，去兵马俑穿越回秦代，晚上以回民街的一碗泡馍收尾——古都的厚重与烟火气并存。',
    attractions: [
      { name: '秦始皇兵马俑博物馆', time: '半天', desc: '世界第八大奇迹，建议提前预约讲解。' },
      { name: '西安城墙', time: '2 小时', desc: '保存最完整的古代城垣，傍晚骑行体验最佳。' },
      { name: '大唐不夜城', time: '夜间', desc: '灯火璀璨的唐风街区，感受盛唐夜色。' },
    ],
  },
  {
    id: 4,
    name: '三亚',
    enName: 'SANYA',
    category: '海岛度假',
    location: '海南省',
    rating: 4.6,
    priceFrom: 2280,
    days: '4-5 天',
    bestSeason: '10 月-次年 4 月',
    gradient: ['#58AAD1', '#3B87B5'],
    image: 'https://tse3-mm.cn.bing.net/th/id/OIP-C.IVy_n3FSBVgsnaDEswiNSAHaE8?pid=1.7',
    tags: ['海岛', '潜水', '度假'],
    description: '中国最南端的热带海滨。亚龙湾的白沙滩、蜈支洲岛的潜水、后海村的日落冲浪——冬天避寒、夏天玩水，度假感直接拉满。',
    attractions: [
      { name: '亚龙湾', time: '半天', desc: '“天下第一湾”，沙白水清，适合亲子与休闲。' },
      { name: '蜈支洲岛', time: '一天', desc: '水质极佳的潜水胜地，水上项目丰富。' },
      { name: '后海村', time: '半天', desc: '冲浪爱好者聚集地，日落时分尤其治愈。' },
    ],
  },
  {
    id: 5,
    name: '大理',
    enName: 'DALI',
    category: '自然风光',
    location: '云南省',
    rating: 4.8,
    priceFrom: 1050,
    days: '3-4 天',
    bestSeason: '3-5 月 / 11-12 月',
    gradient: ['#7FA8D9', '#5C82B8'],
    image: 'https://tse3-mm.cn.bing.net/th/id/OIP-C.oiSYeDts7lozStuVyxD-TgHaEK?pid=1.7',
    tags: ['洱海', '古城', '风花雪月'],
    description: '苍山洱海间的小城故事。租一辆电动车环洱海，在喜洲看稻田与白族院落，傍晚坐在古城墙下听风——大理适合所有想停下来的人。',
    attractions: [
      { name: '洱海生态廊道', time: '半天', desc: '骑行或自驾环海，随手一拍都是屏保。' },
      { name: '喜洲古镇', time: '2-3 小时', desc: '白族民居与稻田风光，破酥粑粑值得一尝。' },
      { name: '苍山', time: '半天', desc: '乘感通索道登山，俯瞰洱海全景。' },
    ],
  },
  {
    id: 6,
    name: '北京',
    enName: 'BEIJING',
    category: '历史古迹',
    location: '北京市',
    rating: 4.9,
    priceFrom: 1680,
    days: '4 天',
    bestSeason: '4-5 月 / 9-10 月',
    gradient: ['#C96A5E', '#A84E44'],
    image: 'https://tse4-mm.cn.bing.net/th/id/OIP-C.04DCfcfZK6E_pNMteKz3hwHaEK?pid=1.7',
    tags: ['故宫', '长城', '胡同'],
    description: '红墙金瓦与胡同烟火同框。清晨看一次天安门升旗，下午钻进胡同里喝茶，傍晚登景山俯瞰故宫全景——经典与生活感可以兼得。',
    attractions: [
      { name: '故宫博物院', time: '半天', desc: '明清两代皇宫，需提前 7 天实名预约。' },
      { name: '八达岭长城', time: '半天', desc: '“不到长城非好汉”，建议早出发避开人流。' },
      { name: '什刹海 · 胡同', time: '2-3 小时', desc: '鼓楼一带串胡同，感受老北京的日常。' },
    ],
  },
  {
    id: 7,
    name: '厦门',
    enName: 'XIAMEN',
    category: '海岛度假',
    location: '福建省',
    rating: 4.6,
    priceFrom: 1180,
    days: '3 天',
    bestSeason: '4-6 月 / 9-11 月',
    gradient: ['#5FB8A5', '#3E9A87'],
    image: 'https://tse3-mm.cn.bing.net/th/id/OIP-C.bGG31Z_caTYG32T7mwVY3AHaEH?pid=1.7',
    tags: ['海滨', '文艺', 'CityWalk'],
    description: '一座适合 City Walk 的海上花园。鼓浪屿的老别墅、环岛路的骑行海风、沙坡尾的文艺小店——节奏慢、风景好，怎么逛都舒服。',
    attractions: [
      { name: '鼓浪屿', time: '一天', desc: '万国建筑博览与琴岛巷弄，轮渡前往。' },
      { name: '环岛路', time: '2-3 小时', desc: '沿海骑行绿道，一边是海一边是城。' },
      { name: '沙坡尾', time: '2 小时', desc: '老渔港改造的文艺街区，咖啡与市集。' },
    ],
  },
  {
    id: 8,
    name: '丽江',
    enName: 'LIJIANG',
    category: '自然风光',
    location: '云南省',
    rating: 4.5,
    priceFrom: 1320,
    days: '3-4 天',
    bestSeason: '4-6 月 / 9-11 月',
    gradient: ['#9C8FC4', '#7A6BA8'],
    image: 'https://tse2-mm.cn.bing.net/th/id/OIP-C.OtJaU0g07mYhUS0OJdPFOAHaDv?pid=1.7',
    tags: ['雪山', '古城', '民宿'],
    description: '玉龙雪山下的柔软时光。白天上雪山看冰川，傍晚在四方街晒太阳，夜里听一场纳西古乐——也可以哪儿都不去，就在客栈院子里发呆。',
    attractions: [
      { name: '玉龙雪山', time: '一天', desc: '乘大索道登4506米冰川公园，记得提前订票。' },
      { name: '丽江古城', time: '半天', desc: '世界文化遗产，小桥流水与纳西院落。' },
      { name: '束河古镇', time: '半天', desc: '比大研古镇更安静，适合喝茶发呆。' },
    ],
  },
  {
    id: 9,
    name: '广州',
    enName: 'GUANGZHOU',
    category: '美食休闲',
    location: '广东省',
    rating: 4.6,
    priceFrom: 1100,
    days: '2-3 天',
    bestSeason: '10 月-次年 3 月',
    gradient: ['#EBB15C', '#DE9435'],
    image: 'https://tse4-mm.cn.bing.net/th/id/OIP-C.vS-OKpXo-DCW8LihhulvSAHaFj?pid=1.7',
    tags: ['早茶', '美食', '夜游珠江'],
    description: '“食在广州”名不虚传：早茶一盅两件、街头烧腊与糖水，从西关老骑楼一路吃到珠江新城。美食之外，还有沙面的欧式街巷与夜游珠江。',
    attractions: [
      { name: '沙面岛', time: '2 小时', desc: '珠江畔的欧式建筑群，适合漫步拍照。' },
      { name: '广州塔', time: '2-3 小时', desc: '登塔俯瞰珠江夜景，城市地标。' },
      { name: '陈家祠', time: '1-2 小时', desc: '岭南建筑艺术的巅峰，砖雕灰塑精美。' },
    ],
  },
  {
    id: 10,
    name: '武汉',
    enName: 'WUHAN',
    category: '历史古迹',
    location: '湖北省',
    rating: 4.6,
    priceFrom: 1080,
    days: '3 天',
    bestSeason: '3-5 月 / 9-11 月',
    gradient: ['#E58BA8', '#C4657F'],
    image: 'https://tse4-mm.cn.bing.net/th/id/OIP-C.3qgHfDDXpp1nYcRHMj2quwHaEA?pid=1.7',
    tags: ['黄鹤楼', '樱花', '热干面'],
    description: '长江与汉水交汇处的“九省通衢”。登黄鹤楼看大江东去，三月去武大赴一场樱花雨，早上以一碗热干面开场、夜宵用小龙虾收尾——江湖气与烟火气都很足的江城。',
    attractions: [
      { name: '黄鹤楼', time: '2 小时', desc: '江南三大名楼之首，登楼可俯瞰长江大桥与武汉三镇。' },
      { name: '武汉大学 · 东湖', time: '半天', desc: '三月樱花季最美，平日的珞珈山与东湖绿道也值得慢走。' },
      { name: '户部巷 · 江汉路', time: '2-3 小时', desc: '早点一条街与百年老建筑，热干面、豆皮、鸭脖一路吃过去。' },
    ],
  },
  {
    id: 11,
    name: '长沙',
    enName: 'CHANGSHA',
    category: '美食休闲',
    location: '湖南省',
    rating: 4.6,
    priceFrom: 980,
    days: '2-3 天',
    bestSeason: '3-5 月 / 9-11 月',
    gradient: ['#D9553F', '#AE3A2A'],
    image: 'https://tse2-mm.cn.bing.net/th/id/OIP-C.qVqPnNBz7zY4YKdHNUb1-gHaE-?pid=1.7',
    tags: ['湘菜', '橘子洲', '夜生活'],
    description: '把辣和夜生活都拉到顶的城市。白天登岳麓山、去橘子洲头看湘江北去，晚上钻进坡子街一路吃到深夜——长沙的快乐来得很直接。',
    attractions: [
      { name: '橘子洲头', time: '2 小时', desc: '湘江中的狭长洲岛，看青年艺术雕塑与两岸江景。' },
      { name: '岳麓山 · 岳麓书院', time: '半天', desc: '千年学府与山林步道，秋天爱晚亭一带红叶最好看。' },
      { name: '坡子街 · 太平老街', time: '2-3 小时', desc: '小吃与夜市集中地，臭豆腐、糖油粑粑一路尝过去。' },
    ],
  },
  {
    id: 12,
    name: '南京',
    enName: 'NANJING',
    category: '历史古迹',
    location: '江苏省',
    rating: 4.7,
    priceFrom: 1150,
    days: '2-3 天',
    bestSeason: '3-5 月 / 10-11 月',
    gradient: ['#B6A15E', '#8E7A3F'],
    image: 'https://tse1-mm.cn.bing.net/th/id/OIP-C.dOg9dJwc2Aogdrd_c1EtggHaE8?pid=1.7',
    tags: ['六朝古都', '梧桐', '秦淮河'],
    description: '六朝古都，也是被梧桐树包住的城市。中山陵的长阶、明孝陵的神道、入夜后秦淮河上的桨声灯影——南京的厚重里带着一点温柔。',
    attractions: [
      { name: '夫子庙 · 秦淮河', time: '2-3 小时', desc: '夜游画舫看两岸灯火，江南贡院与乌衣巷都在附近。' },
      { name: '中山陵 · 明孝陵', time: '半天', desc: '钟山风景区一线串联，秋天的石象路色彩最好。' },
      { name: '南京博物院', time: '2-3 小时', desc: '国内三大博物馆之一，需提前预约。' },
    ],
  },
  {
    id: 13,
    name: '上海',
    enName: 'SHANGHAI',
    category: '都市风情',
    location: '上海市',
    rating: 4.8,
    priceFrom: 1580,
    days: '3-4 天',
    bestSeason: '3-5 月 / 9-11 月',
    gradient: ['#5468A8', '#39467C'],
    image: 'https://tse1-mm.cn.bing.net/th/id/OIP-C.i5wUMb5aTFSB-TGWt-b62wHaE7?pid=1.7',
    tags: ['外滩', '梧桐区', 'CityWalk'],
    description: '一边是外滩的万国建筑与陆家嘴的天际线，一边是武康路、安福路的梧桐街区。上海适合用 CityWalk 的方式慢慢逛，咖啡馆和小马路永远逛不完。',
    attractions: [
      { name: '外滩 · 陆家嘴', time: '半天', desc: '黄浦江两岸对望，亮灯后江景最好看，可乘轮渡往返。' },
      { name: '武康路 · 安福路', time: '2-3 小时', desc: '梧桐树下的老洋房与咖啡馆，适合散步拍照。' },
      { name: '豫园 · 城隍庙', time: '2 小时', desc: '明代园林与老城厢小吃，人多建议早去。' },
    ],
  },
  {
    id: 14,
    name: '深圳',
    enName: 'SHENZHEN',
    category: '都市风情',
    location: '广东省',
    rating: 4.5,
    priceFrom: 1250,
    days: '2-3 天',
    bestSeason: '10 月-次年 4 月',
    gradient: ['#2F9BA8', '#1C717E'],
    image: 'https://tse2-mm.cn.bing.net/th/id/OIP-C.Bp20dUqVCiv1sKaDy0GWDQHaE7?pid=1.7',
    tags: ['天际线', '海滨', '科技感'],
    description: '四十多年长成的一座年轻都市，高楼与海岸线挤在同一帧画面里。白天逛华侨城创意园，傍晚去深圳湾看对岸香港的灯火，夜里再上平安金融中心俯瞰全城。',
    attractions: [
      { name: '深圳湾公园', time: '2 小时', desc: '沿海骑行与观鸟，傍晚可看对岸香港的灯火。' },
      { name: '平安金融中心 · 市民中心', time: '2-3 小时', desc: '福田中轴线的高楼群，云际观光层可俯瞰全城。' },
      { name: '大鹏所城 · 西涌', time: '一天', desc: '古城与海滩一线，是深圳少见的慢节奏去处。' },
    ],
  },
];

/* ---------- 本地示例数据：酒店 ---------- */
/*
 * 【维护约定】这份数组和 travel-server/sql/data.sql 里
 * `INSERT INTO hotel` 那 42 行必须逐字一致，改一边就要同步改另一边。
 * data.sql 文件头原先写着「由 gen-data-sql.js 生成」，但那个脚本已经不在仓库里了，
 * 现在是纯粹的手工双向同步。
 *
 * 字段名与后端 HotelDTO 完全对齐（注意简介叫 desc，不是 hotelDesc ——
 * 后端实体字段是 hotelDesc 以躲开 MySQL 的 desc 保留字，DTO 再改回 desc 给前端）。
 *
 * 价格是【每间每晚】，不是每人。人数对总价的影响体现在房间数上（每间住 2 人）。
 */
const MOCK_HOTELS = [
  // 1. 成都
  { id: 1,  destinationId: 1,  name: '春熙路 · 设计民宿',   star: 4, rating: 4.7, pricePerNight: 420,  district: '春熙路',   desc: '老楼改造的小院，出门就是太古里，晚上很安静。' },
  { id: 2,  destinationId: 1,  name: '宽窄巷子 · 川西客栈', star: 3, rating: 4.5, pricePerNight: 280,  district: '宽窄巷子', desc: '青砖木梁的川西院子，早上能吃到现做的抄手。' },
  { id: 3,  destinationId: 1,  name: '天府广场 · 云端酒店', star: 5, rating: 4.8, pricePerNight: 760,  district: '天府广场', desc: '高层落地窗正对城市中轴，行政酒廊含早餐。' },
  // 2. 杭州
  { id: 4,  destinationId: 2,  name: '西湖 · 湖景度假酒店', star: 5, rating: 4.9, pricePerNight: 980,  district: '西湖景区', desc: '推窗就是湖面，清晨沿苏堤散步五分钟可达。' },
  { id: 5,  destinationId: 2,  name: '龙井 · 茶山民宿',     star: 4, rating: 4.7, pricePerNight: 560,  district: '龙井村',   desc: '茶园环绕的独栋小楼，老板娘会泡自家新茶。' },
  { id: 6,  destinationId: 2,  name: '武林广场 · 商务酒店', star: 4, rating: 4.5, pricePerNight: 480,  district: '武林广场', desc: '地铁 1 号线直达，去西湖只要两站路。' },
  // 3. 西安
  { id: 7,  destinationId: 3,  name: '钟楼 · 城墙景观酒店', star: 5, rating: 4.8, pricePerNight: 720,  district: '钟楼',     desc: '房间正对城墙，夜里亮灯之后从窗边看很震撼。' },
  { id: 8,  destinationId: 3,  name: '回民街 · 关中客栈',   star: 3, rating: 4.4, pricePerNight: 300,  district: '回民街',   desc: '出门就是小吃街，老板会告诉你哪家泡馍地道。' },
  { id: 9,  destinationId: 3,  name: '大雁塔 · 唐风酒店',   star: 4, rating: 4.6, pricePerNight: 460,  district: '大雁塔',   desc: '仿唐建筑，晚上步行去不夜城只要十分钟。' },
  // 4. 三亚
  { id: 10, destinationId: 4,  name: '亚龙湾 · 海景度假村', star: 5, rating: 4.9, pricePerNight: 1200, district: '亚龙湾',   desc: '带私家沙滩，房间阳台正对南海。' },
  { id: 11, destinationId: 4,  name: '大东海 · 亲子酒店',   star: 4, rating: 4.6, pricePerNight: 680,  district: '大东海',   desc: '儿童泳池和托管服务齐全，适合带小孩来。' },
  { id: 12, destinationId: 4,  name: '后海村 · 冲浪民宿',   star: 3, rating: 4.7, pricePerNight: 380,  district: '后海村',   desc: '冲浪板免费借，天台能看到日落。' },
  // 5. 大理
  { id: 13, destinationId: 5,  name: '洱海 · 海景客栈',     star: 4, rating: 4.8, pricePerNight: 560,  district: '才村码头',    desc: '房间正对洱海，早上有海鸥停在阳台栏杆上。' },
  { id: 14, destinationId: 5,  name: '大理古城 · 白族院落', star: 4, rating: 4.6, pricePerNight: 420,  district: '古城人民路',  desc: '三坊一照壁的白族院子，院里有棵老桂花树。' },
  { id: 15, destinationId: 5,  name: '双廊 · 日出民宿',     star: 3, rating: 4.5, pricePerNight: 320,  district: '双廊古镇',    desc: '落地窗朝正东，躺在床上就能看日出。' },
  // 6. 北京
  { id: 16, destinationId: 6,  name: '王府井 · 老城酒店',   star: 5, rating: 4.7, pricePerNight: 980,  district: '王府井',   desc: '步行到故宫东华门十五分钟。' },
  { id: 17, destinationId: 6,  name: '什刹海 · 胡同四合院', star: 4, rating: 4.8, pricePerNight: 620,  district: '什刹海',   desc: '四合院改的，晚上能听见胡同里的自行车铃声。' },
  { id: 18, destinationId: 6,  name: '国贸 · 高层商务酒店', star: 4, rating: 4.5, pricePerNight: 580,  district: '国贸',     desc: '地铁 1 号线与 10 号线换乘站旁边。' },
  // 7. 厦门
  { id: 19, destinationId: 7,  name: '鼓浪屿 · 老别墅酒店', star: 5, rating: 4.8, pricePerNight: 860,  district: '鼓浪屿',   desc: '民国老别墅改造，院子里有棵百年榕树。' },
  { id: 20, destinationId: 7,  name: '环岛路 · 海景民宿',   star: 4, rating: 4.6, pricePerNight: 520,  district: '环岛路',   desc: '出门就是沙滩，可以借自行车骑环岛路。' },
  { id: 21, destinationId: 7,  name: '中山路 · 骑楼客栈',   star: 3, rating: 4.4, pricePerNight: 340,  district: '中山路',   desc: '骑楼老建筑，楼下就是开了几十年的沙茶面。' },
  // 8. 丽江
  { id: 22, destinationId: 8,  name: '大研古城 · 纳西院落', star: 4, rating: 4.7, pricePerNight: 460,  district: '大研古城', desc: '纳西风格三合院，不挨着酒吧街，晚上很安静。' },
  { id: 23, destinationId: 8,  name: '束河 · 溪边客栈',     star: 3, rating: 4.6, pricePerNight: 300,  district: '束河古镇', desc: '院里有溪水流过，比大研清净得多。' },
  { id: 24, destinationId: 8,  name: '玉龙雪山 · 观景酒店', star: 5, rating: 4.8, pricePerNight: 780,  district: '白沙古镇', desc: '天气好的时候在房间里就能看到雪山主峰。' },
  // 9. 广州
  { id: 25, destinationId: 9,  name: '珠江新城 · 云端酒店',   star: 5, rating: 4.7, pricePerNight: 780, district: '珠江新城', desc: '高层能俯瞰珠江夜景和小蛮腰。' },
  { id: 26, destinationId: 9,  name: '上下九 · 西关骑楼客栈', star: 4, rating: 4.5, pricePerNight: 420, district: '上下九',   desc: '骑楼老宅改造，出门就是小吃一条街。' },
  { id: 27, destinationId: 9,  name: '沙面 · 江畔精品酒店',   star: 4, rating: 4.6, pricePerNight: 520, district: '沙面',     desc: '欧陆风情的老租界区，安静，也很好拍。' },
  // 10. 武汉
  { id: 28, destinationId: 10, name: '江汉路 · 江景酒店',   star: 5, rating: 4.6, pricePerNight: 680,  district: '江汉路', desc: '正对长江，晚上能看两岸的灯光秀。' },
  { id: 29, destinationId: 10, name: '户部巷 · 老城客栈',   star: 3, rating: 4.4, pricePerNight: 280,  district: '户部巷', desc: '步行到黄鹤楼十分钟，楼下是热干面老店。' },
  { id: 30, destinationId: 10, name: '东湖 · 湖畔度假酒店', star: 4, rating: 4.7, pricePerNight: 520,  district: '东湖',   desc: '临湖而建，早上可以沿着湖跑一圈。' },
  // 11. 长沙
  { id: 31, destinationId: 11, name: '五一广场 · 设计酒店', star: 5, rating: 4.7, pricePerNight: 620,  district: '五一广场', desc: '地铁 1、2 号线换乘站旁边，去哪都方便。' },
  { id: 32, destinationId: 11, name: '太平街 · 老巷民宿',   star: 3, rating: 4.5, pricePerNight: 300,  district: '太平街',   desc: '老街深处的院子，晚上出门就是小吃摊。' },
  { id: 33, destinationId: 11, name: '橘子洲 · 江景酒店',   star: 4, rating: 4.6, pricePerNight: 460,  district: '橘子洲',   desc: '房间能看到湘江和橘子洲头。' },
  // 12. 南京
  { id: 34, destinationId: 12, name: '夫子庙 · 秦淮河景酒店', star: 5, rating: 4.7, pricePerNight: 680, district: '夫子庙', desc: '推窗就是秦淮河，晚上能看画舫来往。' },
  { id: 35, destinationId: 12, name: '老门东 · 明清院落客栈', star: 4, rating: 4.6, pricePerNight: 440, district: '老门东', desc: '明清风格院落，青砖小瓦，出门就是老街。' },
  { id: 36, destinationId: 12, name: '新街口 · 商务酒店',     star: 4, rating: 4.4, pricePerNight: 400, district: '新街口', desc: '地铁 1、2 号线换乘，逛街吃饭都方便。' },
  // 13. 上海
  { id: 37, destinationId: 13, name: '外滩 · 江景酒店',     star: 5, rating: 4.9, pricePerNight: 1100, district: '外滩',     desc: '正对陆家嘴三件套，这一片窗景是上海最贵的。' },
  { id: 38, destinationId: 13, name: '武康路 · 老洋房民宿', star: 4, rating: 4.8, pricePerNight: 720,  district: '武康路',   desc: '梧桐区老洋房改造，楼下就是武康大楼。' },
  { id: 39, destinationId: 13, name: '人民广场 · 商务酒店', star: 4, rating: 4.5, pricePerNight: 600,  district: '人民广场', desc: '地铁 1、2、8 号线三线换乘，去机场直达。' },
  // 14. 深圳
  { id: 40, destinationId: 14, name: '深圳湾 · 海景公寓酒店', star: 5, rating: 4.7, pricePerNight: 860, district: '深圳湾',   desc: '高层正对深圳湾，天气好能看到对岸的香港。' },
  { id: 41, destinationId: 14, name: '华侨城 · 创意园酒店',   star: 4, rating: 4.6, pricePerNight: 560, district: '华侨城',   desc: '挨着创意园和美术馆，住的多是年轻人。' },
  { id: 42, destinationId: 14, name: '大鹏所城 · 海边民宿',   star: 3, rating: 4.5, pricePerNight: 380, district: '大鹏新区', desc: '古城里的院子，步行到西涌沙滩二十分钟。' },
];
