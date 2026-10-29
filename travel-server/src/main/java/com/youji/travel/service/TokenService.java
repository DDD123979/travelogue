package com.youji.travel.service;

import com.youji.travel.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * 登录态：token 存 Redis，带 2 小时过期。
 *
 * 这里用「不透明 token + Redis」而不是 JWT：
 *   - 服务端可以随时让某个 token 失效（退出登录直接删 key），JWT 做不到
 *   - 演示时能在 redis-cli 里直接看到 youji:token:xxx，中间件用得明明白白
 *
 * 登录接口对 Redis 是强依赖（没地方存 token），因此 Redis 连不上时
 * 这里会抛 503 并给出明确中文提示，而不是让用户看到一个 500 报错页。
 */
@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    private static final String PREFIX = "youji:token:";
    private static final Duration TTL = Duration.ofHours(2);
    private static final String BEARER = "Bearer ";

    private final StringRedisTemplate redis;

    public TokenService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /** 签发 token 并写入 Redis；返回值前端会存进 localStorage，必须非空 */
    public String issue(String username) {
        String token = UUID.randomUUID().toString().replace("-", "");
        try {
            redis.opsForValue().set(PREFIX + token, username, TTL);
            log.info("已签发 token 给 {}，Redis key = {}{}（{} 秒后过期）",
                    username, PREFIX, token, TTL.toSeconds());
        } catch (Exception e) {
            log.error("写入 Redis 失败，无法签发 token", e);
            throw ApiException.unavailable(
                    "登录服务暂不可用：请先启动 Redis（双击 travel-server/redis/start-redis.bat）");
        }
        return token;
    }

    /**
     * 从 Authorization 请求头解析出用户名。
     *
     * @return 校验通过返回用户名；没带 token 或 token 已过期返回 null
     */
    public String resolveUsername(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token == null) {
            return null;
        }
        try {
            return redis.opsForValue().get(PREFIX + token);
        } catch (Exception e) {
            log.error("查询 Redis 失败", e);
            throw ApiException.unavailable("登录服务暂不可用：请检查 Redis 是否已启动");
        }
    }

    /** 退出登录：直接删掉 Redis 里的 key，token 立即失效 */
    public void revoke(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token == null) {
            return;
        }
        try {
            redis.delete(PREFIX + token);
            log.info("已注销 token {}{}", PREFIX, token);
        } catch (Exception e) {
            log.warn("删除 Redis 中的 token 失败：{}", e.getMessage());
        }
    }

    /** 从 "Bearer xxx" 里取出 xxx；格式不对返回 null */
    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return null;
        }
        String value = authorizationHeader.trim();
        if (value.regionMatches(true, 0, BEARER, 0, BEARER.length())) {
            value = value.substring(BEARER.length()).trim();
        }
        return value.isEmpty() ? null : value;
    }
}
