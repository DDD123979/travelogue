package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 互动事件：别人对我的帖子点赞 / 收藏 / 评论时写一条。
 * 主键同时充当前端轮询的游标（afterId），所以不需要额外的已读表。
 */
@Data
@TableName("post_event")
public class PostEvent {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long postId;

    /** 帖子作者，也就是收到通知的人 */
    private String owner;

    /** 操作的人 */
    private String actor;

    /** like / favorite / comment */
    private String type;

    /** 评论内容，其他类型为空串 */
    private String content;

    private LocalDateTime createdAt;
}
