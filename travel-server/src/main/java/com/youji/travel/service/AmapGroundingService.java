package com.youji.travel.service;

import com.youji.travel.config.AmapProperties;
import com.youji.travel.dto.AmapGroundingData;
import com.youji.travel.dto.AmapPoint;
import com.youji.travel.dto.AmapRoute;
import com.youji.travel.dto.AttractionDTO;
import com.youji.travel.dto.DestinationDTO;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Consumer;
import java.util.regex.Pattern;

/**
 * 把高德的事实数据接进 AI 行程规划。
 *
 * 【为什么是「先算矩阵」而不是「按需查」】整个生成过程只有**一次**流式请求发给 DeepSeek，
 * 后端没有机会先看模型排了哪些点、再去补那几段的交通数据 —— 想按需查就必须先来一轮
 * 让模型输出顺序，那等于把一次调用拆成两次，延迟和复杂度都上去了。
 * 所以只能预先把「这批地点两两之间怎么走」全算出来，一次性喂进去。
 *
 * 【降级是常态设计，不是异常处理】高德是增强而不是依赖：没配 Key、超时、报错、
 * 配额用尽，统一返回空串，行程照常生成。这一点和 DeepSeek 的 Key 不同 ——
 * 那个没配就直接报错，因为没它整个功能不存在。
 *
 * 【只在真的要现算时才提示用户】命中缓存只要几毫秒，这时候弹一句
 * 「正在查询实时交通数据…」会一闪而过，看着像 bug。所以状态提示放在单飞任务的内部、
 * 二次检查缓存之后。
 */
@Service
public class AmapGroundingService {

    private static final Logger log = LoggerFactory.getLogger(AmapGroundingService.class);

    /** 复合景点名的分隔符：U+00B7 中间点（data.sql 里就是它，两边带空格），另外两个是防御性兼容 */
    private static final Pattern COMPOSITE_SEPARATOR = Pattern.compile("[\\u00B7\\u2022\\u30FB]");

    /**
     * 这些地理编码级别太粗：拿到的是行政区驻地坐标，不是景点本身。
     * 「都江堰」既是一个市也是景区，不卡这一道的话会拿到市政府所在地，
     * 算出来的车程完全没有参考价值。
     */
    private static final Set<String> IMPRECISE_LEVELS = Set.of("省", "市", "区县", "开发区", "国家", "未知");

    /** 去重时判定「同一个地方」的距离阈值（米） */
    private static final double SAME_PLACE_METERS = 500;

    private final AmapProperties props;
    private final AmapClient amap;
    private final AmapCache cache;
    private final DestinationService destinationService;

    /** 算两两路线用的执行器。这类任务几乎全在等网络，虚拟线程几乎不占资源 */
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    /** 单飞：同一个目的地被两个用户同时点开时，只算一次，另一个等结果 */
    private final Map<Long, CompletableFuture<AmapGroundingData>> inFlight = new ConcurrentHashMap<>();

    public AmapGroundingService(AmapProperties props,
                                AmapClient amap,
                                AmapCache cache,
                                DestinationService destinationService) {
        this.props = props;
        this.amap = amap;
        this.cache = cache;
        this.destinationService = destinationService;
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdown();
    }

    /**
     * 拼出要贴进提示词的高德数据块。
     *
     * @param onStatus 需要告诉用户「正在拉数据」时的回调，走得是 SSE 的 status 事件
     * @return 数据块文本；没有高德数据时返回空串，调用方据此把提示词放宽
     */
    public String buildBlock(DestinationDTO destination, Consumer<String> onStatus) {
        if (!props.usable()) {
            return "";
        }
        try {
            AmapGroundingData data = obtain(destination, props.getBudgetMs(), onStatus);
            return render(data);
        } catch (Exception e) {
            // 这里是「绝不阻断生成」的最后一道防线：任何意外都退化成「没有高德数据」
            log.warn("高德接地失败，本次行程不含实时交通数据：{}", e.toString());
            return "";
        }
    }

