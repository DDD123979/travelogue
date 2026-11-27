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
DROP TABLE IF EXISTS travel_post;
DROP TABLE IF EXISTS destination_attraction;
DROP TABLE IF EXISTS destination_tag;
DROP TABLE IF EXISTS destination;
DROP TABLE IF EXISTS t_user;

-- ---------------------------------------------------------
-- 用户表（表名用 t_user：user 在 MySQL 里是保留字）
-- ---------------------------------------------------------
CREATE TABLE t_user (
  id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_no       CHAR(8)      NOT NULL                COMMENT '账号 ID（8 位，不可修改）',
  username      VARCHAR(50)  NOT NULL                COMMENT '登录名',
  nickname      VARCHAR(50)  NOT NULL DEFAULT ''        COMMENT '昵称（展示名）',
  password_hash VARCHAR(100) NOT NULL                COMMENT 'BCrypt 哈希（定长 60，留够余量）',
  avatar        VARCHAR(255) NOT NULL DEFAULT ''        COMMENT '头像图片地址',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_no (user_no),
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
  highlight_name VARCHAR(80)  NOT NULL DEFAULT '' COMMENT '最特色景点名',
  highlight_desc VARCHAR(600) NOT NULL DEFAULT '' COMMENT '该景点的详细介绍',
  hot_score      INT          NOT NULL DEFAULT 60 COMMENT '热度分（0-100，编辑综合公开榜单给出）',
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
  attraction_type VARCHAR(20) NOT NULL DEFAULT '人文古迹' COMMENT '景点类型：自然生态 / 人文古迹 / 街区市集 / 观景夜景',
  duration       VARCHAR(20)  NOT NULL                COMMENT '建议时长，如 2-3 小时',
  attr_desc      VARCHAR(300) NOT NULL                COMMENT '景点说明',
  sort_order     INT          NOT NULL DEFAULT 0      COMMENT '同一目的地内的展示顺序',
  PRIMARY KEY (id),
  KEY idx_destination (destination_id, sort_order),
  KEY idx_type (attraction_type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '推荐景点';

-- ---------------------------------------------------------
-- 社区分享（旅行心得 + 照片）
--   images 存逗号分隔的地址，不单独开图片表：一条最多 4 张，拆表要多个 join
-- ---------------------------------------------------------
CREATE TABLE travel_post (
  id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  username       VARCHAR(50)  NOT NULL                COMMENT '作者用户名',
  destination_id BIGINT       NOT NULL                COMMENT '关联目的地',
  content        VARCHAR(800) NOT NULL                COMMENT '心得正文',
  images         VARCHAR(1000) NOT NULL DEFAULT ''    COMMENT '逗号分隔的图片地址',
  like_count     INT          NOT NULL DEFAULT 0      COMMENT '点赞数',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (id),
  KEY idx_time (created_at),
  KEY idx_destination (destination_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '社区分享';

-- ---------------------------------------------------------
-- 社区互动：点赞 / 收藏 / 评论（一人一条，唯一键去重）
--   点赞改为按人去重后，like_count 只作为冗余展示值，真实数据以 post_like 为准
-- ---------------------------------------------------------
CREATE TABLE post_like (
  id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  post_id    BIGINT      NOT NULL                COMMENT '帖子 ID',
  username   VARCHAR(50) NOT NULL                COMMENT '点赞人',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_like_post_user (post_id, username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子点赞（一人一条）';

CREATE TABLE post_favorite (
  id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  post_id    BIGINT      NOT NULL                COMMENT '帖子 ID',
  username   VARCHAR(50) NOT NULL                COMMENT '收藏人',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fav_post_user (post_id, username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子收藏（一人一条）';

CREATE TABLE post_comment (
  id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  post_id    BIGINT       NOT NULL                COMMENT '帖子 ID',
  username   VARCHAR(50)  NOT NULL                COMMENT '评论人',
  content    VARCHAR(300) NOT NULL                COMMENT '评论内容',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comment_post (post_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子评论';

-- ---------------------------------------------------------
-- 互动通知：别人赞 / 收藏 / 评论我的帖子时留一条事件
--   自增主键同时作为轮询游标，前端记录 afterId 只取增量，不用建已读表
-- ---------------------------------------------------------
CREATE TABLE post_event (
  id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键（同时作为游标）',
  post_id    BIGINT       NOT NULL                COMMENT '被互动的帖子',
  owner      VARCHAR(50)  NOT NULL                COMMENT '帖子作者（收通知的人）',
  actor      VARCHAR(50)  NOT NULL                COMMENT '操作人',
  type       VARCHAR(12)  NOT NULL                COMMENT 'like / favorite / comment',
  content    VARCHAR(300) NOT NULL DEFAULT ''     COMMENT '评论内容（仅 comment）',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_owner_id (owner, id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子互动通知';
