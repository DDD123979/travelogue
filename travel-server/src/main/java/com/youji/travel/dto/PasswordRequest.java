package com.youji.travel.dto;

import lombok.Data;

/** 修改密码的请求体 */
@Data
public class PasswordRequest {

    private String oldPassword;

    private String newPassword;
}
