package com.youji.travel.controller;

import com.youji.travel.common.ApiException;
import com.youji.travel.dto.CommentDTO;
import com.youji.travel.dto.CommentRequest;
import com.youji.travel.dto.NotifyDTO;
import com.youji.travel.dto.PostDTO;
import com.youji.travel.dto.PostRequest;
import com.youji.travel.service.PostService;
import com.youji.travel.service.TokenService;
import com.youji.travel.service.UploadService;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 社区：旅行分享 + 照片上传 + 点赞 / 收藏 / 评论。
 *
 * 读接口（列表、评论）不要求登录；写接口都要带
 * Authorization: Bearer <token>。列表接口就算带了 token 也不强制。
 */
@RestController
@RequestMapping("/api")
public class CommunityController {

    private final PostService postService;
    private final UploadService uploadService;
    private final TokenService tokenService;

    public CommunityController(PostService postService,
                               UploadService uploadService,
                               TokenService tokenService) {
        this.postService = postService;
        this.uploadService = uploadService;
        this.tokenService = tokenService;
    }

    /** 列表：可按目的地过滤，favorites=true 只看我收藏的 */
    @GetMapping("/posts")
    public List<PostDTO> list(@RequestParam(required = false) Long destinationId,
                              @RequestParam(required = false, defaultValue = "false") boolean favorites,
                              @RequestParam(required = false, defaultValue = "false") boolean mine,
                              @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String username = tokenService.resolveUsername(authorization);
        if (mine && username == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        return postService.list(destinationId, username, favorites, mine ? username : null);
    }

    @PostMapping("/posts")
    public PostDTO create(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                          @RequestBody PostRequest request) {
        return postService.create(requireUser(authorization), request);
    }

    /** 点赞 / 取消点赞（toggle） */
    @PostMapping("/posts/{id}/like")
    public Map<String, Object> like(@PathVariable Long id,
                                    @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return postService.toggleLike(id, requireUser(authorization));
    }

    /** 收藏 / 取消收藏（toggle） */
    @PostMapping("/posts/{id}/favorite")
    public Map<String, Object> favorite(@PathVariable Long id,
                                        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return postService.toggleFavorite(id, requireUser(authorization));
    }

    /** 我的互动通知（轮询用，afterId 是上次拿到的最大 id） */
    @GetMapping("/notifications")
    public List<NotifyDTO> notifications(
            @RequestParam(required = false, defaultValue = "0") Long afterId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return postService.notifications(requireUser(authorization), afterId);
    }

    @GetMapping("/posts/{id}/comments")
    public List<CommentDTO> comments(@PathVariable Long id) {
        return postService.comments(id);
    }

    @PostMapping("/posts/{id}/comments")
    public CommentDTO addComment(@PathVariable Long id,
                                 @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                 @RequestBody CommentRequest request) {
        return postService.addComment(id, requireUser(authorization), request.getContent());
    }

    @DeleteMapping("/comments/{id}")
    public Map<String, String> deleteComment(@PathVariable Long id,
                                             @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        postService.deleteComment(id, requireUser(authorization));
        return Map.of("message", "评论已删除");
    }

    @DeleteMapping("/posts/{id}")
    public Map<String, String> delete(@PathVariable Long id,
                                      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        postService.delete(id, requireUser(authorization));
        return Map.of("message", "已删除");
    }

    /** 单张图片上传，返回 /uploads/xxx.jpg，前端把地址塞进发帖请求 */
    @PostMapping("/uploads")
    public Map<String, String> upload(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                      @RequestParam("file") MultipartFile file) {
        requireUser(authorization);
        return Map.of("url", uploadService.save(file));
    }

    private String requireUser(String authorization) {
        String username = tokenService.resolveUsername(authorization);
        if (username == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        return username;
    }
}
