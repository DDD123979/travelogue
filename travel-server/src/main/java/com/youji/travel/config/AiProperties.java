package com.youji.travel.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 大模型（AI 行程规划）配置，对应 application.yml 里的 youji.ai.*
 *
 * 模型名刻意放进配置而不是写死在代码里：
 * DeepSeek 在 2026-07-24 停用了 deepseek-chat / deepseek-reasoner 两个旧名，
 * 旧名请求会直接报错。以后再换名，改 application.yml 一行就行，不用重新编译。
 */
@ConfigurationProperties(prefix = "youji.ai")
public class AiProperties {

    /** 接口地址（OpenAI 兼容格式）。想换通义、智谱等，改这一行即可 */
    private String baseUrl = "https://api.deepseek.com";

    /** API Key：用环境变量 DEEPSEEK_API_KEY 注入，别写进 yml（会被提交到仓库） */
    private String apiKey = "";

    /** 模型 ID：deepseek-flash（快、便宜）/ deepseek-v4-pro（更强、更贵） */
    private String model = "deepseek-flash";

    /**
     * 是否开启思考模式：
     *   null（默认）= 不发送这个参数，用服务端默认行为，最稳妥；
     *   false       = 强制关闭思考，更快更省，行程质量略降。
     */
    private Boolean thinking;

    /** 单次请求超时（秒）：行程正文较长，留足时间 */
    private int timeoutSeconds = 120;

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

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Boolean getThinking() {
        return thinking;
    }

    public void setThinking(Boolean thinking) {
        this.thinking = thinking;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    /** 去掉末尾多余的斜杠，拼接 /chat/completions 时不会出现双斜杠 */
    public String normalizedBaseUrl() {
        return baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
    }

    /** Key 是否已配置（配置了空字符串也算没配） */
    public boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }
}
