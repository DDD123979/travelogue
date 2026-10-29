package com.youji.travel.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 返回给前端的酒店。
 *
 * desc 这个名字和 AttractionDTO 保持一致（实体的 hotelDesc → 前端的 desc），
 * 让前端两处「简介」字段的叫法统一。不进 Redis，不需要 @NoArgsConstructor。
 */
@Data
public class HotelDTO {

    private Long id;

    private Long destinationId;

    private String name;

    /** 星级 1-5 */
    private Integer star;

    /** 每间每晚价格（元） */
    private Integer pricePerNight;

    private String district;

    private BigDecimal rating;

    /** 一句话简介，来自实体的 hotelDesc（列名 hotel_desc） */
    private String desc;
}
