package com.youji.travel.service;

import com.youji.travel.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 照片上传。
 *
 * 只接受 jpg / png / webp，单张不超过 5MB；文件名由服务端生成（UUID），
 * 不采用用户传来的原文件名，避免路径穿越和同名覆盖。
 */
@Service
public class UploadService {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    /** 允许的类型 -> 落盘扩展名 */
    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp");

    private final Path dir;

    public UploadService(@Value("${youji.upload.dir:../travel-app/uploads}") String dir) {
        this.dir = Paths.get(dir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.dir);
        } catch (IOException e) {
            throw new IllegalStateException("无法创建上传目录：" + this.dir, e);
        }
    }

    /** @return 可直接给 <img src> 用的相对地址，如 /uploads/xxxx.jpg */
    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("没有收到图片");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("单张图片不能超过 5MB");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String ext = ALLOWED.get(type);
        if (ext == null) {
            throw ApiException.badRequest("只支持 jpg / png / webp 格式");
        }

        String name = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = dir.resolve(name).normalize();
        if (!target.startsWith(dir)) {
            throw ApiException.badRequest("非法的文件名");
        }
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("图片保存失败", e);
        }
        return "/uploads/" + name;
    }

    public Path dir() {
        return dir;
    }
}
