package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 当前登录用户，只暴露用户名，不带密码哈希 */
@Data
@AllArgsConstructor
public class UserDTO {

    private String username;
}
