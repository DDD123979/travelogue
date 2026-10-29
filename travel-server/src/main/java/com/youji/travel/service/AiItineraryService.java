package com.youji.travel.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youji.travel.common.ApiException;
import com.youji.travel.config.AiProperties;
import com.youji.travel.dto.AttractionDTO;
import com.youji.travel.dto.DestinationDTO;
import com.youji.travel.dto.ItineraryRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

/**
 * AI 行程规划：把「目的地 + 景点」喂给大模型，让它排出一份逐日行程。
 *
 * 用 JDK 自带的 java.net.http.HttpClient 直接发 HTTP，没有引入任何新依赖：
 * DeepSeek 的接口是 OpenAI 兼容格式（POST /chat/completions），
 * 请求体就是一段 JSON，套 SDK 反而多一个要跟着升级的包。
 *
 * 走流式（stream=true）：一篇完整行程要生成十几秒，一次性返回的话用户只能干等，
 * 流式则是边生成边显示，体验差别很大。解析的是标准 SSE：每行 "data: {...}"，
 * 末尾一个 "data: [DONE]"。
 */
@Service
public class AiItineraryService {

    private static final Logger log = LoggerFactory.getLogger(AiItineraryService.class);

    /** 输出上限：这只是「最多能写多长」，不是实际花费，写不满就不花钱 */
    private static final int MAX_TOKENS = 8192;

    private static final int MIN_DAYS = 1;
    private static final int MAX_DAYS = 15;

