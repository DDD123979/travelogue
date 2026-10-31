package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.common.ApiException;
import com.youji.travel.dto.PostDTO;
import com.youji.travel.dto.PostRequest;
import com.youji.travel.entity.Destination;
import com.youji.travel.entity.TravelPost;
import com.youji.travel.mapper.DestinationMapper;
import com.youji.travel.mapper.TravelPostMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 社区帖子：发布、列表、点赞、删除。
 *
 * 图片由 UploadController 单独上传，这里只存地址；
 * 正文和图片数量都做了上限，避免一条帖子把列表撑爆。
 */
@Service
public class PostService {

    private static final int MAX_CONTENT = 800;
    private static final int MAX_IMAGES = 4;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TravelPostMapper postMapper;
    private final DestinationMapper destinationMapper;

    public PostService(TravelPostMapper postMapper, DestinationMapper destinationMapper) {
        this.postMapper = postMapper;
        this.destinationMapper = destinationMapper;
    }

    /** 列表：可按目的地过滤，最新的排前面，最多 100 条 */
    public List<PostDTO> list(Long destinationId) {
        var query = Wrappers.<TravelPost>lambdaQuery()
                .orderByDesc(TravelPost::getCreatedAt)
                .last("limit 100");
        if (destinationId != null) {
            query.eq(TravelPost::getDestinationId, destinationId);
        }
        List<TravelPost> posts = postMapper.selectList(query);
        if (posts.isEmpty()) {
            return List.of();
        }

        // 一次查出所有涉及的目的地名，避免逐条查库
        var ids = posts.stream().map(TravelPost::getDestinationId).distinct().toList();
        Map<Long, String> names = destinationMapper.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(Destination::getId, Destination::getName));

        return posts.stream()
                .map(p -> toDto(p, names.get(p.getDestinationId())))
                .toList();
    }

    public PostDTO create(String username, PostRequest req) {
        String content = req.getContent() == null ? "" : req.getContent().trim();
        if (content.isEmpty()) {
            throw ApiException.badRequest("说点什么再发吧");
        }
        if (content.length() > MAX_CONTENT) {
            throw ApiException.badRequest("心得最多 " + MAX_CONTENT + " 字");
        }
        if (req.getDestinationId() == null || destinationMapper.selectById(req.getDestinationId()) == null) {
            throw ApiException.badRequest("请选择去的是哪里");
        }
        List<String> images = req.getImages() == null ? List.of() : req.getImages();
        if (images.size() > MAX_IMAGES) {
            throw ApiException.badRequest("最多上传 " + MAX_IMAGES + " 张照片");
        }
        for (String img : images) {
            if (img == null || !img.startsWith("/uploads/")) {
                throw ApiException.badRequest("图片地址不合法");
            }
        }

        TravelPost post = new TravelPost();
        post.setUsername(username);
        post.setDestinationId(req.getDestinationId());
        post.setContent(content);
        post.setImages(String.join(",", images));
        post.setLikeCount(0);
        post.setCreatedAt(LocalDateTime.now());
        postMapper.insert(post);

        String destName = destinationMapper.selectById(post.getDestinationId()).getName();
        return toDto(post, destName);
    }

    /** 点赞：只做 +1，不做去重（社区轻量玩法，一人可点多次） */
    public PostDTO like(Long id) {
        TravelPost post = postMapper.selectById(id);
        if (post == null) {
            throw ApiException.notFound("这条分享不存在");
        }
        post.setLikeCount((post.getLikeCount() == null ? 0 : post.getLikeCount()) + 1);
        postMapper.updateById(post);
        Destination d = destinationMapper.selectById(post.getDestinationId());
        return toDto(post, d == null ? "" : d.getName());
    }

    /** 删除：只能删自己的 */
    public void delete(Long id, String username) {
        TravelPost post = postMapper.selectById(id);
        if (post == null) {
            throw ApiException.notFound("这条分享不存在");
        }
        if (!post.getUsername().equals(username)) {
            throw ApiException.conflict("只能删除自己发布的分享");
        }
        postMapper.deleteById(id);
    }

    private PostDTO toDto(TravelPost p, String destinationName) {
        PostDTO dto = new PostDTO();
        dto.setId(p.getId());
        dto.setUsername(p.getUsername());
        dto.setDestinationId(p.getDestinationId());
        dto.setDestinationName(destinationName == null ? "" : destinationName);
        dto.setContent(p.getContent());
        dto.setLikeCount(p.getLikeCount() == null ? 0 : p.getLikeCount());
        dto.setCreatedAt(p.getCreatedAt() == null ? "" : p.getCreatedAt().format(TIME));
        dto.setImages(parseImages(p.getImages()));
        return dto;
    }

    private List<String> parseImages(String raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
