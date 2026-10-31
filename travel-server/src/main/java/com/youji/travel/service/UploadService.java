package com.youji.travel.service;

import com.youji.travel.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
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
 * 只接受 jpg / png / webp；文件名由服务端生成（UUID），不用用户传来的名字。
 *
 * 落盘前统一压一遍：长边 1600px、JPEG q0.82，同时生成 480px 缩略图。
 * 手机原图动辄 5-10MB，直接存下来在小带宽服务器上一张要等十几秒。
 *
 * 大图不能直接 ImageIO.read()：一张 12000x9000 的照片解码成 RGB 要 400MB+，
 * 1.6G 内存的机器上会 OOM。所以先读尺寸，再按比例降采样解码。
 */
@Service
public class UploadService {

    /** 允许上传的原始文件上限。手机随手拍的大图也能进来，压缩交给服务端 */
    private static final long MAX_BYTES = 25L * 1024 * 1024;

    private static final int MAX_EDGE = 1600;
    private static final int THUMB_EDGE = 480;
    private static final float QUALITY = 0.82f;
    private static final float THUMB_QUALITY = 0.78f;

    /** 解码时先降到这个边长以内，避免一次性展开超大位图 */
    private static final int DECODE_EDGE = 2400;

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
            throw ApiException.badRequest("单张图片不能超过 25MB");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String ext = ALLOWED.get(type);
        if (ext == null) {
            throw ApiException.badRequest("只支持 jpg / png / webp 格式");
        }

        String base = java.util.UUID.randomUUID().toString().replace("-", "");
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
            // 解不出来的（极少见）原样存，至少不丢用户的图
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

    /**
     * 先读尺寸、算降采样比例，再解码。
     * 例：12000px 宽 → subsample=5 → 只解出 2400px，内存占用降到 1/25。
     */
    private BufferedImage decode(byte[] raw) {
        try (ImageInputStream iis = ImageIO.createImageInputStream(new ByteArrayInputStream(raw))) {
            if (iis == null) return null;
            Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) return null;
            ImageReader reader = readers.next();
            try {
                reader.setInput(iis, true, true);
                int w = reader.getWidth(0);
                int h = reader.getHeight(0);
                int longer = Math.max(w, h);
                int subsample = Math.max(1, (int) Math.ceil((double) longer / DECODE_EDGE));

                ImageReadParam param = reader.getDefaultReadParam();
                if (subsample > 1) {
                    param.setSourceSubsampling(subsample, subsample, 0, 0);
                }
                return reader.read(0, param);
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
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
}
