-- 社区分享：建表 + 3 条示例数据
-- 在存量库上执行一次

CREATE TABLE IF NOT EXISTS travel_post (
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

INSERT INTO travel_post (username, destination_id, content, images, like_count, created_at) VALUES
('dou123', 1, '第一次去成都，最大的经验是：熊猫基地一定要早上八点前进园。中午熊猫全在睡觉，看到的都是毛球。下午去宽窄巷子喝茶，一天刚刚好。', '', 12, NOW() - INTERVAL 2 DAY),
('dou123', 6, '故宫真的太大了，中轴线走完就已经累瘫。建议午门进、神武门出，东西六宫挑两个看，珍宝馆别错过。提前七天抢票，手慢无。', '', 27, NOW() - INTERVAL 1 DAY),
('dou123', 21, '龙门石窟比想象中震撼，卢舍那大佛那一龛光线最好的是下午。从北门进、南门出，一路走一路看，三个小时不太够。', '/img/destinations/luoyang.jpg', 8, NOW() - INTERVAL 5 HOUR);