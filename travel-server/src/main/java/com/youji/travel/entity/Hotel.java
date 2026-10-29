package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 酒店（「预订」页用户可选的住宿）。
 *
 * 字段名 hotelDesc 对应列 hotel_desc —— 不能叫 desc，那是 MySQL 保留字，
 * 而且【实体字段也必须跟着改】：字段叫 desc 时 MyBatis-Plus 会生成
 * `hotel_desc AS desc`，别名仍是保留字，照样语法错误（destination_attraction 踩过）。
 *
 * 注意：实体里不要写表里没有的字段，MyBatis-Plus 会把它拼进 SELECT 导致 Unknown column。
 */
@Data
@TableName("hotel")
public class Hotel {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属目的地，逻辑关联 destination.id（全项目不用外键） */
    private Long destinationId;

    private String name;

    /** 星级 1-5，前端渲染成 ★ */
    private Integer star;

    /** 每间每晚价格（元）。是「每间」不是「每人」，人数影响的是房间数 */
    private Integer pricePerNight;

    /** 所在片区，如 春熙路 */
    private String district;

    /** 用 BigDecimal 不用 Double：Double 会序列化成 4.800000190734863 */
    private BigDecimal rating;

    /** 一句话简介，列名 hotel_desc */
    private String hotelDesc;

    private Integer sortOrder;
}
