package com.youji.travel.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 跨域配置。
 *
 * 前端有两种打开方式，都要能调本服务：
 *   1. 本地服务器方式（http://localhost:5173）
 *   2. 直接双击 index.html（file:// 打开，浏览器发出的 Origin 是 null）
 *
 * 另外前端 js/api.js 的 request() 给所有请求都带了 Content-Type: application/json，
 * 因此连 GET 都算「非简单请求」，会先发 OPTIONS 预检 —— 这里必须放行。
 *
 * 注意 allowCredentials 必须保持 false：前端不带 cookie。
 * 一旦改成 true，allowedOrigins("*") 会在运行期抛
 * IllegalArgumentException: When allowCredentials is true, allowedOrigins cannot contain "*"
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
