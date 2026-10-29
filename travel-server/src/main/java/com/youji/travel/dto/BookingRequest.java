package com.youji.travel.dto;

import lombok.Data;

/**
 * 创建预订的请求体。
 *
 * 【没有 totalAmount 字段】是故意的：总价由后端用数据库里的单价算。
 * 请求体里放价格，等于让用户自己定价。
 *
 * checkIn 用 String 而不是 LocalDate：这样日期解析完全由 BookingService 掌控，
 * 格式不对能给出「入住日期格式不对，应为 yyyy-MM-dd」这种中文提示；
 * 用 LocalDate 的话 Jackson 反序列化失败会直接变成 400「请求体格式不正确」，看不出是哪一项的错。
 *
 * 校验全在 BookingService 里手写 if —— 项目没引 spring-boot-starter-validation，
 * 和注册/登录/AI 行程保持一致的处理方式。
 */
@Data
public class BookingRequest {

    private Long destinationId;

    private Long hotelId;

    /** 入住日期，格式 yyyy-MM-dd */
    private String checkIn;

    /** 入住晚数 1-15，与 AiItineraryService 的 MIN_DAYS/MAX_DAYS 同口径 */
    private Integer days;

    /** 入住人数 1-20 */
    private Integer people;
}
