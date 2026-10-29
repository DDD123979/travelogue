package com.youji.travel.controller;

import com.youji.travel.service.AmapGroundingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 高德接地的自检与预热接口。
 *
 * 它和 /api/ai/status 是一对：那边管大模型，这边管地图数据。
 * 行程生成本身不依赖这两个接口，它们只是用来排查问题、以及在演示前把缓存焐热。
 */
@RestController
@RequestMapping("/api/amap")
public class AmapController {

    private final AmapGroundingService grounding;

    public AmapController(AmapGroundingService grounding) {
        this.grounding = grounding;
    }

    /** 自检：Key 配没配、通不通、哪些城市已经预热过 */
    @GetMapping("/status")
    public Map<String, Object> status() {
        return grounding.status();
    }

    /**
     * 预热缓存：把接地数据先算好，之后生成行程就是缓存命中、零等待。
     *
     * 这里是**同步**返回的：要等所有城市算完，全部预热大约一两分钟
     * （14 个城市 × 45 对路线）。之所以不做成异步，是因为返回值里的
     * unresolved 列表正是调复合景点名拆分规则的抓手，同步返回才看得到。
     *
     * @param destinationId 只预热某个目的地，不传就是全部 14 个
     * @param force         true 表示已缓存的也重算
     */
    @PostMapping("/warmup")
    public Map<String, Object> warmup(@RequestParam(required = false) Long destinationId,
                                      @RequestParam(defaultValue = "false") boolean force) {
        return grounding.warmup(destinationId, force);
    }
}
