-- 用户头像：t_user 加 avatar 列
ALTER TABLE t_user
  ADD COLUMN avatar VARCHAR(255) NOT NULL DEFAULT '' COMMENT '头像图片地址' AFTER password_hash;