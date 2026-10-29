package com.youji.travel.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youji.travel.config.AmapProperties;
import com.youji.travel.dto.AmapPoint;
import com.youji.travel.dto.AmapRoute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
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
import java.util.Set;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 高德 Web 服务 API 的调用封装：地理编码、POI 关键字搜索、驾车路径规划。
 *
 * 和 AiItineraryService 一样用 JDK 自带的 HttpClient 直接发 HTTP ——
 * **没有引入任何新的 Maven 依赖**，不用等依赖下载，也不担心 SDK 版本升级。
 *
 * 【和 DeepSeek 接口最大的不同】高德**永远返回 HTTP 200**，成功失败要看响应体里的
 * status 字段（字符串 "1" 成功 / "0" 失败）和 infocode。所以 AiItineraryService
 * 里那套按 HTTP 状态码分派的 describeUpstreamError 在这里完全用不上，必须解析 body。
 *
 * 【所有对外方法都不抛异常】拿不到数据就返回 empty，让调用方当作「这项没有」处理。
 * 高德在本项目里是增强而不是依赖，绝不能因为它把行程生成搞挂。
 *
 * 【失败要「批量中止」而不是「逐个重试」】逐对算矩阵时会一口气发几十个请求，
 * 如果 Key 无效或配额用尽，每个请求都重试就是几十倍的浪费调用，
 * 还会白白卡住用户几十秒。所以下面用一个全局的 suspendUntil 时间戳做熔断。
 */
@Component
public class AmapClient {

    private static final Logger log = LoggerFactory.getLogger(AmapClient.class);

    /** 成功标志。高德的 status 是字符串 "1"，不是数字 1 */
    private static final String STATUS_OK = "1";

    /** 命中 QPS 限流后的退避间隔（毫秒），重试次数就是这个数组的长度 */
    private static final long[] RETRY_BACKOFF_MS = {800, 2000};

    /** QPS 超限类错误：等一会儿重试就行，不是真的失败 */
    private static final Set<String> RETRYABLE_CODES = Set.of("10015", "10020", "10021");

    /**
     * 算路失败类错误码：这两个点之间确实没有可行车路线（隔海、离路太远、超出规划范围等）。
     * 属于正常业务结果，不记 warn —— 逐对算矩阵时它会大量出现，每对都记就把日志淹了。
     */
    private static final Set<String> NO_ROUTE_CODES = Set.of("20011", "20800", "20801", "20802", "20803");

    /** 挂起时长（毫秒）。10004 是「封停一分钟」，所以留出 62 秒的余量 */
    private static final long SUSPEND_RATE_LIMIT_MS = 62_000;
    /** Key 无效/服务类型不对：多半要改配置重启，挂起 5 分钟就够，别把重启后的重试也堵死 */
    private static final long SUSPEND_FATAL_MS = 5 * 60_000;
    /** 日配额用尽：短时间内不可能恢复，挂久一点，避免用户每点一次生成就白跑几十个请求 */
    private static final long SUSPEND_QUOTA_MS = 30 * 60_000;

    private final AmapProperties props;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    /** 限流闸门，控制同时飞到高德的请求数 */
    private final Semaphore permits;

    /**
     * 熔断时间戳：在此之前不再发任何请求，直接返回缓存的失败原因。
     * 高德的 10004 不是「这一个请求失败」，而是**整个账号被封停一分钟**，
     * 用退避重试去硬扛只会浪费调用，还会把封停时间拖得更久。
     */
    private final AtomicLong suspendUntil = new AtomicLong(0);

    /** 熔断期间用于回答「为什么不行」的错误码 */
    private final AtomicReference<String> suspendCode = new AtomicReference<>("");

    /** 熔断日志只打一次，避免几十个并发请求刷屏 */
    private final AtomicReference<String> lastLoggedSuspend = new AtomicReference<>("");

