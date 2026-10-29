package com.youji.travel.dto;

import lombok.Data;

/**
 * 返回给前端的订单。
 *
 * 字段全是下单时的快照，所以「我的订单」不需要再查酒店表和目的地表。
 *
 * checkIn / createdAt 都格式化成 String 再返回：
 *   checkIn   → "2026-09-20"
 *   createdAt → "2026-09-15 21:30"
 * 这样前端直接渲染即可，也不用依赖 Jackson 的日期序列化配置。
 * （Jackson 默认会把 LocalDateTime 写成 "2026-09-15T21:30:12"，带个 T 还要前端 replace）。
 */
@Data
public class BookingDTO {

    private Long id;

    private String orderNo;

    private Long destinationId;

    private String destinationName;

    private Long hotelId;

    private String hotelName;

    /** 入住日期，yyyy-MM-dd */
    private String checkIn;

    /** 入住晚数 */
    private Integer days;

    private Integer people;

    /** 房间数 = ceil(人数 / 2) */
    private Integer rooms;

    /** 下单时的每间每晚单价（元） */
    private Integer unitPrice;

    /** 总价（元）= unitPrice × rooms × days */
    private Integer totalAmount;

    /** 已预订 / 已取消 */
    private String status;

    /** 下单时间，yyyy-MM-dd HH:mm */
    private String createdAt;
}
