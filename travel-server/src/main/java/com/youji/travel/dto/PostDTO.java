package com.youji.travel.dto;

import lombok.Data;

import java.util.List;

/**
 * 社区帖子，字段名与前端契约一致。
 */
@Data
public class PostDTO {

    private Long id;

    private String username;

    /** 作者头像地址，可为空串（没设置过就显示用户名首字） */
    private String avatar;

    private Long destinationId;

    /** 目的地名，列表页直接展示，省得前端再查一次 */
    private String destinationName;

    private String content;

    /** 图片地址列表 */
    private List<String> images;

    private Integer likeCount;

    /** 评论数 */
    private Long commentCount;

    /** 当前登录用户是否点过赞 */
    private Boolean liked;

    /** 当前登录用户是否收藏过 */
    private Boolean favorited;

    /** yyyy-MM-dd HH:mm */
    private String createdAt;
}
