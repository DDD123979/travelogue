package com.youji.travel.service;

import com.youji.travel.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.Map;

/**
 * 照片上传。
 *
 * 只接受 jpg / png / webp，单张不超过 5MB；文件名由服务端生成（UUID），
 * 不采用用户传来的原文件名，避免路径穿越和同名覆盖。
 *
 * 落盘前统一压一遍：长边不超过 1600px、JPEG q0.82，同时生成
 * 480px 的缩略图（xxx_thumb.jpg）。手机原图动辄 4-5MB，直接存下来
 * 在 3-5Mbps 的小带宽服务器上，列表页一张图就要等十几秒。
 */
@Service
public class UploadService {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    /** 长边上限：列表和详情都够用，体积能压到原来的 1/20 */
    private static final int MAX_EDGE = 1600;
    private static final int THUMB_EDGE = 480;
    private static final float QUALITY = 0.82f;
    private static final float THUMB_QUALITY = 0.78f;

    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".jpg",
            "image/webp", ".jpg");

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

        String base = UUIDBase.newId();
        String name = base + ext;
        Path target = dir.resolve(name).normalize();
        if (!target.startsWith(dir)) {
            throw ApiException.badRequest("非法的文件名");
        }

        byte[] raw;
        try (InputStream in = file.getInputStream()) {
            raw = in.readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("读取图片失败", e);
        }

        BufferedImage image = decode(raw);
        if (image == null) {
            // 解不出来的（极少见）就原样存，至少不丢用户的图
            try {
                Files.write(target, raw);
            } catch (IOException e) {
                throw new IllegalStateException("图片保存失败", e);
            }
            return "/uploads/" + name;
        }

        writeJpeg(scale(image, MAX_EDGE), target, QUALITY);
        writeJpeg(scale(image, THUMB_EDGE), dir.resolve(base + "_thumb" + ext), THUMB_QUALITY);
        return "/uploads/" + name;
    }

    public Path dir() {
        return dir;
    }

    /* ---------- 内部实现 ---------- */

    private BufferedImage decode(byte[] raw) {
        try {
            return ImageIO.read(new ByteArrayInputStream(raw));
        } catch (IOException e) {
            return null;
        }
    }

    /** 等比缩放到长边不超过 edge；本来就小就原样返回 */
    private BufferedImage scale(BufferedImage src, int edge) {
        int w = src.getWidth();
        int h = src.getHeight();
        int longer = Math.max(w, h);
        if (longer <= edge) {
            return src;
        }
        double ratio = (double) edge / longer;
        int nw = Math.max(1, (int) Math.round(w * ratio));
        int nh = Math.max(1, (int) Math.round(h * ratio));

        BufferedImage out = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            // 转 JPEG 后没有透明通道，先铺白底，避免 PNG 透明区变黑
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, nw, nh);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.drawImage(src, 0, 0, nw, nh, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    private void writeJpeg(BufferedImage image, Path target, float quality) {
        BufferedImage rgb = image;
        if (rgb.getType() != BufferedImage.TYPE_INT_RGB) {
            BufferedImage converted = new BufferedImage(
                    rgb.getWidth(), rgb.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = converted.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
            g.drawImage(rgb, 0, 0, null);
            g.dispose();
            rgb = converted;
        }
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IllegalStateException("当前 JVM 不支持 JPEG 写入");
        }
        ImageWriter writer = writers.next();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(target.toFile())) {
            writer.setOutput(ios);
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
            writer.write(null, new IIOImage(rgb, null, null), param);
        } catch (IOException e) {
            throw new IllegalStateException("图片写入失败", e);
        } finally {
            writer.dispose();
        }
    }

    /** 单独的 ID 生成器，避免和业务代码抢命名 */
    private static final class UUIDBase {
        static String newId() {
            String id = java.util.UUID.randomUUID().toString().replace("-", "");
            return id.substring(0, 32);
        }
    }
}
