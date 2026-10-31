-- 目的地热门排行：增加热度分并初始化
-- 存量库执行一次

ALTER TABLE destination
  ADD COLUMN hot_score INT NOT NULL DEFAULT 60 COMMENT '热度分（0-100，编辑综合公开榜单给出）' AFTER highlight_desc;

UPDATE destination SET hot_score = 96 WHERE id = 1;
UPDATE destination SET hot_score = 94 WHERE id = 2;
UPDATE destination SET hot_score = 95 WHERE id = 3;
UPDATE destination SET hot_score = 90 WHERE id = 4;
UPDATE destination SET hot_score = 82 WHERE id = 5;
UPDATE destination SET hot_score = 98 WHERE id = 6;
UPDATE destination SET hot_score = 88 WHERE id = 7;
UPDATE destination SET hot_score = 83 WHERE id = 8;
UPDATE destination SET hot_score = 78 WHERE id = 9;
UPDATE destination SET hot_score = 80 WHERE id = 10;
UPDATE destination SET hot_score = 79 WHERE id = 11;
UPDATE destination SET hot_score = 81 WHERE id = 12;
UPDATE destination SET hot_score = 92 WHERE id = 13;
UPDATE destination SET hot_score = 76 WHERE id = 14;
UPDATE destination SET hot_score = 93 WHERE id = 15;
UPDATE destination SET hot_score = 86 WHERE id = 16;
UPDATE destination SET hot_score = 85 WHERE id = 17;
UPDATE destination SET hot_score = 84 WHERE id = 18;
UPDATE destination SET hot_score = 87 WHERE id = 19;
UPDATE destination SET hot_score = 89 WHERE id = 20;
