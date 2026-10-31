package com.youji.travel.dto;

import lombok.Data;

/** 一条评论 */
@Data
public class CommentDTO {

    private Long id;

    private Long postId;

    private String username;

    /** 作者头像地址，可为空串（没设置过就显示用户名首字） */
    private String avatar;

    private String content;

    /** yyyy-MM-dd HH:mm */
    private String createdAt;
}