    private final AiProperties props;
    private final DestinationService destinationService;
    private final AmapGroundingService amapGrounding;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiItineraryService(AiProperties props,
                             DestinationService destinationService,
                             AmapGroundingService amapGrounding,
                             ObjectMapper objectMapper) {
        this.props = props;
        this.destinationService = destinationService;
        this.amapGrounding = amapGrounding;
        this.objectMapper = objectMapper;
        // 行程规划最长可能要等两分钟，连接池按默认配置即可，超时由每个请求自己定
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    /**
     * 生成行程并逐段回调。
     *
     * @param request  前端传来的目的地/天数/偏好
     * @param onText   每收到一段正文就回调一次（增量文本，按顺序拼接即全文）
     * @param onStatus 需要告诉用户「还在忙」时的提示语，例如思考模式下先思考后输出
     * @return 完整正文，方便调用方记日志
     */
    public String streamItinerary(ItineraryRequest request,
                                  Consumer<String> onText,
                                  Consumer<String> onStatus) {
        DestinationDTO destination = loadDestination(request);
        int days = normalizeDays(request.getDays());

        if (!props.hasApiKey()) {
            throw ApiException.unavailable(
                    "还没有配置大模型 API Key：请到 platform.deepseek.com 申请一个，"
                            + "把环境变量 DEEPSEEK_API_KEY 设成它，然后重启后端。");
        }

        // 用高德的真实数据给行程「接地」：景点来自高德 POI，交通数字来自路径规划。
        // 拿不到就返回空串，行程照常生成，只是提示词会相应放宽 —— 高德是增强不是依赖。
        //
        // 注意位置：放在 DeepSeek Key 检查**之后**。那条检查不过的话生成必然失败，
        // 先接地就是白烧几十次高德调用。
        //
        // grounding 是局部变量、按参数往下一层层传，**绝不能存成字段**：
        // 这个 Bean 是单例，会被多个虚拟线程同时进入。
        String grounding = amapGrounding.buildBlock(destination, onStatus);

        String body = buildRequestBody(destination, days, request.getPreference(), grounding);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(props.normalizedBaseUrl() + "/chat/completions"))
                .header("Content-Type", "application/json; charset=utf-8")
                .header("Authorization", "Bearer " + props.getApiKey())
                .header("Accept", "text/event-stream")
                .timeout(Duration.ofSeconds(props.getTimeoutSeconds()))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        try {
            HttpResponse<InputStream> response =
                    httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() != 200) {
                throw ApiException.unavailable(describeUpstreamError(response));
            }
            return readStream(response.body(), onText, onStatus);
        } catch (IOException e) {
            // 网络不通、DNS 解析不了、超时都会到这里
            throw ApiException.unavailable("连不上大模型接口（" + props.normalizedBaseUrl() + "）："
                    + e.getClass().getSimpleName() + (e.getMessage() == null ? "" : " - " + e.getMessage()));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw ApiException.unavailable("生成被中断，请重试。");
        }
    }

    /**
     * 配置自检：告诉调用方 Key 配没配、模型名在当前账号下到底存不存在。
     *
     * 之所以需要它：模型名是会过期的（DeepSeek 就停用过 deepseek-chat），
     * 猜名字不如直接问接口要一份可用列表。
     */
    public Map<String, Object> status() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("baseUrl", props.normalizedBaseUrl());
        result.put("model", props.getModel());
        result.put("apiKeyConfigured", props.hasApiKey());

        if (!props.hasApiKey()) {
            result.put("hint", "未配置 Key：到 platform.deepseek.com 申请，设置环境变量 DEEPSEEK_API_KEY 后重启后端");
            return result;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(props.normalizedBaseUrl() + "/models"))
                    .header("Authorization", "Bearer " + props.getApiKey())
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() != 200) {
                result.put("error", "查询模型列表失败（HTTP " + response.statusCode() + "）");
                return result;
            }

            List<String> ids = new ArrayList<>();
            for (JsonNode node : objectMapper.readTree(response.body()).path("data")) {
                ids.add(node.path("id").asText());
            }
            result.put("availableModels", ids);
            result.put("modelUsable", ids.contains(props.getModel()));
            if (!ids.isEmpty() && !ids.contains(props.getModel())) {
                result.put("hint", "当前配置的模型名不在可用列表里，请把 application.yml 的 youji.ai.model 改成上面某一个");
            }
            return result;
        } catch (IOException e) {
            result.put("error", "查询模型列表失败：" + e.getClass().getSimpleName());
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            result.put("error", "查询模型列表被中断");
            return result;
        }
    }

    /* ---------- 以下为内部实现 ---------- */

    /** 校验并取出目的地：不存在就 404，ID 不合法就 400 */
    private DestinationDTO loadDestination(ItineraryRequest request) {
        if (request == null || request.getDestinationId() == null) {
            throw ApiException.badRequest("请先选择目的地");
        }
        Optional<DestinationDTO> found = destinationService.findById(request.getDestinationId());
        return found.orElseThrow(() -> ApiException.notFound("目的地不存在：" + request.getDestinationId()));
    }

    private int normalizeDays(Integer days) {
        if (days == null) {
            return 3;
        }
        if (days < MIN_DAYS || days > MAX_DAYS) {
            throw ApiException.badRequest("天数要在 " + MIN_DAYS + "-" + MAX_DAYS + " 之间");
        }
        return days;
    }

    /** 拼请求体：模型、流式开关、消息列表，思考模式按配置决定发不发 */
    private String buildRequestBody(DestinationDTO destination, int days, String preference, String grounding) {
        boolean grounded = grounding != null && !grounding.isEmpty();
        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt(grounded)),
                Map.of("role", "user", "content", buildUserPrompt(destination, days, preference, grounding))
        );

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", props.getModel());
        body.put("messages", messages);
        body.put("stream", true);
        body.put("max_tokens", MAX_TOKENS);
        if (props.getThinking() != null) {
            // 值是 null 时整个字段不发：不同厂商对这个参数的支持情况不一致，
            // 不显式配置就交给服务端默认行为，最不容易踩坑
            body.put("thinking", Map.of("type", props.getThinking() ? "enabled" : "disabled"));
        }

        try {
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw ApiException.unavailable("组装请求失败：" + e.getMessage());
        }
    }

    private String buildUserPrompt(DestinationDTO destination, int days, String preference, String grounding) {
        StringBuilder sb = new StringBuilder();

        sb.append("目的地：").append(destination.getName());
        if (destination.getLocation() != null) {
            sb.append("（").append(destination.getLocation()).append("）");
        }
        if (destination.getCategory() != null) {
            sb.append("，类型：").append(destination.getCategory());
        }
        sb.append('\n');

        if (destination.getRating() != null) {
            sb.append("平台评分：").append(destination.getRating()).append('\n');
        }
        if (destination.getBestSeason() != null) {
            sb.append("最佳季节：").append(destination.getBestSeason()).append('\n');
        }
        if (destination.getTags() != null && !destination.getTags().isEmpty()) {
            sb.append("城市标签：").append(String.join("、", destination.getTags())).append('\n');
        }
        if (destination.getDescription() != null) {
            sb.append("城市简介：").append(destination.getDescription()).append('\n');
        }

        List<AttractionDTO> attractions = destination.getAttractions();
        if (attractions != null && !attractions.isEmpty()) {
            sb.append("\n可安排的景点（来自本站数据库）：\n");
            for (AttractionDTO a : attractions) {
                sb.append("- ").append(a.getName());
                if (a.getTime() != null) {
                    sb.append("（建议耗时 ").append(a.getTime()).append("）");
                }
                if (a.getDesc() != null) {
                    sb.append("：").append(a.getDesc());
                }
                sb.append('\n');
            }
        }

        // 高德实测数据：真实的地点清单 + 两两之间的驾车距离/耗时/打车费。
        // 它紧跟在景点列表后面，是因为「可补充哪些地点」和「这段路要多久」是同一个决策，
        // 放在一起模型引用得最准。为空则整块不出现。
        if (grounding != null && !grounding.isEmpty()) {
            sb.append(grounding);
        }

        sb.append("\n我的需求：\n");
        sb.append("- 天数：").append(days).append(" 天\n");
        if (preference != null && !preference.isBlank()) {
            sb.append("- 特别说明：").append(preference.trim()).append('\n');
        } else {
            sb.append("- 特别说明：无，按大众口味安排\n");
        }

        sb.append("\n请按系统提示里的结构，输出这 ").append(days).append(" 天的完整行程。");
        return sb.toString();
    }

    /** 逐行读 SSE，把正文增量回调出去；思考内容本身不展示，只提示一次「正在思考」 */
    private String readStream(InputStream body,
                              Consumer<String> onText,
                              Consumer<String> onStatus) throws IOException {
        StringBuilder full = new StringBuilder();
        boolean statusNotified = false;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(body, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isEmpty() || line.startsWith(":")) {
                    continue;   // 空行是事件分隔符，冒号开头是心跳注释
                }
                if (!line.startsWith("data:")) {
                    continue;
                }
                String payload = line.substring("data:".length()).trim();
                if (payload.isEmpty()) {
                    continue;
                }
                if ("[DONE]".equals(payload)) {
                    break;
                }

                JsonNode delta = objectMapper.readTree(payload).path("choices").path(0).path("delta");

                JsonNode reasoning = delta.get("reasoning_content");
                if (!statusNotified && reasoning != null && !reasoning.isNull()) {
                    statusNotified = true;
                    onStatus.accept("正在思考行程安排…");
                }

                String text = delta.path("content").asText("");
                if (!text.isEmpty()) {
                    full.append(text);
                    onText.accept(text);
                }
            }
        }

        if (full.isEmpty()) {
            throw ApiException.unavailable("大模型没有返回任何内容，请稍后重试；若反复如此，"
                    + "用 GET /api/ai/status 检查模型名是否可用。");
        }
        return full.toString();
    }

    /** 把上游的报错翻译成用户能看懂的中文，原文留在后端日志里 */
    private String describeUpstreamError(HttpResponse<InputStream> response) {
        String raw = "";
        try (InputStream in = response.body()) {
            raw = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("读取大模型错误响应失败", e);
        }
        log.warn("大模型接口返回 HTTP {}：{}", response.statusCode(), raw);

        int code = response.statusCode();
        if (code == 401) {
            return "大模型拒绝了这次请求：API Key 无效。请检查环境变量 DEEPSEEK_API_KEY 是否填对。";
        }
        if (code == 402) {
            return "大模型账户余额不足，请先充值后再试。";
        }
        if (code == 404) {
            return "模型名「" + props.getModel() + "」不可用。请访问 GET /api/ai/status 查看可用模型，"
                    + "再改 application.yml 里的 youji.ai.model。";
        }
        if (code == 429) {
            return "请求太频繁或额度用尽，稍等一会儿再试。";
        }
        return "大模型接口调用失败（HTTP " + code + "）：" + extractErrorMessage(raw);
    }

    private String extractErrorMessage(String raw) {
        try {
            JsonNode error = objectMapper.readTree(raw).path("error");
            String message = error.path("message").asText("");
            if (!message.isEmpty()) {
                return message;
            }
        } catch (Exception ignored) {
            // 上游返回的不是 JSON，直接用原文（截断一点，别把整页 HTML 甩给用户）
        }
        return raw.length() > 200 ? raw.substring(0, 200) + "…" : raw;
    }

    /**
     * 系统提示词第 1-6 条：结构固定，前端才能稳定地按 Markdown 渲染。
     *
     * 第 2 条的「用餐建议」原来写的是「具体馆子或小吃品类」，那等于邀请模型编店名，
     * 已改成「写品类或商圈，不要编店名」。
     */
    private static final String SYSTEM_PROMPT_HEAD = """
            你是「游迹」平台的资深中文旅行规划师，擅长把景点、交通和用餐排成一份真的走得完的逐日行程。

            必须遵守：
            1. 只输出 Markdown 正文，不要任何寒暄、开场白或结尾客套（不要出现「希望对你有帮助」这类话）。
            2. 结构固定为三部分：
               ## 行程总览
               一句话概括这趟行程，再用无序列表写 3 条：适合人群、参考预算、整体节奏。
               ## 逐日行程
               ### 第 1 天 · 当日主题
               - **上午**：具体安排
               - **下午**：具体安排
               - **晚上**：具体安排
               - **用餐建议**：写品类或商圈（例如「宽窄巷子附近的川菜馆」），不要编店名
               每天最后单独一行「当日提示：」写一句提醒。
               ## 实用贴士
               用无序列表写 3-5 条交通、门票预约、避坑类建议。
            3. 地点只有两个来源：我给的景点清单，和用户消息里「高德地图实测数据」中列出的地点。
               这两处都不够用时，可以补充该城市全国知名的地标，但不要编造具体店名 ——
               尤其是餐馆、咖啡馆、小店的店名，宁可只写品类，也不要编一个不存在的名字。
            4. 尽量写具体：时间点（如 09:00）、大致耗时、每天的节奏。
            5. 每天安排 2-4 个点，节奏合理，不要把行程塞满；每天连续游玩时间不超过 10 小时。
            6. 用中文，语气自然，不用敬语堆砌。
            """;

    /**
     * 第 7、8 条：**本次有高德数据**。
     *
     * 这是整个改动的重点：原来第 4 条要求「交通方式（地铁几号线 / 打车大概多少钱多久）」，
     * 模型没有这些数据，只能编 —— 提示词自己在逼它说谎。现在改成「表里有就照抄、表里没有就只写方式」。
     */
    private static final String TRANSPORT_RULES_GROUNDED = """
            7. 交通方式和数字这样处理：
               - 「高德地图实测数据」里有的地点之间：公里数、驾车时长、打车费必须照抄表里的数字，
                 可以加「约」，但不要自己换算、不要改动数量级；
               - 表里没有的地点之间：只写交通方式（步行 / 打车 / 驾车 / 地铁或公交），一个具体数字都不要写。
            8. 不要写「地铁几号线」「公交几路」。本次没有接入公交数据，写出来的线路号必然是编的。
               需要提公共交通时，统一写「地铁或公交（具体线路用地图 App 现查）」。
            """;

    /** 第 7、8 条：**本次没有高德数据**（没配 Key、超时或报错）。放宽要求，别让模型干脆不写交通 */
    private static final String TRANSPORT_RULES_UNGROUNDED = """
            7. 本次没有提供实时交通数据：交通方式可以写，但不要写任何分钟数、公里数或金额。
            8. 不要写「地铁几号线」「公交几路」。本次没有接入公交数据，写出来的线路号必然是编的。
               需要提公共交通时，统一写「地铁或公交（具体线路用地图 App 现查）」。
            """;

    /** 第 9、10 条：景点不重复；天数多、地点不够时的补充顺序 */
    private static final String SYSTEM_PROMPT_TAIL = """
            9. 同一个地点不要在行程里重复安排。
            10. 天数多、可安排的地点不够时，按这个顺序补：先把每天排成上午/下午/晚上三段、把节奏放慢；
                再补充该城市公认的知名去处；仍然不够就安排近郊的知名景区，
                并在「当日提示」里说明往返要半天以上。
            """;

    /**
     * 拼出系统提示词。
     *
     * 为什么是方法而不是一个常量：交通规则要看**本次有没有拿到高德数据**。
     * 如果接地失败还硬要求「只能引用表里的数字」，模型会干脆一个字都不写交通，
     * 反而不如让它按常识给个模糊量级。
     */
    private static String systemPrompt(boolean grounded) {
        return SYSTEM_PROMPT_HEAD
                + (grounded ? TRANSPORT_RULES_GROUNDED : TRANSPORT_RULES_UNGROUNDED)
                + SYSTEM_PROMPT_TAIL;
    }
}
