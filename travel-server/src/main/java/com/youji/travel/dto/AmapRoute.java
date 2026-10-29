package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 两个地点之间的驾车方案，来自高德路径规划。
 *
 * 存的是地点名而不是坐标：这个对象会被序列化进 Redis，
 * 用 redis-cli 看的时候「大熊猫繁育研究基地 → 宽窄巷子」比两串经纬度好认得多。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AmapRoute {

    private String fromName;

    private String toName;

    /** 驾车距离，米 */
    private int distanceMeters;

    /** 预计耗时，秒 */
    private int durationSeconds;

    /** 预估打车费，元。为 null 表示这次没能拿到（高德只在 extensions=all 时返回） */
    private Integer taxiCost;

    /** 拼给大模型看的一行，"14.2 公里，约 32 分钟，打车约 41 元" */
    public String describe() {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%.1f", distanceMeters / 1000.0)).append(" 公里");
        sb.append("，约 ").append(Math.max(1, durationSeconds / 60)).append(" 分钟");
        if (taxiCost != null && taxiCost > 0) {
            sb.append("，打车约 ").append(taxiCost).append(" 元");
        }
        return sb.toString();
    }
}
