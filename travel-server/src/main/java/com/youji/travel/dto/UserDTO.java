package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 当前登录用户，只暴露用户名，不带密码哈希 */
@Data
@AllArgsConstructor
public class UserDTO {

    private String username;

    /** 账号 ID：8 位数字，不可修改 */
    private String userNo;

    /** 昵称（展示名） */
    private String nickname;

    /** 头像地址，可为空串 */
    private String avatar;
}
