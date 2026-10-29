package com.youji.travel.dto;

import lombok.Data;

/** 注册 / 登录的请求体：{ "username": "...", "password": "..." } */
@Data
public class AuthRequest {

    private String username;

    private String password;
}
