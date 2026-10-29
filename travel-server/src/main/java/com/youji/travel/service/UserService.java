package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.common.ApiException;
import com.youji.travel.entity.User;
import com.youji.travel.mapper.UserMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 用户注册与登录。
 *
 * 密码用 BCrypt 哈希后存库，不存明文、不用 MD5（MD5 加盐也扛不住彩虹表）。
 * BCrypt 每次加密结果都不同（自带随机盐），校验用 matches()，不能用 equals。
 */
@Service
public class UserService {

    private final UserMapper userMapper;

    /** 无状态、线程安全，直接持有即可；不必引 spring-boot-starter-security */
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
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
        User user = findByUsername(username == null ? null : username.trim());
        if (user == null || password == null
                || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.unauthorized("用户名或密码错误");
        }
        return user;
    }

    public User findByUsername(String username) {
        if (username == null || username.isEmpty()) {
            return null;
        }
        return userMapper.selectOne(
                Wrappers.<User>lambdaQuery().eq(User::getUsername, username));
    }
}
