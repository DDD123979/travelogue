package com.youji.travel.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * 高德地图（Web 服务 API）配置，对应 application.yml 里的 youji.amap.*
 *
 * 和 AiProperties 有个关键区别：高德是「增强」不是「依赖」。
 * 没配 Key、或者高德挂了，行程照样生成，只是少了真实交通数据 —— 见 AmapGroundingService。
 *
 * 申请 Key：https://lbs.amap.com → 创建应用 → 添加 Key，
 * 服务平台必须选「Web服务」（选成「Web端(JS API)」会返回 10002/10009），
 * 另外「数字签名」保持关闭，开了就得再补一个 sig 参数。
 */
@ConfigurationProperties(prefix = "youji.amap")
public class AmapProperties {

    /** 接口地址，一般不用改 */
    private String baseUrl = "https://restapi.amap.com";

    /** API Key：用环境变量 AMAP_API_KEY 注入，别写进 yml（会被提交到仓库） */
    private String apiKey = "";

    /** 总开关：配了 Key 也能一键关掉接地，方便对比「有/无高德数据」的生成效果 */
    private boolean enabled = true;

    /** 单次高德请求超时（秒）：高德接口很快，超过这个数基本就是网络问题了 */
    private int timeoutSeconds = 8;

    /**
     * 每个城市最多用多少个地点参与两两配对。
     *
     * 调用量是**平方增长**的：两两组合数 = C(maxPoints, 2)。
     *   maxPoints=10 → 45 对；maxPoints=12 → 66 对；maxPoints=15 → 105 对。
     *
     * 个人认证 Key 驾车路径规划约 5000 次/日，14 个城市全量预热一次的消耗是
     * maxPoints=10 时 630 次（约 13%），maxPoints=15 时 1470 次。
     * 一天预热三次就把配额吃光了 —— 所以别随手调大，安全上限是 12。
     */
    private int maxPoints = 10;

    /** 同时飞到高德的请求数。调大会撞限流，见 AmapClient 里对 10004 的处理 */
    private int maxConcurrency = 4;

    /** 接地整体预算（毫秒）：超时就用已经算完的那部分，决不把用户卡在这里 */
    private long budgetMs = 8000;

    /**
     * 接地结果的缓存时长，默认 7 天。
     *
     * 这个值是**配额的总闸门**：调小了每天重算，调用量成倍上涨；
     * 调大了配置改动（比如改 maxPoints）要等过期才生效。
     * 建议不低于 72 小时。
     */
    private Duration cacheTtl = Duration.ofDays(7);

    /**
     * 降级结果（只算到一部分就超时/报错）的缓存时长。
     *
     * 不能太短：降级时下次重算会把全部 45 对**重新试一遍**，如果高德持续缓慢，
     * 每 10 分钟就烧 45 次调用，一天能烧到 6480 次 —— 反而超了 5000/日 的配额。
     * 30 分钟能把最坏情况压到 2160 次/日，安全线以内。
     */
    private Duration degradedTtl = Duration.ofMinutes(30);

    /** 去掉末尾多余的斜杠，拼接路径时不会出现双斜杠 */
    public String normalizedBaseUrl() {
        return baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
    }

    /** Key 是否已配置（配置了空字符串也算没配） */
    public boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** 能不能用：开了开关 且 配了 Key。两者缺一都直接跳过接地 */
    public boolean usable() {
        return enabled && hasApiKey();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public int getMaxPoints() {
        return maxPoints;
    }

    public void setMaxPoints(int maxPoints) {
        this.maxPoints = maxPoints;
    }

    public int getMaxConcurrency() {
        return maxConcurrency;
    }

    public void setMaxConcurrency(int maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
    }

    public long getBudgetMs() {
        return budgetMs;
    }

    public void setBudgetMs(long budgetMs) {
        this.budgetMs = budgetMs;
    }

    public Duration getCacheTtl() {
        return cacheTtl;
    }

    public void setCacheTtl(Duration cacheTtl) {
        this.cacheTtl = cacheTtl;
    }

    public Duration getDegradedTtl() {
        return degradedTtl;
    }

    public void setDegradedTtl(Duration degradedTtl) {
        this.degradedTtl = degradedTtl;
    }
}
