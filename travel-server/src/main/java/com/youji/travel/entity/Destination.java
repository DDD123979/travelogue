package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 目的地。
 *
 * 几个字段类型是刻意这么定的，别改：
 *   - days / bestSeason 用 String：前端展示的是「3-4 天」「3-5 月 / 9-11 月」
 *   - rating 用 BigDecimal：对应 DECIMAL(2,1)，用 float 会序列化成 4.800000190734863
 *   - gradientStart / gradientEnd 分开存，组装 DTO 时拼成两元素数组
 */
@Data
@TableName("destination")
public class Destination {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String enName;

    private String category;

    private String location;

    private BigDecimal rating;

    private Integer priceFrom;

    private String days;

    private String bestSeason;

    private String gradientStart;

    private String gradientEnd;

    private String image;

    private String description;


    /** 最特色景点名 + 详细介绍（攻略版块） */

    private String highlightName;


    private String highlightDesc;



    /** 热度分 0-100，排行页按它排序 */


    private Integer hotScore;
    private Integer sortOrder;
}
