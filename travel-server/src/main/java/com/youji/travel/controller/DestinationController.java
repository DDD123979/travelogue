package com.youji.travel.controller;

import com.youji.travel.common.ApiException;
import com.youji.travel.dto.DestinationDTO;
import com.youji.travel.service.DestinationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 目的地接口。
 *
 * 返回体是【裸对象/裸数组】，没有 {code, data, msg} 包装 ——
 * 这是前端已经写死的契约（见 travel-app/README.md），改了前端就读不到数据。
 */
@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    private final DestinationService destinationService;

    public DestinationController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }

    /** 全部目的地（走 Redis 缓存） */
    @GetMapping
    public List<DestinationDTO> list() {
        return destinationService.listAll();
    }

    /** 单个目的地；不存在时必须是真 404，返回 null 会让前端解析 JSON 时报错 */
    @GetMapping("/{id}")
    public DestinationDTO detail(@PathVariable("id") Long id) {
        return destinationService.findById(id)
                .orElseThrow(() -> ApiException.notFound("目的地不存在：" + id));
    }
}
