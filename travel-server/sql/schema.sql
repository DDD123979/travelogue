-- =========================================================
-- 游迹 · 旅游网站 建库建表脚本（MySQL 8.0）
--
-- 执行方式（Windows 下建议先 chcp 65001 切到 UTF-8，否则中文会变问号）：
--   mysql -uroot -p123456 --default-character-set=utf8mb4 < schema.sql
--
-- 注意：本文件末尾没有 BOM，改文件时也别存成带 BOM 的 UTF-8，
--       否则 mysql 客户端会在第一条语句报 ERROR 1064。
-- =========================================================

CREATE DATABASE IF NOT EXISTS travel_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE travel_db;

-- 有外键依赖，先删从表
DROP TABLE IF EXISTS booking_order;
DROP TABLE IF EXISTS hotel;
DROP TABLE IF EXISTS destination_attraction;
DROP TABLE IF EXISTS destination_tag;
DROP TABLE IF EXISTS destination;
DROP TABLE IF EXISTS t_user;

-- ---------------------------------------------------------
-- 用户表（表名用 t_user：user 在 MySQL 里是保留字）
-- ---------------------------------------------------------
CREATE TABLE t_user (
  id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  username      VARCHAR(50)  NOT NULL                COMMENT '登录名',
  password_hash VARCHAR(100) NOT NULL                COMMENT 'BCrypt 哈希（定长 60，留够余量）',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户';

-- ---------------------------------------------------------
-- 目的地表
--   days / best_season 必须是字符串：前端展示的是「3-4 天」「3-5 月 / 9-11 月」
--   rating 用 DECIMAL(2,1)：用 float 会被序列化成 4.800000190734863
--   sort_order 控制列表顺序，前端首页只取前 6 条
-- ---------------------------------------------------------
CREATE TABLE destination (
  id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键，前端路由 /destinations/{id} 直接用它',
  name           VARCHAR(50)  NOT NULL                COMMENT '中文名',
  en_name        VARCHAR(50)  NOT NULL                COMMENT '英文名',
  category       VARCHAR(20)  NOT NULL                COMMENT '分类：美食休闲/江南水乡/历史古迹/海岛度假/自然风光/都市风情',
  location       VARCHAR(50)  NOT NULL                COMMENT '省份或直辖市',
  rating         DECIMAL(2,1) NOT NULL DEFAULT 0.0    COMMENT '评分',
  price_from     INT          NOT NULL DEFAULT 0      COMMENT '参考价（元/人起）',
  days           VARCHAR(20)  NOT NULL                COMMENT '建议游玩时长，如 3-4 天',
  best_season    VARCHAR(30)  NOT NULL                COMMENT '最佳季节',
  gradient_start VARCHAR(9)   NOT NULL                COMMENT '封面兜底渐变起始色',
  gradient_end   VARCHAR(9)   NOT NULL                COMMENT '封面兜底渐变结束色',
  image          VARCHAR(500) NOT NULL DEFAULT ''     COMMENT '封面照片地址，可为空（为空则前端用渐变）',
  description    VARCHAR(500) NOT NULL DEFAULT ''     COMMENT '目的地介绍',
  sort_order     INT          NOT NULL DEFAULT 0      COMMENT '展示顺序',
  PRIMARY KEY (id),
  KEY idx_sort (sort_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '目的地';

-- ---------------------------------------------------------
-- 目的地标签（卡片上的 2-3 个标签）
--   sort_order 不能省：没有它数组顺序不确定，前端按顺序渲染会串位
-- ---------------------------------------------------------
CREATE TABLE destination_tag (
  id             BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  destination_id BIGINT      NOT NULL                COMMENT '所属目的地',
  tag            VARCHAR(30) NOT NULL                COMMENT '标签文字',
  sort_order     INT         NOT NULL DEFAULT 0      COMMENT '同一目的地内的展示顺序',
  PRIMARY KEY (id),
  KEY idx_destination (destination_id, sort_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '目的地标签';

-- ---------------------------------------------------------
-- 推荐景点
--   attr_desc：desc 是 MySQL 保留字，列名叫 desc 会导致 SELECT 语法错误。
--              【实体字段也必须跟着改叫 attrDesc】—— 若实体字段叫 desc，
--              MyBatis-Plus 会生成 `attr_desc AS desc`，别名仍然是保留字，照样语法错误。
--              改叫 attrDesc 后，Jackson 输出给前端的仍是 "desc"（AttractionDTO 的字段名）
--   duration：返回给前端时字段名为 "time"
-- ---------------------------------------------------------
CREATE TABLE destination_attraction (
  id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  destination_id BIGINT       NOT NULL                COMMENT '所属目的地',
  name           VARCHAR(80)  NOT NULL                COMMENT '景点名',
  duration       VARCHAR(20)  NOT NULL                COMMENT '建议时长，如 2-3 小时',
  attr_desc      VARCHAR(300) NOT NULL                COMMENT '景点说明',
  sort_order     INT          NOT NULL DEFAULT 0      COMMENT '同一目的地内的展示顺序',
  PRIMARY KEY (id),
  KEY idx_destination (destination_id, sort_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '推荐景点';

-- ---------------------------------------------------------
-- 酒店（「预订」页用户可选的住宿）
--   price_per_night：单价按【每间每晚】记，不按人头 ——
--     酒店报价天然是房价，按人头会把「2 大人带 1 小孩住一间」算成 3 份钱。
--     人数对总价的影响通过 booking_order.rooms 体现（每间住 2 人）。
--   hotel_desc：同样躲 desc 保留字，理由见上面 destination_attraction 那段。
--   star 不用单独存「档次」文案：前端按星级渲染成 ★，多一列反而要和 star 保持同步。
--   没有 image 列：酒店在页面上是文字行不是照片卡，省掉 42 张外链图片的逐条验证成本
--     （见 api.js 里关于 Bing CDN 的那段注释）。以后要加封面，补列 + 在 HotelDTO 里多塞字段即可。
-- ---------------------------------------------------------
CREATE TABLE hotel (
  id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  destination_id  BIGINT       NOT NULL                COMMENT '所属目的地，逻辑关联 destination.id（全项目不用外键）',
  name            VARCHAR(60)  NOT NULL                COMMENT '酒店名。用描述性名称而非真实品牌名：本表价格是演示数据，安到真实酒店头上不合适',
  star            TINYINT      NOT NULL DEFAULT 3      COMMENT '星级 1-5，前端渲染成 ★',
  price_per_night INT          NOT NULL DEFAULT 0      COMMENT '每间每晚价格（元）',
  district        VARCHAR(30)  NOT NULL DEFAULT ''     COMMENT '所在片区，如 春熙路 / 西湖景区',
  rating          DECIMAL(2,1) NOT NULL DEFAULT 0.0    COMMENT '评分，用 DECIMAL 不用 float（float 会序列化成 4.800000190734863）',
  hotel_desc      VARCHAR(200) NOT NULL DEFAULT ''     COMMENT '一句话简介',
  sort_order      INT          NOT NULL DEFAULT 0      COMMENT '同一目的地内的展示顺序',
  PRIMARY KEY (id),
  KEY idx_destination (destination_id, sort_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '酒店';

-- ---------------------------------------------------------
-- 预订订单
--   表名不能叫 order：order 是 MySQL 保留字（和 user → t_user 同一类问题），
--   建表叫 `order` 会让后面的 SELECT 直接语法错误。
--
--   四处【下单时的快照】是刻意的：destination_name / hotel_name / unit_price / rooms。
--     酒店改名、调价、甚至下架，历史订单上的成交信息都不会跟着变 ——
--     订单记的是「当时谈好的事」，不是「现在数据库里是什么」。
--     顺带的好处：「我的订单」一条 SQL 就够，不用 join 三张表。
--
--   username 存用户名而不是 user_id：token 里存的就是用户名
--     （TokenService.resolveUsername 返回 String），前端拿不到用户 id。
--
--   rooms = ceil(people / 2)，每间住 2 人，恒 ≥ 1 间 —— 1 人也要占一间。
--   total_amount = unit_price × rooms × days，由【后端】算，绝不接受前端传值。
--
--   金额一律 INT（整元）：没有精度问题，和 destination.price_from 的口径也一致。
-- ---------------------------------------------------------
CREATE TABLE booking_order (
  id               BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  order_no         VARCHAR(24) NOT NULL                COMMENT '订单号，形如 YJ20260915482910，展示用',
  username         VARCHAR(50) NOT NULL                COMMENT '下单用户名，逻辑关联 t_user.username',
  destination_id   BIGINT      NOT NULL                COMMENT '目的地 ID',
  destination_name VARCHAR(50) NOT NULL                COMMENT '目的地名称快照',
  hotel_id         BIGINT      NOT NULL                COMMENT '酒店 ID',
  hotel_name       VARCHAR(60) NOT NULL                COMMENT '酒店名称快照',
  check_in         DATE        NOT NULL                COMMENT '入住日期',
  days             INT         NOT NULL                COMMENT '入住晚数',
  people           INT         NOT NULL                COMMENT '入住人数',
  rooms            INT         NOT NULL                COMMENT '房间数 = ceil(人数 / 2)，每间住 2 人；下单时算好存下来，以后改规则不影响历史订单',
  unit_price       INT         NOT NULL                COMMENT '下单时的每间每晚单价快照（元）',
  total_amount     INT         NOT NULL                COMMENT '总价（元）= unit_price × rooms × days',
  status           VARCHAR(10) NOT NULL DEFAULT '已预订' COMMENT '订单状态：已预订 / 已取消',
  created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_username (username, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '预订订单';
