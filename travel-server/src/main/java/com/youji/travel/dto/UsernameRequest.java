package com.youji.travel.dto;

import lombok.Data;

/** 修改用户名的请求体：需要当前密码二次确认 */
@Data
public class UsernameRequest {

    private String newUsername;

    private String password;
}
