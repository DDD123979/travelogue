-- 账号 ID：注册时生成的 8 位数字，终身不变
ALTER TABLE t_user
  ADD COLUMN user_no CHAR(8) NOT NULL DEFAULT '' COMMENT '账号 ID（8 位，不可修改）' AFTER id;

-- 存量用户补一个随机 8 位 ID（本项目用户量很小，直接随机即可）
UPDATE t_user SET user_no = LPAD(FLOOR(RAND() * 90000000) + 10000001, 8, '0') WHERE user_no = '';

ALTER TABLE t_user ADD UNIQUE KEY uk_user_no (user_no);
