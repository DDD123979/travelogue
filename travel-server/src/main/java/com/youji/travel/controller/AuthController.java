package com.youji.travel.controller;

import com.youji.travel.common.ApiException;
import com.youji.travel.dto.AuthRequest;
import com.youji.travel.dto.AuthResponse;
import com.youji.travel.dto.ForgotRequest;
import com.youji.travel.dto.ResetRequest;
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
import com.youji.travel.dto.NicknameRequest;
import com.youji.travel.dto.PasswordRequest;
import com.youji.travel.service.UploadService;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

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
    private final UploadService uploadService;

    public AuthController(UserService userService, TokenService tokenService, UploadService uploadService) {
        this.userService = userService;
        this.tokenService = tokenService;
        this.uploadService = uploadService;
    }

    /**
     * 注册。成功后直接发 token（前端拿到就能进首页，不用再登录一次），
     * 返回体是 {username, token}，比契约里的 {username} 多一个字段，前端的 if (data.token) 正好用上。
     */
    @PostMapping("/register")
    public AuthResponse register(@RequestBody AuthRequest request) {
        User user = userService.register(request.getUsername(), request.getPassword());
        return new AuthResponse(user.getUsername(), tokenService.issue(user.getUsername()), user.getUserNo(), nick(user), user.getAvatar());
    }

    /** 登录，失败返回 401 + {"message": "用户名或密码错误"} */
    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        User user = userService.login(request.getUsername(), request.getPassword());
        return new AuthResponse(user.getUsername(), tokenService.issue(user.getUsername()), user.getUserNo(), nick(user), user.getAvatar());
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
        User user = userService.findByUsername(username);
        if (user == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        return new UserDTO(user.getUsername(), user.getUserNo(), nick(user), user.getAvatar());
    }

    /** 上传并更新头像，返回 { avatar } */
    @PostMapping("/avatar")
    public java.util.Map<String, String> avatar(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam("file") MultipartFile file) {
        String username = requireLogin(authorization);
        String url = userService.updateAvatar(username, uploadService.save(file));
        return java.util.Map.of("avatar", url);
    }

    /** 修改密码 */
    @PostMapping("/password")
    public java.util.Map<String, String> password(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody PasswordRequest request) {
        String username = requireLogin(authorization);
        userService.changePassword(username, request.getOldPassword(), request.getNewPassword());
        return java.util.Map.of("message", "密码已更新");
    }

    /** 改昵称：只影响展示，token 不变 */
    @PostMapping("/nickname")
    public Map<String, String> changeNickname(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody NicknameRequest request) {
        String username = requireLogin(authorization);
        String nickname = userService.changeNickname(username, request.getNickname());
        return Map.of("nickname", nickname);
    }

    /** 忘记密码第一步：生成验证码 */
    @PostMapping("/forgot")
    public Map<String, String> forgot(@RequestBody ForgotRequest request) {
        String code = userService.createResetCode(request.getUsername());
        Map<String, String> result = new java.util.HashMap<>();
        result.put("message", "如果该账号存在，验证码已生成，5 分钟内有效");
        if (code != null) {
            result.put("code", code);
        }
        return result;
    }

    /** 忘记密码第二步：用验证码重设密码 */
    @PostMapping("/reset")
    public Map<String, String> reset(@RequestBody ResetRequest request) {
        userService.resetWithCode(request.getUsername(), request.getCode(), request.getNewPassword());
        return Map.of("message", "密码已重设，请用新密码登录");
    }

    /** 忘记原密码：凭登录态直接重设，并吊销当前 token（必须用新密码重新登录） */
    @PostMapping("/password/reset")
    public java.util.Map<String, String> resetPassword(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody PasswordRequest request) {
        String username = requireLogin(authorization);
        userService.resetPassword(username, request.getNewPassword());
        tokenService.revoke(authorization);
        return java.util.Map.of("message", "密码已重设，请用新密码登录");
    }

    /** 昵称没设置过就退回用户名 */
    private String nick(User user) {
        String n = user.getNickname();
        return (n == null || n.isBlank()) ? user.getUsername() : n;
    }

    private String requireLogin(String authorization) {
        String username = tokenService.resolveUsername(authorization);
        if (username == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        return username;
    }
}
