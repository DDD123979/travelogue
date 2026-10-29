package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 目的地标签（卡片上的「火锅」「大熊猫」这类小标签）。
 * sortOrder 不能省：没有它数组顺序不确定，前端按下标渲染会串位。
 */
@Data
@TableName("destination_tag")
public class DestinationTag {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long destinationId;

    private String tag;

    private Integer sortOrder;
}
