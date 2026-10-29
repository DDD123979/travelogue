package com.youji.travel.controller;

import com.youji.travel.dto.HotelDTO;
import com.youji.travel.service.HotelService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 酒店接口。
 *
 * 【不鉴权】和 /api/destinations 一样是公共目录数据，不含任何用户信息；
 * 前端的路由守卫已经保证未登录进不了预订页，接口层不必再加一道。
 * （两个订单接口则必须鉴权，那里才有私有数据。）
 *
 * 返回体是【裸数组】，没有 {code, data, msg} 包装，与目的地接口保持一致。
 */
@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotelService;

    public HotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    /**
     * 酒店列表：/api/hotels 全部，/api/hotels?destinationId=1 只看某个城市。
     * destinationId 传了不存在的值会返回空数组（裸数组接口的自然语义）。
     */
    @GetMapping
    public List<HotelDTO> list(
            @RequestParam(value = "destinationId", required = false) Long destinationId) {
        return hotelService.list(destinationId);
    }
}