    /**
     * 预热缓存：把目的地的接地数据先算好，之后生成行程就是缓存命中、零等待。
     * 演示前跑一次就够了，别做成定时任务 —— 那会在没人用的时候白烧配额。
     *
     * @param destinationId 只预热某个目的地；传 null 表示全部
     * @param force         true 表示已缓存的也重算
     */
    public Map<String, Object> warmup(Long destinationId, boolean force) {
        if (!props.usable()) {
            throw com.youji.travel.common.ApiException.unavailable(
                    "还没配置高德 Key，预热没有意义：请到 lbs.amap.com 申请（服务平台选「Web服务」），"
                            + "把环境变量 AMAP_API_KEY 设成它，然后重启后端。");
        }

        List<DestinationDTO> targets;
        if (destinationId == null) {
            targets = destinationService.listAll();
        } else {
            targets = destinationService.findById(destinationId)
                    .map(List::of)
                    .orElseThrow(() -> com.youji.travel.common.ApiException
                            .notFound("目的地不存在：" + destinationId));
        }

        // 预热不赶时间，给足预算把矩阵算全，别留下降级结果
        long budget = Math.max(props.getBudgetMs(), 30_000L);

        List<Map<String, Object>> details = new ArrayList<>();
        int warmed = 0, skipped = 0, failed = 0;

        for (DestinationDTO destination : targets) {
            if (!force && cache.get(destination.getId()).isPresent()) {
                skipped++;
                continue;
            }
            cache.evict(destination.getId());
            try {
                AmapGroundingData data = obtain(destination, budget, note -> { });
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("destinationId", destination.getId());
                row.put("city", destination.getName());
                row.put("points", data.getPoints().size());
                row.put("routes", data.getRoutes().size());
                row.put("degraded", data.isDegraded());
                // unresolved 是调复合景点名拆分规则的抓手，出问题时一眼能看出是哪个名字没解析出来
                row.put("unresolved", data.getUnresolved());
                details.add(row);
                warmed++;
            } catch (Exception e) {
                log.warn("预热失败（{}）：{}", destination.getName(), e.toString());
                failed++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("warmed", warmed);
        result.put("skipped", skipped);
        result.put("failed", failed);
        result.put("details", details);
        return result;
    }

    /** 自检：Key 配没配、通不通、哪些城市已经预热过 */
    public Map<String, Object> status() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("enabled", props.isEnabled());
        result.put("apiKeyConfigured", props.hasApiKey());
        result.put("baseUrl", props.normalizedBaseUrl());
        result.put("maxPoints", props.getMaxPoints());
        result.put("pairCountPerCity", pairCount(props.getMaxPoints()));
        result.put("cacheTtlHours", props.getCacheTtl().toHours());
        result.put("cachedDestinations", cache.cachedDestinationIds());

        if (!props.hasApiKey()) {
            result.put("hint", "未配置 Key 不影响行程生成，只是没有实时交通数据。"
                    + "申请：lbs.amap.com（服务平台必须选「Web服务」），"
                    + "设置环境变量 AMAP_API_KEY 后重启后端。");
            return result;
        }

        String error = amap.checkConnectivity();
        result.put("reachable", error.isEmpty());
        if (!error.isEmpty()) {
            result.put("error", error);
        }
        if (result.get("cachedDestinations") instanceof List<?> list && list.isEmpty()) {
            result.put("hint", "还没预热任何城市，首次生成会多等几秒。"
                    + "演示前先跑一次 POST /api/amap/warmup 。");
        }
        return result;
    }

    /* ---------- 内部实现 ---------- */

    /** 取数据：缓存 → 单飞计算 → 兜底空结果 */
    private AmapGroundingData obtain(DestinationDTO destination, long budgetMs, Consumer<String> onStatus) {
        Long id = destination.getId();

        Optional<AmapGroundingData> cached = cache.get(id);
        if (cached.isPresent()) {
            return cached.get();
        }

        CompletableFuture<AmapGroundingData> future = inFlight.computeIfAbsent(id, key ->
                CompletableFuture.supplyAsync(() -> {
                    try {
                        // 二次检查：排队等锁的这段时间里，可能已经被另一个请求算完了
                        Optional<AmapGroundingData> again = cache.get(key);
                        if (again.isPresent()) {
                            return again.get();
                        }
                        onStatus.accept("正在查询实时交通数据…");
                        AmapGroundingData built = build(destination, budgetMs);
                        cache.put(key, built);
                        return built;
                    } finally {
                        inFlight.remove(key);
                    }
                }, executor));

        try {
            // 比计算预算再宽限两秒，留给「算完到写缓存」
            return future.get(budgetMs + 2000, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            // 计算还在后台跑，跑完会写进缓存，下次请求就是命中
            log.warn("高德接地超时（目的地 {}），本次不接地", id);
            return new AmapGroundingData(destination.getName(), List.of(), List.of());
        } catch (Exception e) {
            log.warn("高德接地计算失败（目的地 {}）：{}", id, e.toString());
            return new AmapGroundingData(destination.getName(), List.of(), List.of());
        }
    }

    private AmapGroundingData build(DestinationDTO destination, long budgetMs) {
        long deadline = System.currentTimeMillis() + budgetMs;
        String city = destination.getName();

        List<AmapPoint> points = new ArrayList<>();
        List<String> unresolved = new ArrayList<>();

        // 1. 数据库里的推荐景点 → 坐标
        List<AttractionDTO> attractions = destination.getAttractions();
        if (attractions != null) {
            for (AttractionDTO attraction : attractions) {
                for (String segment : splitComposite(attraction.getName())) {
                    Optional<AmapPoint> resolved = resolveSegment(city, segment);
                    if (resolved.isPresent()) {
                        points.add(resolved.get());
                    } else {
                        unresolved.add(segment);
                    }
                }
            }
        }

        // 2. 高德 POI 补充同城景点。多取 5 个候选，因为去重会刷掉一部分
        int room = props.getMaxPoints() - points.size();
        if (room > 0 && System.currentTimeMillis() < deadline) {
            for (AmapPoint candidate : amap.searchPoi("景点", city, room + 5)) {
                if (points.size() >= props.getMaxPoints()) {
                    break;
                }
                if (!isDuplicate(points, candidate)) {
                    points.add(candidate);
                }
            }
        }

        // 3. 两两算驾车方案
        RouteResult result = computeRoutes(points, deadline);

        AmapGroundingData data = new AmapGroundingData(city, points, result.routes());
        data.setUnresolved(unresolved);
        // 降级的判定有两个来源：
        //   1. 没算完（超预算或中途出错）——
        //      注意不是「算出来几条」：有些组合高德确实没有可行车路线（隔海、超出规划范围），
        //      那是正常结果，不该算降级。
        //   2. 连 2 个地点都没解析出来 —— 这种数据对提示词毫无价值。
        //      它必须算降级，否则空结果会按**完整 7 天**缓存：用户配好 Key 之后
        //      还得等一周才能生效，排查起来极其莫名其妙。
        data.setDegraded(!result.complete() || points.size() < 2);
        if (data.isDegraded()) {
            log.warn("高德接地降级：目的地 {}，{} 个地点，只算到 {}/{} 条路线",
                    destination.getId(), points.size(), result.routes().size(), pairCount(points.size()));
        }
        return data;
    }

    /**
     * 把数据库里的景点名拆成可地理编码的地名。
     *
     * 42 个景点里有 14 个是「都江堰 · 青城山」这种复合名，**整串去地理编码必然失败**。
     * 拆开之后每一段各自成为一个地点 —— 这不是将就：都江堰和青城山相隔约 20 公里，
     * 它们之间那条腿恰恰是行程里最需要提前知道的信息。
     *
     * 「什刹海 · 胡同」这种后半段是类别词而非地名的，会在解析阶段自然失败被丢掉，正合适。
     */
    private static List<String> splitComposite(String name) {
        if (name == null || name.isBlank()) {
            return List.of();
        }
        List<String> parts = new ArrayList<>();
        for (String part : COMPOSITE_SEPARATOR.split(name)) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                parts.add(trimmed);
            }
        }
        return parts.isEmpty() ? List.of(name.trim()) : parts;
    }

