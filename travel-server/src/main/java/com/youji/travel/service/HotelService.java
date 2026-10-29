package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.dto.HotelDTO;
import com.youji.travel.entity.Hotel;
import com.youji.travel.mapper.HotelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * 酒店查询。
 *
 * 【刻意不做 Redis 缓存】数据就 42 条静态行，只在预订页打开时查一次，
 * 本地 MySQL 单表查询是微秒级，加缓存只是多一份要同步的副本。
 * 目的地列表之所以缓存（DestinationCache），是因为前端每次进首页都要拉一遍。
 */
@Service
public class HotelService {

    private final HotelMapper hotelMapper;

    public HotelService(HotelMapper hotelMapper) {
        this.hotelMapper = hotelMapper;
    }

    /** 酒店列表。destinationId 传 null 就是全部 */
    public List<HotelDTO> list(Long destinationId) {
        List<Hotel> hotels = hotelMapper.selectList(
                Wrappers.<Hotel>lambdaQuery()
                        // 条件重载：destinationId 为 null 时不拼这段 where，
                        // 比手写 if 分成两个查询分支干净
                        .eq(destinationId != null, Hotel::getDestinationId, destinationId)
                        .orderByAsc(Hotel::getDestinationId)
                        .orderByAsc(Hotel::getSortOrder)
                        .orderByAsc(Hotel::getId));

        return hotels.stream().map(this::toDTO).toList();
    }

    /**
     * 按 id 查酒店。
     * 和 DestinationService.findById 一个思路：从同一份列表结果里筛，
     * 保证「下单算钱用的单价」和「页面上看到的单价」永远是同一个来源。
     */
    public Optional<HotelDTO> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return list(null).stream().filter(h -> h.getId().equals(id)).findFirst();
    }

    private HotelDTO toDTO(Hotel h) {
        HotelDTO dto = new HotelDTO();
        dto.setId(h.getId());
        dto.setDestinationId(h.getDestinationId());
        dto.setName(h.getName());
        dto.setStar(h.getStar());
        dto.setPricePerNight(h.getPricePerNight());
        dto.setDistrict(h.getDistrict());
        dto.setRating(h.getRating());
        dto.setDesc(h.getHotelDesc() == null ? "" : h.getHotelDesc());
        return dto;
    }
}
