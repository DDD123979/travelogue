-- 社区互动：点赞（按人去重）、收藏、评论
-- 在存量库上执行一次

CREATE TABLE IF NOT EXISTS post_like (
  id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  post_id    BIGINT      NOT NULL                COMMENT '帖子 ID',
  username   VARCHAR(50) NOT NULL                COMMENT '点赞人',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_like_post_user (post_id, username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子点赞（一人一条）';

CREATE TABLE IF NOT EXISTS post_favorite (
  id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  post_id    BIGINT      NOT NULL                COMMENT '帖子 ID',
  username   VARCHAR(50) NOT NULL                COMMENT '收藏人',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fav_post_user (post_id, username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子收藏（一人一条）';

CREATE TABLE IF NOT EXISTS post_comment (
  id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  post_id    BIGINT       NOT NULL                COMMENT '帖子 ID',
  username   VARCHAR(50)  NOT NULL                COMMENT '评论人',
  content    VARCHAR(300) NOT NULL                COMMENT '评论内容',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comment_post (post_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子评论';

-- 历史 like_count 是写死的展示值，点赞改为按人去重后统一归零，避免和 post_like 真实计数打架
UPDATE travel_post SET like_count = 0;
