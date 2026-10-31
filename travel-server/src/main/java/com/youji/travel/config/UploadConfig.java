package com.youji.travel.config;

import com.youji.travel.service.UploadService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 把上传目录映射到 /uploads/**。
 *
 * 只靠 application.yml 的 static-locations 也能访问，但那两个路径是写死的
 * （./travel-app、./../travel-app）；一旦把 UPLOAD_DIR 配到别处就 404，
 * 所以这里按实际目录再显式映射一次。
 */
@Configuration
public class UploadConfig implements WebMvcConfigurer {

    private final UploadService uploadService;

    public UploadConfig(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadService.dir().toAbsolutePath() + "/");
    }
}
