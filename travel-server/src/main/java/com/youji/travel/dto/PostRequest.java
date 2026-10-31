package com.youji.travel.dto;

import lombok.Data;

import java.util.List;

/**
 * 发布帖子的请求体。
 * images 是已经上传成功的图片地址（前端先调 /api/uploads 拿到地址再发帖）。
 */
@Data
public class PostRequest {

    private Long destinationId;

    private String content;

    private List<String> images;
}
