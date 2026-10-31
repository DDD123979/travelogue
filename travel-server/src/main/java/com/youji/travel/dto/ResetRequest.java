package com.youji.travel.dto;

import lombok.Data;

/** 忘记密码流程的请求体 */
@Data
public class ResetRequest {

    private String username;

    private String code;

    private String newPassword;
}
