package com.youji.travel.controller;

import com.youji.travel.common.ApiException;
import com.youji.travel.dto.BookingDTO;
import com.youji.travel.dto.BookingRequest;
import com.youji.travel.service.BookingService;
import com.youji.travel.service.TokenService;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 预订订单接口。两个都要求登录 —— 订单是用户私有数据。
 *
 * 鉴权写法照抄 AuthController.me()：项目里没有拦截器、没有过滤器、没有注解，
 * 唯一可行的方式就是每个方法手动解析 Authorization 头。
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final TokenService tokenService;

    public BookingController(BookingService bookingService, TokenService tokenService) {
        this.bookingService = bookingService;
        this.tokenService = tokenService;
    }

    /** 我的订单，按下单时间倒序 */
    @GetMapping
    public List<BookingDTO> myBookings(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return bookingService.listByUsername(currentUsername(authorization));
    }

    /** 下单 */
    @PostMapping
    public BookingDTO create(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody BookingRequest request) {
        return bookingService.create(currentUsername(authorization), request);
    }

    /**
     * 取消订单。
     * 用 POST /{id}/cancel 而不是 DELETE：这是状态变更不是删除，
     * 而且 AuthController 的 POST /logout 已经是「POST 干动作」的先例。
     */
    @PostMapping("/{id}/cancel")
    public BookingDTO cancel(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable("id") Long id) {
        return bookingService.cancel(currentUsername(authorization), id);
    }

    /**
     * 取当前登录用户名，没登录就 401。
     *
     * 【required = false 不能省】少了它，没带 Authorization 的请求会先被
     * MissingRequestHeaderException 拦成 400「缺少请求头：Authorization」，
     * 而不是我们想要的 401「登录状态已失效，请重新登录」——
     * 前端会把 body.message 原样显示给用户，用户看到的就是前者。
     */
    private String currentUsername(String authorization) {
        String username = tokenService.resolveUsername(authorization);
        if (username == null) {
            throw ApiException.unauthorized("登录状态已失效，请重新登录");
        }
        return username;
    }
}
