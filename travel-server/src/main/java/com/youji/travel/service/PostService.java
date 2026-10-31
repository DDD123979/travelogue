package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.common.ApiException;
import com.youji.travel.dto.CommentDTO;
import com.youji.travel.dto.PostDTO;
import com.youji.travel.dto.PostRequest;
import com.youji.travel.entity.Destination;
import com.youji.travel.entity.PostComment;
import com.youji.travel.entity.PostFavorite;
import com.youji.travel.entity.PostLike;
import com.youji.travel.entity.TravelPost;
import com.youji.travel.mapper.DestinationMapper;
import com.youji.travel.mapper.PostCommentMapper;
import com.youji.travel.mapper.PostFavoriteMapper;
import com.youji.travel.mapper.PostLikeMapper;
import com.youji.travel.mapper.TravelPostMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 社区：帖子 + 点赞 + 收藏 + 评论。
 *
 * 点赞 / 收藏都是「按人去重」的：有唯一索引兜底，接口是 toggle 语义
 * （点了再点是取消）。travel_post.like_count 只做展示用的冗余计数，
 * 真正的状态以 post_like 表为准。
 */
@Service
public class PostService {

    private static final int MAX_CONTENT = 800;
    private static final int MAX_COMMENT = 300;
    private static final int MAX_IMAGES = 4;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TravelPostMapper postMapper;
    private final DestinationMapper destinationMapper;
    private final PostLikeMapper likeMapper;
    private final PostFavoriteMapper favoriteMapper;
    private final PostCommentMapper commentMapper;

    public PostService(TravelPostMapper postMapper,
                       DestinationMapper destinationMapper,
                       PostLikeMapper likeMapper,
                       PostFavoriteMapper favoriteMapper,
                       PostCommentMapper commentMapper) {
        this.postMapper = postMapper;
        this.destinationMapper = destinationMapper;
        this.likeMapper = likeMapper;
        this.favoriteMapper = favoriteMapper;
        this.commentMapper = commentMapper;
    }

    /* ---------- 列表 ---------- */

    /**
     * @param destinationId 只看某个城市，null 表示全部
     * @param username      当前登录用户，用来标记「我点过赞 / 收藏过」，可为 null
     * @param favoritesOnly 只看我收藏的
     */
    public List<PostDTO> list(Long destinationId, String username, boolean favoritesOnly) {
        var query = Wrappers.<TravelPost>lambdaQuery()
                .orderByDesc(TravelPost::getCreatedAt)
                .last("limit 100");
        if (destinationId != null) {
            query.eq(TravelPost::getDestinationId, destinationId);
        }
        if (favoritesOnly) {
            if (username == null) {
                return List.of();
            }
            List<Long> ids = favoriteMapper.selectList(
                            Wrappers.<PostFavorite>lambdaQuery().eq(PostFavorite::getUsername, username))
                    .stream().map(PostFavorite::getPostId).toList();
            if (ids.isEmpty()) {
                return List.of();
            }
            query.in(TravelPost::getId, ids);
        }

        List<TravelPost> posts = postMapper.selectList(query);
        if (posts.isEmpty()) {
            return List.of();
        }

        List<Long> postIds = posts.stream().map(TravelPost::getId).toList();
        var destIds = posts.stream().map(TravelPost::getDestinationId).distinct().toList();
        Map<Long, String> destNames = destinationMapper.selectBatchIds(destIds).stream()
                .collect(Collectors.toMap(Destination::getId, Destination::getName));

        // 这三个集合一次查完，避免每条帖子各查一次
        Map<Long, Long> commentCounts = commentCounts(postIds);
        Set<Long> myLikes = myLikes(postIds, username);
        Set<Long> myFavs = myFavorites(postIds, username);

        return posts.stream()
                .map(p -> toDto(p, destNames.get(p.getDestinationId()), myLikes.contains(p.getId()),
                        myFavs.contains(p.getId()), commentCounts.getOrDefault(p.getId(), 0L)))
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
        return toDto(post, destName, false, false, 0);
    }

    /* ---------- 点赞 ---------- */

    /** toggle：没点过就点亮，点过就取消，返回最新状态 */
    public Map<String, Object> toggleLike(Long postId, String username) {
        TravelPost post = requirePost(postId);
        PostLike existing = likeMapper.selectOne(Wrappers.<PostLike>lambdaQuery()
                .eq(PostLike::getPostId, postId)
                .eq(PostLike::getUsername, username));

        boolean liked;
        if (existing == null) {
            PostLike like = new PostLike();
            like.setPostId(postId);
            like.setUsername(username);
            like.setCreatedAt(LocalDateTime.now());
            likeMapper.insert(like);
            liked = true;
        } else {
            likeMapper.deleteById(existing.getId());
            liked = false;
        }

        long count = likeMapper.selectCount(Wrappers.<PostLike>lambdaQuery().eq(PostLike::getPostId, postId));
        post.setLikeCount((int) count);
        postMapper.updateById(post);

        Map<String, Object> result = new HashMap<>();
        result.put("liked", liked);
        result.put("likeCount", count);
        return result;
    }

    /* ---------- 收藏 ---------- */

