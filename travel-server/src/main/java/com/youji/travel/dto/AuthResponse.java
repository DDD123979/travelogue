package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 注册 / 登录成功后的返回体：{ username, token }
 *
 * token 必须非空：前端 api.js 里是 `if (data.token)` 才写 localStorage，
 * 返回空 token 会导致刷新页面就掉登录。
 */
@Data
@AllArgsConstructor
public class AuthResponse {

    private String username;

    private String token;

    /** 头像地址，前端直接拿去渲染，省一次请求 */
    private String avatar;
}
