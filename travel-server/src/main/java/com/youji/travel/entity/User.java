package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户（表名 t_user：user 在 MySQL 里是保留字）
 *
 * 字段名 passwordHash 会自动映射到列 password_hash（驼峰转下划线默认开启）。
 * 注意：实体里不要写表里没有的字段，MyBatis-Plus 会把它拼进 SELECT 导致 Unknown column。
 */
@Data
@TableName("t_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    /** BCrypt 哈希，不存明文 */
    private String passwordHash;

    private LocalDateTime createdAt;
}
