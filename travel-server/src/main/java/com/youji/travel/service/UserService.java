package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.common.ApiException;
import com.youji.travel.entity.User;
import com.youji.travel.mapper.UserMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;

/**
 * 用户注册与登录。
 *
 * 密码用 BCrypt 哈希后存库，不存明文、不用 MD5（MD5 加盐也扛不住彩虹表）。
 * BCrypt 每次加密结果都不同（自带随机盐），校验用 matches()，不能用 equals。
 *
 * 登录失败次数记在 Redis 里：同一用户名连续错 5 次锁定 15 分钟。
 * 不这么做的话，密码只要 6 位、站点又是公开的，撞库几乎无成本。
 */
@Service
public class UserService {

    /** 同一用户名连续失败到这个次数就锁定 */
    private static final int MAX_LOGIN_FAILS = 5;

    /** 锁定窗口：从第一次失败开始算 */
    private static final Duration LOGIN_LOCK = Duration.ofMinutes(15);

    private static final String FAIL_KEY_PREFIX = "youji:login:fail:";

    private final UserMapper userMapper;
    private final StringRedisTemplate redis;

    /** 无状态、线程安全，直接持有即可；不必引 spring-boot-starter-security */
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserMapper userMapper, StringRedisTemplate redis) {
        this.userMapper = userMapper;
        this.redis = redis;
    }

    /** 注册：用户名重复返回 409 */
    public User register(String username, String password) {
        String name = username == null ? "" : username.trim();
        if (name.isEmpty()) {
            throw ApiException.badRequest("请输入用户名");
        }
        if (name.length() > 20) {
            throw ApiException.badRequest("用户名不能超过 20 个字符");
        }
        if (password == null || password.length() < 6) {
            // 与前端注册表单的校验保持一致
            throw ApiException.badRequest("密码至少 6 位");
        }
        if (findByUsername(name) != null) {
            throw ApiException.conflict("该用户名已被注册");
        }

        User user = new User();
        user.setUsername(name);
        user.setPasswordHash(passwordEncoder.encode(password));
        userMapper.insert(user);
        return user;
    }

    /** 登录：用户名不存在和密码错误返回同一句提示，不泄露账号是否存在 */
    public User login(String username, String password) {
        String name = username == null ? "" : username.trim();
        String failKey = FAIL_KEY_PREFIX + name.toLowerCase(Locale.ROOT);

        if (loginFails(failKey) >= MAX_LOGIN_FAILS) {
            throw ApiException.tooManyRequests(
                    "密码错误次数过多，账号已临时锁定，请 " + LOGIN_LOCK.toMinutes() + " 分钟后再试");
        }

        User user = findByUsername(name);
        if (user == null || password == null
                || !passwordEncoder.matches(password, user.getPasswordHash())) {
            recordLoginFail(failKey);
            throw ApiException.unauthorized("用户名或密码错误");
        }

        // 登录成功就清零，避免"输错几次但最终成功"也被锁
        redis.delete(failKey);
        return user;
    }

    private int loginFails(String key) {
        String raw = redis.opsForValue().get(key);
        if (raw == null) {
            return 0;
        }
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private void recordLoginFail(String key) {
        Long count = redis.opsForValue().increment(key);
        // 只在第一次失败时设过期：窗口从第一次失败开始算，而不是每次失败都顺延
        if (count != null && count == 1L) {
            redis.expire(key, LOGIN_LOCK);
        }
    }

    /** 更新头像地址（文件由 UploadService 保存，这里只存地址） */
    public String updateAvatar(String username, String avatar) {
        User user = findByUsername(username);
        if (user == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        user.setAvatar(avatar);
        userMapper.updateById(user);
        return avatar;
    }

    /** 修改密码：先验旧密码，再写新哈希 */
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = findByUsername(username);
        if (user == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        if (oldPassword == null || !passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw ApiException.badRequest("原密码不正确");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw ApiException.badRequest("新密码至少 6 位");
        }
        if (newPassword.equals(oldPassword)) {
            throw ApiException.badRequest("新密码不能和原密码相同");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }

    /**
     * 忘记原密码时的重设：只要当前是已登录状态（token 有效）就允许。
     * 安全性由 token 保证；调用方应同时吊销 token，强制用新密码重新登录。
     */
    public void resetPassword(String username, String newPassword) {
        User user = findByUsername(username);
        if (user == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw ApiException.badRequest("新密码至少 6 位");
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw ApiException.badRequest("新密码不能和原密码相同");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }

    public User findByUsername(String username) {
        if (username == null || username.isEmpty()) {
            return null;
        }
        return userMapper.selectOne(
                Wrappers.<User>lambdaQuery().eq(User::getUsername, username));
    }
}
