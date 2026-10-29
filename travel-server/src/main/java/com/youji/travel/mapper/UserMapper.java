package com.youji.travel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.youji.travel.entity.User;

/** 继承了 BaseMapper 就有基础 CRUD，无需写 SQL */
public interface UserMapper extends BaseMapper<User> {
}
