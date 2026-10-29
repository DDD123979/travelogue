package com.youji.travel.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youji.travel.dto.DestinationDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.function.Supplier;

/**
 * 目的地列表的 Redis 缓存（cache-aside 模式）。
 *
 * 用 StringRedisTemplate + Jackson 存 JSON 字符串，而不是默认的
 * JdkSerializationRedisSerializer —— 后者写进去是 \xac\xed\x00\x05 开头的二进制，
 * 用 redis-cli 根本看不懂，演示时没法证明"确实用了 Redis"。
 *
 * 【重要】Redis 故障绝不能拖垮列表页：读缓存、写缓存都包了 try/catch，
 * 出差错就只打 warn 日志并回源数据库，接口照常返回 200。
 */
@Component
public class DestinationCache {

    private static final Logger log = LoggerFactory.getLogger(DestinationCache.class);

    /** 缓存 key；TTL 取 60 秒，改完数据库一分钟内就能看到变化，演示时不会被当成 bug */
    private static final String KEY = "youji:destinations:list";
    private static final Duration TTL = Duration.ofSeconds(60);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public DestinationCache(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    /**
     * 先读缓存，未命中就调用 loader 回源，并写回缓存。
     *
     * @param loader 回源方法，通常是查数据库
     */
    public List<DestinationDTO> getList(Supplier<List<DestinationDTO>> loader) {
        String cached = readCache();
        if (cached != null) {
            try {
                // 必须用 TypeReference 留住泛型，写 List.class 会得到 List<LinkedHashMap>，
                // 后面取元素时 ClassCastException
                return objectMapper.readValue(cached, new TypeReference<List<DestinationDTO>>() {});
            } catch (Exception e) {
                log.warn("Redis 里的缓存内容解析失败，改为回源数据库：{}", e.getMessage());
            }
        }

        List<DestinationDTO> list = loader.get();
        writeCache(list);
        return list;
    }

    /** 数据变更后清缓存（当前没有写接口，留给以后扩展） */
    public void evict() {
        try {
            redis.delete(KEY);
            log.info("已清除缓存 {}", KEY);
        } catch (Exception e) {
            log.warn("清除缓存失败：{}", e.getMessage());
        }
    }

    private String readCache() {
        try {
            String json = redis.opsForValue().get(KEY);
            if (json != null) {
                log.debug("命中 Redis 缓存 {}", KEY);
            }
            return json;
        } catch (Exception e) {
            log.warn("读取 Redis 失败，本次直接查数据库：{}", e.getMessage());
            return null;
        }
    }

    private void writeCache(List<DestinationDTO> list) {
        try {
            redis.opsForValue().set(KEY, objectMapper.writeValueAsString(list), TTL);
            log.info("已写入 Redis 缓存 {}（{} 条，{} 秒后过期）", KEY, list.size(), TTL.toSeconds());
        } catch (Exception e) {
            log.warn("写入 Redis 失败，不影响本次返回：{}", e.getMessage());
        }
    }
}
