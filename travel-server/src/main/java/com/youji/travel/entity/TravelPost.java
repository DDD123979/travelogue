package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 社区帖子：一次旅行的心得 + 若干张照片。
 *
 * images 存的是逗号分隔的图片地址（如 /uploads/a.jpg,/uploads/b.jpg），
 * 没有单独开图片表 —— 一条帖子最多 4 张图，拆表反而要多一次查询。
 */
@Data
@TableName("travel_post")
public class TravelPost {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 作者用户名 */
    private String username;

    /** 关联的目的地 */
    private Long destinationId;

    /** 心得正文 */
    private String content;

    /** 逗号分隔的图片地址，可为空串 */
    private String images;

    private Integer likeCount;

    private LocalDateTime createdAt;
}
