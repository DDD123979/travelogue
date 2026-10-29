package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.common.ApiException;
import com.youji.travel.dto.BookingDTO;
import com.youji.travel.dto.BookingRequest;
import com.youji.travel.dto.DestinationDTO;
import com.youji.travel.dto.HotelDTO;
import com.youji.travel.entity.BookingOrder;
import com.youji.travel.mapper.BookingOrderMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 预订业务：下单 / 查我的订单 / 取消。
 *
 * 【全程没有 @Transactional】create 只有「一次 insert + 一次回读」，天然原子；
 * 取消是一条 update。全项目 8 个 service 也都没有用它，保持一致。
 *
 * 【总价一律在这里算】请求体里的任何价格字段都不看 —— 否则用户改一下请求体
 * 就能一块钱订五星酒店。前端页面上那个实时总价只是给用户看的预估。
 */
@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    /** 和 AiItineraryService 的 MIN_DAYS / MAX_DAYS 保持同一口径 */
    private static final int MIN_DAYS = 1;
    private static final int MAX_DAYS = 15;
    private static final int MIN_PEOPLE = 1;
    private static final int MAX_PEOPLE = 20;

    /** 每间住 2 人。人数对总价的影响就体现在这里 */
    private static final int PEOPLE_PER_ROOM = 2;

    /**
     * 最远可预订到几个月后。前端日历（js/api.js 的 maxCheckInDate）用的是同一口径，
     * 改动这里要同步改那边 —— 两边算法必须一致，否则前端会放出后端不接受的日期。
     * 注意 Java 的 plusMonths 是「夹到目标月最后一天」（12-31 加两个月 = 02-28），
     * 而 JS 的 setMonth 会溢出成 03-03，所以前端那份是手写的日期夹取，不能简化成 setMonth。
     */
    private static final int MAX_MONTHS_AHEAD = 2;

    public static final String STATUS_BOOKED = "已预订";
    public static final String STATUS_CANCELLED = "已取消";

    /** 订单号撞唯一索引后的重试次数 */
    private static final int ORDER_NO_ATTEMPTS = 3;

    private static final DateTimeFormatter CREATED_AT_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final BookingOrderMapper orderMapper;
    private final HotelService hotelService;
    private final DestinationService destinationService;

    public BookingService(BookingOrderMapper orderMapper,
                          HotelService hotelService,
                          DestinationService destinationService) {
        this.orderMapper = orderMapper;
        this.hotelService = hotelService;
        this.destinationService = destinationService;
    }

    /** 下单 */
    public BookingDTO create(String username, BookingRequest request) {
        if (request == null) {
            throw ApiException.badRequest("请求体不能为空");
        }
        if (request.getDestinationId() == null) {
            throw ApiException.badRequest("请选择目的地");
        }
        if (request.getHotelId() == null) {
            throw ApiException.badRequest("请选择酒店");
        }

        // 目的地必须先查。放在酒店之前是有原因的：目的地不存在时，如果先查酒店，
        // 下面那条交叉校验会先命中，把「目的地 id 不存在」报成「该酒店不属于所选目的地」——
        // 用户明明是选错了城市，提示却在说酒店，排查时会被带偏。
        // findById 走的是 Redis 缓存的 listAll()，缓存命中时不产生额外 SQL。
        if (destinationService.findById(request.getDestinationId()).isEmpty()) {
            throw ApiException.notFound("目的地不存在：" + request.getDestinationId());
        }

        HotelDTO hotel = hotelService.findById(request.getHotelId())
                .orElseThrow(() -> ApiException.notFound("酒店不存在：" + request.getHotelId()));

        // 交叉校验：前端切换了目的地但酒店列表没跟着刷新时，会传来这种不匹配的组合。
        if (!hotel.getDestinationId().equals(request.getDestinationId())) {
            throw ApiException.badRequest("该酒店不属于所选目的地");
        }

        int days = normalizeDays(request.getDays());
        int people = normalizePeople(request.getPeople());
        LocalDate checkIn = parseCheckIn(request.getCheckIn());

        // 单价从数据库取，不信前端
        int unitPrice = hotel.getPricePerNight();
        // 向上取整：1 人 → 1 间，2 人 → 1 间，3 人 → 2 间，恒 ≥ 1 间（1 人也得占一间）
        int rooms = (people + PEOPLE_PER_ROOM - 1) / PEOPLE_PER_ROOM;
        int totalAmount = unitPrice * rooms * days;

        BookingOrder order = new BookingOrder();
        order.setUsername(username);
        order.setDestinationId(hotel.getDestinationId());
        order.setDestinationName(destinationName(hotel.getDestinationId()));
        order.setHotelId(hotel.getId());
        order.setHotelName(hotel.getName());
        order.setCheckIn(checkIn);
        order.setDays(days);
        order.setPeople(people);
        order.setRooms(rooms);
        order.setUnitPrice(unitPrice);
        order.setTotalAmount(totalAmount);
        order.setStatus(STATUS_BOOKED);

        BookingOrder saved = insertWithUniqueOrderNo(order);

        log.info("下单成功：{} 预订「{}」（{}），{} 人 {} 间 {} 晚，共 {} 元",
                saved.getOrderNo(), saved.getHotelName(), saved.getDestinationName(),
                people, rooms, days, totalAmount);

        // createdAt 是 MySQL 的 DEFAULT CURRENT_TIMESTAMP 生成的，
        // MyBatis-Plus 只回填自增主键、不回填默认值 —— 不重新读一次，
        // 返回给前端的 createdAt 就是 null，「我的订单」页的时间列会空着
        BookingOrder withTime = orderMapper.selectById(saved.getId());
        return toDTO(withTime == null ? saved : withTime);
    }

    /** 我的订单：按下单时间倒序。字段全是快照，一条 SQL 搞定，不用 join */
    public List<BookingDTO> listByUsername(String username) {
        List<BookingOrder> orders = orderMapper.selectList(
                Wrappers.<BookingOrder>lambdaQuery()
                        .eq(BookingOrder::getUsername, username)
                        .orderByDesc(BookingOrder::getCreatedAt)
                        .orderByDesc(BookingOrder::getId));
        return orders.stream().map(this::toDTO).toList();
    }

    /** 取消订单。不删行，只改状态 —— 已经订出去了什么，账上要留得住 */
    public BookingDTO cancel(String username, Long id) {
        BookingOrder order = orderMapper.selectById(id);

        // 别人的订单一律按「不存在」处理。
        // 不返回 403：那等于告诉调用方「这个订单号是真的，只是不属于你」，
        // 拿订单号逐个试就能探出别人下过多少单
        if (order == null || !order.getUsername().equals(username)) {
            throw ApiException.notFound("订单不存在：" + id);
        }
        if (STATUS_CANCELLED.equals(order.getStatus())) {
            throw ApiException.conflict("该订单已取消，无需重复操作");
        }

        order.setStatus(STATUS_CANCELLED);
        orderMapper.updateById(order);
        return toDTO(order);
    }

    /* ---------- 内部实现 ---------- */

    /**
     * 生成订单号并插入。
     *
     * 订单号是「日期 + 6 位随机数」，随机就可能撞上 uk_order_no 唯一索引。
     * 撞了就换一个再来，不对用户报错 —— 这纯粹是运气问题，重试一次几乎必成。
     */
    private BookingOrder insertWithUniqueOrderNo(BookingOrder order) {
        for (int attempt = 0; attempt < ORDER_NO_ATTEMPTS; attempt++) {
            order.setOrderNo(newOrderNo());
            try {
                orderMapper.insert(order);
                return order;
            } catch (DuplicateKeyException e) {
                if (attempt == ORDER_NO_ATTEMPTS - 1) {
                    // 连撞三次不是巧合了，交给 GlobalExceptionHandler 去兜
                    throw e;
                }
                log.warn("订单号撞车（第 {} 次），换一个重试：{}", attempt + 1, order.getOrderNo());
            }
        }
        // 循环必然在上面的 return 或 throw 结束，这行只是为了让编译器闭嘴
        throw new IllegalStateException("生成订单号失败");
    }

    /** 形如 YJ20260915482910：YJ + 日期 + 6 位随机数 */
    private String newOrderNo() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return "YJ" + date + String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
    }

    /** 目的地名字从缓存的列表里取（DestinationService 走 Redis，命中时不产生 SQL） */
    private String destinationName(Long destinationId) {
        return destinationService.findById(destinationId)
                .map(DestinationDTO::getName)
                .orElse("");
    }

    private int normalizeDays(Integer days) {
        if (days == null) {
            throw ApiException.badRequest("请填写入住天数");
        }
        if (days < MIN_DAYS || days > MAX_DAYS) {
            throw ApiException.badRequest("入住天数需在 " + MIN_DAYS + "-" + MAX_DAYS + " 之间");
        }
        return days;
    }

    private int normalizePeople(Integer people) {
        if (people == null) {
            throw ApiException.badRequest("请填写入住人数");
        }
        if (people < MIN_PEOPLE || people > MAX_PEOPLE) {
            throw ApiException.badRequest("入住人数需在 " + MIN_PEOPLE + "-" + MAX_PEOPLE + " 之间");
        }
        return people;
    }

    /**
     * 解析入住日期。
     *
     * 用 String 收、在这里手动 parse，是为了给出中文提示 ——
     * 直接用 LocalDate 接请求体的话，格式不对会由 Jackson 抛
     * HttpMessageNotReadableException，用户只能看到「请求体格式不正确」，看不出是哪一项。
     */
    private LocalDate parseCheckIn(String text) {
        if (text == null || text.isBlank()) {
            throw ApiException.badRequest("请选择入住日期");
        }
        LocalDate date;
        try {
            date = LocalDate.parse(text.trim());
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("入住日期格式不对，应为 yyyy-MM-dd");
        }
        // now() 只取一次：分别内联调用的话，跨零点那一瞬间可能下界用今天算、上界用明天算
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw ApiException.badRequest("入住日期不能早于今天");
        }
        LocalDate latest = today.plusMonths(MAX_MONTHS_AHEAD);
        if (date.isAfter(latest)) {
            throw ApiException.badRequest("入住日期最远只能预订到 " + latest + "（两个月内）");
        }
        return date;
    }

    private BookingDTO toDTO(BookingOrder o) {
        BookingDTO dto = new BookingDTO();
        dto.setId(o.getId());
        dto.setOrderNo(o.getOrderNo());
        dto.setDestinationId(o.getDestinationId());
        dto.setDestinationName(o.getDestinationName());
        dto.setHotelId(o.getHotelId());
        dto.setHotelName(o.getHotelName());
        dto.setCheckIn(o.getCheckIn() == null ? "" : o.getCheckIn().toString());
        dto.setDays(o.getDays());
        dto.setPeople(o.getPeople());
        dto.setRooms(o.getRooms());
        dto.setUnitPrice(o.getUnitPrice());
        dto.setTotalAmount(o.getTotalAmount());
        dto.setStatus(o.getStatus());
        dto.setCreatedAt(formatCreatedAt(o.getCreatedAt()));
        return dto;
    }

    private String formatCreatedAt(LocalDateTime time) {
        return time == null ? "" : time.format(CREATED_AT_FORMAT);
    }
}
