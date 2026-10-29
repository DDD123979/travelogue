package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 返回给前端的完整目的地结构，字段名与 travel-app/README.md 的契约逐字对应。
 *
 * 缓存到 Redis 时要经过 Jackson 反序列化，因此必须保留无参构造
 * （@AllArgsConstructor 会让 Lombok 不再生成无参构造，所以显式写上 @NoArgsConstructor）。
 *
 * tags / attractions 初始化为空集合而不是 null：
 * 前端会直接遍历它们，null 会炸；gradient 同理，必须始终有两个元素。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DestinationDTO {

    private Long id;

    private String name;

    private String enName;

    private String category;

    private String location;

    private BigDecimal rating;

    private Integer priceFrom;

    private String days;

    private String bestSeason;

    /** 封面兜底渐变色，固定两个元素 [起始色, 结束色] */
    private List<String> gradient = new ArrayList<>();

    /** 封面照片地址，可为空字符串（为空时前端用 gradient 兜底） */
    private String image;

    private List<String> tags = new ArrayList<>();

    private String description;

    private List<AttractionDTO> attractions = new ArrayList<>();
}
