package com.youji.travel.controller;

import com.youji.travel.common.ApiException;
import com.youji.travel.dto.AuthRequest;
import com.youji.travel.dto.AuthResponse;
import com.youji.travel.dto.UserDTO;
import com.youji.travel.entity.User;
import com.youji.travel.service.TokenService;
import com.youji.travel.service.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 注册 / 登录 / 退出 / 当前用户。
 *
 * token 是不透明字符串，存 Redis（key: youji:token:<token>），
 * 前端拿到后放在 localStorage，后续请求用 Authorization: Bearer <token> 带上。
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final TokenService tokenService;

    public AuthController(UserService userService, TokenService tokenService) {
        this.userService = userService;
        this.tokenService = tokenService;
    }

    /**
     * 注册。成功后直接发 token（前端拿到就能进首页，不用再登录一次），
     * 返回体是 {username, token}，比契约里的 {username} 多一个字段，前端的 if (data.token) 正好用上。
     */
    @PostMapping("/register")
    public AuthResponse register(@RequestBody AuthRequest request) {
        User user = userService.register(request.getUsername(), request.getPassword());
        return new AuthResponse(user.getUsername(), tokenService.issue(user.getUsername()));
    }

    /** 登录，失败返回 401 + {"message": "用户名或密码错误"} */
    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        User user = userService.login(request.getUsername(), request.getPassword());
        return new AuthResponse(user.getUsername(), tokenService.issue(user.getUsername()));
    }

    /** 退出登录：删掉 Redis 里的 token，立即失效 */
    @PostMapping("/logout")
    public Map<String, String> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        tokenService.revoke(authorization);
        return Map.of("message", "已退出登录");
    }

    /** 当前登录用户（演示 Redis 登录态校验用；前端暂未调用） */
    @GetMapping("/me")
    public UserDTO me(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String username = tokenService.resolveUsername(authorization);
        if (username == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        return new UserDTO(username);
    }
}
