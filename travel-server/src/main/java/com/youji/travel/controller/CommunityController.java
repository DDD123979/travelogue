package com.youji.travel.controller;

import com.youji.travel.common.ApiException;
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
 * 社区：旅行分享 + 照片上传。
 *
 * 读接口（列表）不要求登录；发布、点赞、删除、上传都要带
 * Authorization: Bearer <token>。
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

    @GetMapping("/posts")
    public List<PostDTO> list(@RequestParam(required = false) Long destinationId) {
        return postService.list(destinationId);
    }

    @PostMapping("/posts")
    public PostDTO create(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                          @RequestBody PostRequest request) {
        return postService.create(requireUser(authorization), request);
    }

    @PostMapping("/posts/{id}/like")
    public PostDTO like(@PathVariable Long id,
                        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        requireUser(authorization);
        return postService.like(id);
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