    /** 一个地名 → 坐标。先地理编码，级别太粗就退回 POI 搜索 */
    private Optional<AmapPoint> resolveSegment(String city, String segment) {
        Optional<AmapClient.GeocodeHit> hit = amap.geocode(city, segment);
        if (hit.isPresent() && isPreciseEnough(hit.get().level())) {
            return Optional.of(new AmapPoint(segment, hit.get().location(), null, null, true));
        }

        // 地理编码没结果、或者只匹配到「区县」这种粗粒度（拿到的是政府驻地坐标），
        // 改用 POI 搜索按名字找这个具体的点
        for (AmapPoint poi : amap.searchPoi(segment, city, 5)) {
            if (nameMatches(poi.getName(), segment)) {
                return Optional.of(poi);
            }
        }
        return Optional.empty();
    }

    private static boolean isPreciseEnough(String level) {
        return level != null && !level.isBlank() && !IMPRECISE_LEVELS.contains(level);
    }

    private static boolean nameMatches(String poiName, String segment) {
        return poiName.equals(segment) || poiName.contains(segment) || segment.contains(poiName);
    }

    /** 和高德 POI 去重，免得同一个景点在提示词里出现两次 */
    private static boolean isDuplicate(List<AmapPoint> points, AmapPoint candidate) {
        String candidateName = normalizeName(candidate.getName());
        if (candidateName.isEmpty()) {
            return true;
        }
        for (AmapPoint existing : points) {
            String existingName = normalizeName(existing.getName());
            if (existingName.equals(candidateName)) {
                return true;
            }
            // 名字互相包含 **且** 位置几乎重合才算同一个地方。
            // 只判名字会误杀「外滩」和「陆家嘴」这类真的相邻但不同的点
            if ((existingName.contains(candidateName) || candidateName.contains(existingName))
                    && withinMeters(existing.getLocation(), candidate.getLocation(), SAME_PLACE_METERS)) {
                return true;
            }
        }
        return false;
    }

