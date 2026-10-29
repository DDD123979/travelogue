package com.youji.travel.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 一个目的地的全部高德事实数据，缓存进 Redis 后由 AmapGroundingService 渲染成提示词。
 *
 * 刻意存成结构化对象而不是拼好的字符串：redis-cli 里能直接看懂，
 * 以后想在地图上画这些点、或者换个排版，都不用重新调高德。
 */
@Data
@NoArgsConstructor
public class AmapGroundingData {

    /** 城市名，渲染提示词时用来当小标题 */
    private String cityName;

    /** 地点集：数据库推荐景点解析出的坐标 + 高德 POI 补充的景点，已去重 */
    private List<AmapPoint> points = new ArrayList<>();

    /** 地点两两之间的驾车方案（无序对，A→B 和 B→A 只算一条） */
    private List<AmapRoute> routes = new ArrayList<>();

    /**
     * 没能解析出坐标的地点名。
     * 会写进 /api/amap/warmup 的响应，用来调复合景点名的拆分规则 —— 平时没人看。
     */
    private List<String> unresolved = new ArrayList<>();

    /** 是否降级：没能算完全部两两组合（超预算或中途报错）。降级的缓存时间会更短 */
    private boolean degraded;

    /** 生成时间戳（毫秒），排查「这份缓存是什么时候算的」时有用 */
    private long builtAt;

    public AmapGroundingData(String cityName, List<AmapPoint> points, List<AmapRoute> routes) {
        this.cityName = cityName;
        this.points = points;
        this.routes = routes;
        this.builtAt = System.currentTimeMillis();
    }
}
