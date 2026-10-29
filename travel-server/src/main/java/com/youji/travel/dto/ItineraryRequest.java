package com.youji.travel.dto;

import lombok.Data;

/**
 * AI 行程规划的请求体。
 *
 * 字段校验在 AiItineraryService 里手动做：项目没引 spring-boot-starter-validation，
 * 和注册/登录保持一致的处理方式 —— 非法参数抛 ApiException.badRequest，
 * 由 GlobalExceptionHandler 统一转成 {"message": "中文提示"}。
 */
@Data
public class ItineraryRequest {

    /** 目的地 ID，必填 */
    private Long destinationId;

    /** 玩几天，1-15，不传按 3 天算 */
    private Integer days;

    /** 旅行偏好，选填：例如「想吃地道小吃，不想太赶」 */
    private String preference;
}
