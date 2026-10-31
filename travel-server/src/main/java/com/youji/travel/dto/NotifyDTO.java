package com.youji.travel.dto;

import lombok.Data;

/** 一条互动通知 */
@Data
public class NotifyDTO {

    private Long id;

    /** like / favorite / comment */
    private String type;

    private Long postId;

    /** 操作人的用户名（用于点击跳转等） */
    private String actor;

    /** 操作人的昵称（展示用） */
    private String actorName;

    /** 操作人头像 */
    private String actorAvatar;

    /** 评论内容（其他类型为空） */
    private String content;

    private String createdAt;
}