    public AmapClient(AmapProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
        this.permits = new Semaphore(Math.max(1, props.getMaxConcurrency()));
        // 复用同一个 HttpClient：每次调用都新建会泄漏 selector 线程
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    /* ---------- 三个对外方法 ---------- */

    /**
     * 地理编码：地名 → 坐标。
     *
     * 返回的 level 一定要看：高德对「都江堰」这种既是景区又是行政区的地名，
     * 可能只匹配到「区县」级别 —— 那是区政府所在地的质心，拿来算车程毫无意义。
     * 判断逻辑放在调用方（AmapGroundingService），这里只如实返回。
     *
     * @param city 城市名，传了能显著提高准确率（「西湖」不只杭州有）
     */
    public Optional<GeocodeHit> geocode(String city, String address) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("address", address);
        if (city != null && !city.isBlank()) {
            params.put("city", city);
        }

        ApiResponse response = call("/v3/geocode/geo", params, "地理编码「" + address + "」");
        if (!response.ok()) {
            return Optional.empty();
        }

        JsonNode geocodes = response.data().path("geocodes");
        if (!geocodes.isArray() || geocodes.isEmpty()) {
            // 高德查不到地名时不报错，只返回空数组 —— 很常见（比如「什刹海 · 胡同」的后半段），不值得 warn
            log.debug("地理编码无结果：{}（{}）", address, city);
            return Optional.empty();
        }

        String location = text(geocodes.get(0).path("location"));
        if (location.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(new GeocodeHit(location, text(geocodes.get(0).path("level"))));
    }

    /** 地理编码结果：坐标 + 匹配级别。level 形如「兴趣点」「门牌号」「区县」「市」 */
    public record GeocodeHit(String location, String level) {
    }

    /** POI 关键字搜索：找出城市里的真实景点，用来补充数据库里那 3 个景点 */
    public List<AmapPoint> searchPoi(String keywords, String city, int limit) {
        if (limit <= 0) {
            return List.of();
        }
        Map<String, String> params = new LinkedHashMap<>();
        params.put("keywords", keywords);
        params.put("city", city);
        // citylimit=true 很关键：不加的话「西湖」会搜出全国同名景点
        params.put("citylimit", "true");
        params.put("offset", "25");     // 一次多取一些，再在本地筛
        params.put("page", "1");
        // extensions=all 才带 biz_ext（评分就在里面）
        params.put("extensions", "all");

        ApiResponse response = call("/v3/place/text", params, "POI 搜索「" + keywords + "·" + city + "」");
        if (!response.ok()) {
            return List.of();
        }

        JsonNode pois = response.data().path("pois");
        if (!pois.isArray()) {
            return List.of();
        }

        List<AmapPoint> found = new ArrayList<>();
        for (JsonNode poi : pois) {
            if (found.size() >= limit) {
                break;
            }
            String name = text(poi.path("name")).trim();
            String location = text(poi.path("location"));
            if (name.isEmpty() || location.isBlank()) {
                continue;
            }
            // 只要真正的游览地：类型码 11xxxx 是风景名胜（含公园广场、博物馆、寺庙等）
            String typecode = text(poi.path("typecode"));
            String type = text(poi.path("type"));
            if (!typecode.startsWith("11") && !type.contains("风景名胜")) {
                continue;
            }
            found.add(new AmapPoint(
                    name,
                    location,
                    blankToNull(text(poi.path("adname"))),
                    blankToNull(text(poi.path("biz_ext").path("rating"))),
                    false));
        }
        // 刻意**不按评分重排**：高德默认按热度（权重）返回，这正是我们要的。
        // 改成按评分降序会把「某不知名 5.0 分纪念馆」顶到外滩前面，适得其反。
        return found;
    }

    /**
     * 驾车路径规划：距离 + 耗时 + 打车费。
     *
     * 【必须带 extensions=all】taxi_cost 只在 all 时返回。用 base 的话代码能跑通、
     * 字段却是空的，打车费会悄无声息地消失 —— 这是本项目最容易踩的坑。
     */
    public Optional<AmapRoute> driving(AmapPoint from, AmapPoint to) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("origin", from.getLocation());
        params.put("destination", to.getLocation());
        params.put("extensions", "all");

        ApiResponse response = call("/v3/direction/driving", params, "路径规划");
        if (!response.ok()) {
            return Optional.empty();
        }

        JsonNode paths = response.data().path("route").path("paths");
        // status=1 时 paths 仍可能是空数组，取值前必须判空
        if (!paths.isArray() || paths.isEmpty()) {
            return Optional.empty();
        }

        JsonNode path = paths.get(0);
        int distance = path.path("distance").asInt(0);
        int duration = path.path("duration").asInt(0);
        if (distance <= 0) {
            return Optional.empty();
        }

        // taxi_cost 在 route 这一层，不在 path 里；拿不到就是 null，由 AmapRoute.describe() 处理
        String taxiText = text(response.data().path("route").path("taxi_cost"));

        return Optional.of(new AmapRoute(
                from.getName(), to.getName(), distance, duration, parseTaxiCost(taxiText)));
    }

