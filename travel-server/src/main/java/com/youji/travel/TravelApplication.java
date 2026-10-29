package com.youji.travel;

import com.youji.travel.config.AiProperties;
import com.youji.travel.config.AmapProperties;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * 游迹 · 旅游网站后端
 *
 * 技术栈：Spring Boot 3.5 + MySQL 8 + MyBatis-Plus + Redis
 *
 * 启动前请确认：
 *   1. Redis 已运行（travel-server/redis/start-redis.bat）
 *   2. MySQL 已运行，且已执行 sql/schema.sql 与 sql/data.sql
 */
@SpringBootApplication
@MapperScan("com.youji.travel.mapper")   // 少了这行，Mapper 不会被注册成 Bean
// 让 youji.ai.* / youji.amap.* 配置能注入到对应的 Properties 类。
// 漏加 AmapProperties 的话，AmapClient 在启动时注入失败，整个应用起不来 —— 看起来像全盘崩了
@EnableConfigurationProperties({AiProperties.class, AmapProperties.class})
public class TravelApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelApplication.class, args);
    }
}
