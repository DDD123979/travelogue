package com.youji.travel.dto;

import lombok.Data;

/** 一条评论 */
@Data
public class CommentDTO {

    private Long id;

    private Long postId;

    private String username;

    private String content;

    /** yyyy-MM-dd HH:mm */
    private String createdAt;
}