    /**
     * 连通性自检，给 /api/amap/status 用。
     *
     * @return 空字符串表示一切正常，否则是给用户看的中文错误说明
     */
    public String checkConnectivity() {
        if (!props.hasApiKey()) {
            return "未配置高德 Key：到 lbs.amap.com 申请（服务平台选「Web服务」），"
                    + "设置环境变量 AMAP_API_KEY 后重启后端。";
        }
        ApiResponse response = call("/v3/geocode/geo",
                Map.of("address", "北京市", "city", "北京"), "连通性自检");
        return response.ok() ? "" : explain(response);
    }

    /* ---------- 内部实现 ---------- */

    /** 一次高德调用的结果，把「成功/失败 + 错误码」一起带回来，不用异常做控制流 */
    private record ApiResponse(boolean ok, JsonNode data, String infocode, String info) {
    }

    private ApiResponse call(String path, Map<String, String> params, String what) {
        long now = System.currentTimeMillis();
        if (now < suspendUntil.get()) {
            // 熔断中：不发请求，直接把上次的失败原因原样返回
            String code = suspendCode.get();
            logOnce(code, what, suspendUntil.get() - now);
            return new ApiResponse(false, null, code, "");
        }

        URI uri = buildUri(path, params);

        for (int attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
            ApiResponse parsed = null;
            String ioError = null;

            try {
                permits.acquire();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return new ApiResponse(false, null, "", "");
            }

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(uri)
                        .timeout(Duration.ofSeconds(props.getTimeoutSeconds()))
                        .GET()
                        .build();
                HttpResponse<String> response =
                        httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                parsed = parse(response.body(), what);
            } catch (IOException e) {
                // 网络不通、DNS 解析不了、超时
                ioError = e.getClass().getSimpleName() + (e.getMessage() == null ? "" : " " + e.getMessage());
            } catch (InterruptedException e) {
                // 被中断说明整个应用在收摊，没必要重试，直接放弃这一条
                Thread.currentThread().interrupt();
                return new ApiResponse(false, null, "", "");
            } finally {
                // 许可只覆盖「真的在飞」的这段时间，下面退避时已经还回去了
                permits.release();
            }

            if (parsed != null && parsed.ok()) {
                return parsed;
            }

            boolean retryable = (parsed != null && RETRYABLE_CODES.contains(parsed.infocode()))
                    || ioError != null;
            if (!retryable || attempt == RETRY_BACKOFF_MS.length) {
                if (ioError != null) {
                    log.warn("高德调用失败（{}）：{}", what, ioError);
                }
                return parsed != null ? parsed : new ApiResponse(false, null, "", "");
            }

            // 【退避必须在释放许可之后】限流时线程握着并发额度睡大觉，
            // 额度被睡眠的线程占满，真实在飞的请求数掉到接近零 ——
            // 然后一起醒来又是一波突发。表现就是「每秒几个 10021」来回振荡，
            // 整个矩阵的时间全耗在互相等许可上。
            sleep(RETRY_BACKOFF_MS[attempt]);
        }
        return new ApiResponse(false, null, "", "");
    }

    /** 解析响应体。高德失败时也返回 HTTP 200，所以判断逻辑全在这里 */
    private ApiResponse parse(String body, String what) {
        JsonNode root;
        try {
            root = objectMapper.readTree(body);
        } catch (Exception e) {
            log.warn("高德返回的不是 JSON（{}）：{}", what, truncate(body));
            return new ApiResponse(false, null, "", "");
        }

        if (STATUS_OK.equals(text(root.path("status")))) {
            return new ApiResponse(true, root, "", "");
        }

        String infocode = text(root.path("infocode"));
        String info = text(root.path("info"));

        // 触发熔断，让后续几十个请求直接短路，而不是一个个去撞墙
        suspend(infocode);

        if (NO_ROUTE_CODES.contains(infocode)) {
            log.debug("高德算路无结果（{}）：{} {}", what, infocode, info);
        } else {
            log.warn("高德接口报错（{}）：infocode={} info={}", what, infocode, info);
        }
        return new ApiResponse(false, null, infocode, info);
    }

    /**
     * 按错误码决定要不要熔断。
     *
     * 注意 10004（访问过频）**不在重试列表里**：它是封停一分钟，
     * 睡几百毫秒再打过去只会撞上同一堵墙，还得再赔上几十个请求。
     */
    private void suspend(String infocode) {
        long duration = switch (infocode) {
            case "10004", "10020", "10021" -> 0L;              // QPS 类交给退避重试，不熔断
            case "10003", "10044" -> SUSPEND_QUOTA_MS;          // 日配额用尽
            case "10001", "10002", "10009", "10007", "10008" -> SUSPEND_FATAL_MS;  // Key / 服务类型 / 签名
            default -> 0L;
        };
        if (duration > 0) {
            suspendCode.set(infocode);
            suspendUntil.set(System.currentTimeMillis() + duration);
        }
    }

    /** 熔断期间只打一次日志，不然几十个并发请求会把日志刷爆 */
    private void logOnce(String code, String what, long remainMs) {
        if (lastLoggedSuspend.getAndSet(code).equals(code)) {
            return;
        }
        log.warn("高德接口已熔断（infocode={}），{} 内不再发起请求，本次跳过：{}",
                code, (remainMs / 1000) + " 秒", what);
    }

    /** 把 infocode 翻成用户能看懂的中文。原文已经由 parse() 记进日志了 */
    private String explain(ApiResponse response) {
        return switch (response.infocode()) {
            case "10001" -> "高德 Key 无效或已过期，请检查环境变量 AMAP_API_KEY。";
            case "10002", "10009" -> "高德 Key 的服务平台类型不对：申请时要选「Web服务」，"
                    + "选成「Web端(JS API)」或「Android」都会报这个错。";
            case "10003", "10044" -> "高德今日调用量已用完，稍后自动恢复；行程仍可生成，只是没有实时交通数据。";
            case "10004", "10020", "10021" -> "高德访问过于频繁，已被临时限流（约一分钟），稍后自动恢复。";
            case "10007", "10008" -> "高德数字签名校验失败：请到控制台把该 Key 的「数字签名」关闭。";
            case "" -> "连不上高德接口，请检查网络。";
            default -> "高德接口调用失败（infocode=" + response.infocode()
                    + (response.info().isBlank() ? "" : " " + response.info()) + "）。";
        };
    }

    private URI buildUri(String path, Map<String, String> params) {
        StringBuilder sb = new StringBuilder(props.normalizedBaseUrl()).append(path).append('?');
        for (Map.Entry<String, String> entry : params.entrySet()) {
            sb.append(entry.getKey()).append('=').append(encode(entry.getValue())).append('&');
        }
        sb.append("key=").append(encode(props.getApiKey()));
        return URI.create(sb.toString());
    }

    /**
     * URLEncoder 是按 application/x-www-form-urlencoded 写的，会把空格编成 "+"。
     * 高德不保证把 "+" 还原成空格 —— 而复合景点名（「都江堰 · 青城山」）里全是空格，
     * 所以必须换成 %20。
     */
    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    /**
     * 安全地取文本。
     *
     * 高德在字段没值时返回的是**空数组 [] 而不是空字符串**，直接 asText() 在大多数
     * 情况下会退化成 ""，但用 isTextual() 明判一次更稳妥，也免得以后踩到别的形状。
     */
    private static String text(JsonNode node) {
        return node != null && node.isTextual() ? node.asText() : "";
    }

    private static Integer parseTaxiCost(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            return (int) Math.round(Double.parseDouble(text));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static String truncate(String text) {
        if (text == null) {
            return "";
        }
        return text.length() > 200 ? text.substring(0, 200) + "…" : text;
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
