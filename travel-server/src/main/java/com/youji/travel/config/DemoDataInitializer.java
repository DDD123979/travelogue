package com.youji.travel.config;

import com.youji.travel.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 启动时补一个演示账号，方便直接演示登录（也可以在页面上自己注册）。
 *
 * 这里没有把 BCrypt 哈希硬编码进 sql/data.sql —— 哈希值写死容易出错，
 * 交给 UserService 现算更稳妥。
 *
 * 数据库还没建表时不能让它把应用启动搞崩，所以整段都包了 try/catch 并给出提示。
 */
@Component
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    /**
     * 演示账号。
     * 注意：仍保留固定口令（P2 计划改为随机口令 / 仅 dev profile 创建），
     * 因此这里只打日志说明"已创建"，不打印口令，避免日志成为凭据来源。
     */
    private static final String DEMO_USERNAME = "dou123";
    private static final String DEMO_PASSWORD = "123456";

    private final UserService userService;

    public DemoDataInitializer(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (userService.findByUsername(DEMO_USERNAME) == null) {
                userService.register(DEMO_USERNAME, DEMO_PASSWORD);
                log.info("已创建演示账号：{}（口令未写入日志）", DEMO_USERNAME);
            }
        } catch (Exception e) {
            log.warn("跳过演示账号初始化（{}）。如果还没建表，请先执行 sql/schema.sql 和 sql/data.sql",
                    e.getMessage());
        }
    }
}
