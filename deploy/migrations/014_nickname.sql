-- 独立昵称：与登录名分开
ALTER TABLE t_user
  ADD COLUMN nickname VARCHAR(50) NOT NULL DEFAULT '' COMMENT '昵称（展示名）' AFTER username;

-- 存量用户昵称默认取用户名
UPDATE t_user SET nickname = username WHERE nickname = '';