    public Map<String, Object> toggleFavorite(Long postId, String username) {
        requirePost(postId);
        PostFavorite existing = favoriteMapper.selectOne(Wrappers.<PostFavorite>lambdaQuery()
                .eq(PostFavorite::getPostId, postId)
                .eq(PostFavorite::getUsername, username));

        boolean favorited;
        if (existing == null) {
            PostFavorite fav = new PostFavorite();
            fav.setPostId(postId);
            fav.setUsername(username);
            fav.setCreatedAt(LocalDateTime.now());
            favoriteMapper.insert(fav);
            favorited = true;
        } else {
            favoriteMapper.deleteById(existing.getId());
            favorited = false;
        }

        long count = favoriteMapper.selectCount(Wrappers.<PostFavorite>lambdaQuery().eq(PostFavorite::getPostId, postId));
        Map<String, Object> result = new HashMap<>();
        result.put("favorited", favorited);
        result.put("favoriteCount", count);
        return result;
    }

    /* ---------- 评论 ---------- */

    public List<CommentDTO> comments(Long postId) {
        requirePost(postId);
        return commentMapper.selectList(Wrappers.<PostComment>lambdaQuery()
                        .eq(PostComment::getPostId, postId)
                        .orderByAsc(PostComment::getCreatedAt))
                .stream()
                .map(this::toCommentDto)
                .toList();
    }

    public CommentDTO addComment(Long postId, String username, String content) {
        requirePost(postId);
        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) {
            throw ApiException.badRequest("评论不能为空");
        }
        if (text.length() > MAX_COMMENT) {
            throw ApiException.badRequest("评论最多 " + MAX_COMMENT + " 字");
        }
        PostComment comment = new PostComment();
        comment.setPostId(postId);
        comment.setUsername(username);
        comment.setContent(text);
        comment.setCreatedAt(LocalDateTime.now());
        commentMapper.insert(comment);
        return toCommentDto(comment);
    }

    public void deleteComment(Long commentId, String username) {
        PostComment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw ApiException.notFound("评论不存在");
        }
        if (!comment.getUsername().equals(username)) {
            throw ApiException.conflict("只能删除自己的评论");
        }
        commentMapper.deleteById(commentId);
    }

    /* ---------- 删除帖子 ---------- */

    public void delete(Long id, String username) {
        TravelPost post = postMapper.selectById(id);
        if (post == null) {
            throw ApiException.notFound("这条分享不存在");
        }
        if (!post.getUsername().equals(username)) {
            throw ApiException.conflict("只能删除自己发布的分享");
        }
        // 帖子删了，挂在下面的互动数据也一起清掉
        likeMapper.delete(Wrappers.<PostLike>lambdaQuery().eq(PostLike::getPostId, id));
        favoriteMapper.delete(Wrappers.<PostFavorite>lambdaQuery().eq(PostFavorite::getPostId, id));
        commentMapper.delete(Wrappers.<PostComment>lambdaQuery().eq(PostComment::getPostId, id));
        postMapper.deleteById(id);
    }

    /* ---------- 内部工具 ---------- */

    private TravelPost requirePost(Long id) {
        TravelPost post = postMapper.selectById(id);
        if (post == null) {
            throw ApiException.notFound("这条分享不存在");
        }
        return post;
    }

    private Map<Long, Long> commentCounts(List<Long> postIds) {
        List<PostComment> all = commentMapper.selectList(
                Wrappers.<PostComment>lambdaQuery().in(PostComment::getPostId, postIds));
        Map<Long, Long> counts = new HashMap<>();
        for (PostComment c : all) {
            counts.merge(c.getPostId(), 1L, Long::sum);
        }
        return counts;
    }

    private Set<Long> myLikes(List<Long> postIds, String username) {
        if (username == null) {
            return Set.of();
        }
        return new HashSet<>(likeMapper.selectList(Wrappers.<PostLike>lambdaQuery()
                        .eq(PostLike::getUsername, username)
                        .in(PostLike::getPostId, postIds))
                .stream().map(PostLike::getPostId).toList());
    }

    private Set<Long> myFavorites(List<Long> postIds, String username) {
        if (username == null) {
            return Set.of();
        }
        return new HashSet<>(favoriteMapper.selectList(Wrappers.<PostFavorite>lambdaQuery()
                        .eq(PostFavorite::getUsername, username)
                        .in(PostFavorite::getPostId, postIds))
                .stream().map(PostFavorite::getPostId).toList());
    }

    private PostDTO toDto(TravelPost p, String destinationName,
                          boolean liked, boolean favorited, long commentCount) {
        PostDTO dto = new PostDTO();
        dto.setId(p.getId());
        dto.setUsername(p.getUsername());
        dto.setDestinationId(p.getDestinationId());
        dto.setDestinationName(destinationName == null ? "" : destinationName);
        dto.setContent(p.getContent());
        dto.setLikeCount(p.getLikeCount() == null ? 0 : p.getLikeCount());
        dto.setCommentCount(commentCount);
        dto.setLiked(liked);
        dto.setFavorited(favorited);
        dto.setCreatedAt(p.getCreatedAt() == null ? "" : p.getCreatedAt().format(TIME));
        dto.setImages(parseImages(p.getImages()));
        return dto;
    }

    private CommentDTO toCommentDto(PostComment c) {
        CommentDTO dto = new CommentDTO();
        dto.setId(c.getId());
        dto.setPostId(c.getPostId());
        dto.setUsername(c.getUsername());
        dto.setContent(c.getContent());
        dto.setCreatedAt(c.getCreatedAt() == null ? "" : c.getCreatedAt().format(TIME));
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
