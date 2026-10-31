-- 互动通知：别人赞/收藏/评论我的帖子时留一条事件
-- 在存量库上执行一次

CREATE TABLE IF NOT EXISTS post_event (
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
