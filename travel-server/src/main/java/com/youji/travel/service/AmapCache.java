package com.youji.travel.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.youji.travel.config.AmapProperties;
import com.youji.travel.dto.AmapGroundingData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 高德接地结果的 Redis 缓存（cache-aside 模式），用法和 {@link DestinationCache} 一致。
 *
 * 这层缓存不是「优化」而是「配额闸门」：一个城市冷算一次要发 45 个请求，
 * 个人 Key 每天只有 5000 次驾车路径规划的额度 —— 不缓存的话，
 * 一百来次行程生成就把当天配额吃光了。
 *
 * 【和 DestinationCache 的一处不同】这里多了一个 JVM 内的兜底缓存。
 * 目的地列表读出问题大不了回源数据库（本地、免费），但接地回源的代价是 45 次高德调用，
 * 所以 Redis 抛异常时（不是「没命中」，是**真的连不上**）改用内存里那份，
 * 免得 Redis 一挂、每次生成都重新烧一遍配额。
 *
 * key 里带 maxPoints：[youji:amap:ground:v1:10:3] 表示「v1 版规则、maxPoints=10、目的地 3」。
 * 改了 maxPoints 就等于换了一把钥匙，旧缓存自然失效 —— 不用手动清 Redis。
 * 整个 key 保持纯 ASCII，Windows 控制台 chcp 936 下用 redis-cli 也看得清。
 */
@Component
public class AmapCache {

    private static final Logger log = LoggerFactory.getLogger(AmapCache.class);

    /** 版本号：以后接地规则大改时，把 v1 提到 v2 就能让所有旧缓存失效 */
    private static final String VERSION = "v1";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final AmapProperties props;

    /** Redis 连不上时的兜底。最多 14 个目的地，不用考虑淘汰 */
    private final Map<Long, Entry> fallback = new ConcurrentHashMap<>();

    private record Entry(AmapGroundingData data, long expiresAt) {
    }

    public AmapCache(StringRedisTemplate redis, ObjectMapper objectMapper, AmapProperties props) {
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.props = props;
    }

    public Optional<AmapGroundingData> get(Long destinationId) {
        String key = key(destinationId);
        try {
            String json = redis.opsForValue().get(key);
            if (json == null) {
                return fromFallback(destinationId);
            }
            return Optional.of(objectMapper.readValue(json, AmapGroundingData.class));
        } catch (Exception e) {
            // 解析失败或 Redis 挂了都走这里。回源代价太大，先看内存里有没有
            log.warn("读取高德缓存失败，改用内存兜底：{}", e.getMessage());
            return fromFallback(destinationId);
        }
    }

    public void put(Long destinationId, AmapGroundingData data) {
        Duration ttl = data.isDegraded() ? props.getDegradedTtl() : props.getCacheTtl();
        fallback.put(destinationId, new Entry(data, System.currentTimeMillis() + ttl.toMillis()));
        try {
            redis.opsForValue().set(key(destinationId),
                    objectMapper.writeValueAsString(data), ttl);
            log.info("已缓存高德接地数据：目的地 {}，{} 个地点、{} 条路线{}，{} 分钟后过期",
                    destinationId, data.getPoints().size(), data.getRoutes().size(),
                    data.isDegraded() ? "（降级，会更早重算）" : "",
                    ttl.toMinutes());
        } catch (Exception e) {
            log.warn("写入高德缓存失败，不影响本次生成：{}", e.getMessage());
        }
    }

    /** 已缓存的目的地 ID，给 /api/amap/status 看进度用 */
    public List<Long> cachedDestinationIds() {
        List<Long> ids = new ArrayList<>();
        try {
            Set<String> keys = redis.keys(prefix() + "*");
            if (keys != null) {
                for (String key : keys) {
                    try {
                        ids.add(Long.parseLong(key.substring(key.lastIndexOf(':') + 1)));
                    } catch (NumberFormatException ignored) {
                        // key 结构对不上就跳过，不值得为它报错
                    }
                }
            }
        } catch (Exception e) {
            log.warn("列出高德缓存失败：{}", e.getMessage());
        }
        ids.sort(Long::compareTo);
        return ids;
    }

    public void evict(Long destinationId) {
        fallback.remove(destinationId);
        try {
            redis.delete(key(destinationId));
        } catch (Exception e) {
            log.warn("清除高德缓存失败：{}", e.getMessage());
        }
    }

    private Optional<AmapGroundingData> fromFallback(Long destinationId) {
        Entry entry = fallback.get(destinationId);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAt() < System.currentTimeMillis()) {
            fallback.remove(destinationId);
            return Optional.empty();
        }
        return Optional.of(entry.data());
    }

    /** key 里带上 maxPoints，改了配置就等于换了钥匙，旧缓存自动失效 */
    private String key(Long destinationId) {
        return prefix() + props.getMaxPoints() + ":" + destinationId;
    }

    private String prefix() {
        return "youji:amap:ground:" + VERSION + ":";
    }
}