    private static String normalizeName(String name) {
        return name == null ? "" : name.replaceAll("[\\s·•・（）()\\-—]", "").toLowerCase();
    }

    /** 粗略的平面近似，判断「是不是同一个地方」够用了，不需要精确的大地测量 */
    private static boolean withinMeters(String a, String b, double meters) {
        double[] pa = parseLocation(a);
        double[] pb = parseLocation(b);
        if (pa == null || pb == null) {
            return false;
        }
        double dx = (pa[0] - pb[0]) * 111_320 * Math.cos(Math.toRadians(pa[1]));
        double dy = (pa[1] - pb[1]) * 110_540;
        return Math.sqrt(dx * dx + dy * dy) < meters;
    }

    private static double[] parseLocation(String location) {
        if (location == null) {
            return null;
        }
        String[] parts = location.split(",");
        if (parts.length != 2) {
            return null;
        }
        try {
            return new double[]{Double.parseDouble(parts[0].trim()), Double.parseDouble(parts[1].trim())};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private record RouteResult(List<AmapRoute> routes, boolean complete) {
    }

    /** 把地点两两组合全算一遍。A→B 和 B→A 只算一次，距离耗时基本对称，不值得翻倍配额 */
    private RouteResult computeRoutes(List<AmapPoint> points, long deadline) {
        List<AmapRoute> routes = Collections.synchronizedList(new ArrayList<>());
        List<CompletableFuture<Void>> tasks = new ArrayList<>();

        for (int i = 0; i < points.size(); i++) {
            for (int j = i + 1; j < points.size(); j++) {
                AmapPoint from = points.get(i);
                AmapPoint to = points.get(j);
                tasks.add(CompletableFuture.runAsync(
                        () -> amap.driving(from, to).ifPresent(routes::add), executor));
            }
        }

        boolean complete = true;
        for (CompletableFuture<Void> task : tasks) {
            long remain = deadline - System.currentTimeMillis();
            if (remain <= 0) {
                complete = false;
                break;
            }
            try {
                task.get(remain, TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                complete = false;
                break;
            } catch (Exception ignored) {
                // 单条失败不影响其他组合
            }
        }
        return new RouteResult(routes, complete);
    }

    /** 渲染成给大模型看的文本块。空数据返回空串，调用方据此放宽提示词 */
    private String render(AmapGroundingData data) {
        if (data.getPoints().isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("\n【高德地图实测数据 · ").append(data.getCityName()).append("】\n");
        sb.append("下面是高德接口返回的真实数据，数字可直接引用。\n");

        sb.append("\n地点（共 ").append(data.getPoints().size()).append(" 个）：\n");
        for (AmapPoint point : data.getPoints()) {
            sb.append("- ").append(point.getName());
            if (point.getDistrict() != null) {
                sb.append("（").append(point.getDistrict()).append("）");
            }
            if (point.getRating() != null) {
                sb.append(" ").append(point.getRating()).append(" 分");
            }
            sb.append('\n');
        }

        if (!data.getRoutes().isEmpty()) {
            // 「反向同样适用」这句不能省：表里是无序对，模型拿不准反向能不能引用时，
            // 它宁可自己编一个数字，也不愿意留空
            sb.append("\n两地之间的驾车实测（时长已含实时路况，反向同样适用）：\n");
            for (AmapRoute route : data.getRoutes()) {
                sb.append("- ").append(route.getFromName()).append(" → ").append(route.getToName())
                  .append("：").append(route.describe()).append('\n');
            }
        }

        sb.append("\n引用规则：地点只从上面清单里选；两地之间的公里数、分钟数、打车费只能照抄上表，")
          .append("表里没有的组合就不要写数字，也不要写地铁线路号。\n");
        return sb.toString();
    }

    private static int pairCount(int pointCount) {
        return pointCount < 2 ? 0 : pointCount * (pointCount - 1) / 2;
    }
}
