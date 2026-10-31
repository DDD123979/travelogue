package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.common.ApiException;
import com.youji.travel.entity.User;
import com.youji.travel.mapper.UserMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

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

        user.setUserNo(generateUserNo());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setNickname(username);
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

    /* ---------- 忘记密码：验证码流程 ---------- */

    /** 验证码在 Redis 里只活 5 分钟，且用一次就删 */
    private static final String RESET_KEY = "youji:reset:";
    private static final Duration RESET_TTL = Duration.ofMinutes(5);
    private static final java.security.SecureRandom RANDOM = new java.security.SecureRandom();

    /**
     * 生成 6 位验证码并写入 Redis；用户不存在时返回 null（调用方给同样的提示，避免暴露账号是否存在）。
     * 真实项目这里应该发邮件 / 短信，本项目没有接消息服务，验证码会写进服务端日志。
     */
    public String createResetCode(String username) {
        String name = username == null ? "" : username.trim();
        if (name.isEmpty() || findByUsername(name) == null) {
            return null;
        }
        String code = String.format("%06d", RANDOM.nextInt(1000000));
        redis.opsForValue().set(RESET_KEY + name, code, RESET_TTL);
        log.info("重置密码验证码：{} → {}（{} 分钟内有效）", name, code, RESET_TTL.toMinutes());
        return code;
    }

    /** 校验验证码并重设密码；成功一次后验证码立即失效 */
    public void resetWithCode(String username, String code, String newPassword) {
        String name = username == null ? "" : username.trim();
        String saved = name.isEmpty() ? null : redis.opsForValue().get(RESET_KEY + name);
        if (saved == null || code == null || !saved.equals(code.trim())) {
            throw ApiException.badRequest("验证码不正确或已过期");
        }
        User user = findByUsername(name);
        if (user == null) {
            throw ApiException.badRequest("验证码不正确或已过期");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw ApiException.badRequest("新密码至少 6 位");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
        redis.delete(RESET_KEY + name);
    }

    /**
     * 生成 8 位账号 ID（10000000 - 99999999）。
     * 和老用户撞号就重试，最多 20 次；正常规模下几乎一次命中。
     */
    private String generateUserNo() {
        for (int i = 0; i < 20; i++) {
            String no = String.valueOf(10000000 + java.util.concurrent.ThreadLocalRandom.current().nextInt(90000000));
            Long count = userMapper.selectCount(
                    com.baomidou.mybatisplus.core.toolkit.Wrappers.<User>lambdaQuery().eq(User::getUserNo, no));
            if (count == null || count == 0) {
                return no;
            }
        }
        throw new IllegalStateException("账号 ID 生成失败，请重试");
    }

    /** 改昵称：只影响展示，不动登录名，所以不需要再次验证密码 */
    public String changeNickname(String username, String nickname) {
        User user = findByUsername(username);
        if (user == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        String name = nickname == null ? "" : nickname.trim();
        if (name.isEmpty()) {
            throw ApiException.badRequest("昵称不能为空");
        }
        if (name.length() > 20) {
            throw ApiException.badRequest("昵称最多 20 个字");
        }
        user.setNickname(name);
        userMapper.updateById(user);
        return name;
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
