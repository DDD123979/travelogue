package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 行程里的一个地点，来自高德。
 *
 * 两类来源：数据库里的推荐景点（地理编码得到坐标），和高德 POI 搜索补充的同城景点。
 * 它只服务于「给大模型喂事实」这一件事，不进任何对前端的接口，
 * 所以和 {@link AttractionDTO} 完全独立 —— 动它不会影响前端契约。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AmapPoint {

    /** 地点名。数据库景点保留完整原名（可能是「都江堰 · 青城山」这种复合名） */
    private String name;

    /**
     * 坐标，"经度,纬度"。
     * 直接用高德返回的原始字符串而不拆成两个 double：拼请求时原样传回最保险，
     * 也避免浮点格式化成 "116.48102800000001" 这种高德不认的写法。
     */
    private String location;

    /** 所在区县，来自 POI 的 adname。数据库景点没有，可能为 null */
    private String district;

    /** 高德评分。数据库景点没有（它有自己的平台评分），可能为 null */
    private String rating;

    /** true = 数据库推荐景点，false = 高德 POI 补充的 */
    private boolean fromDb;
}
