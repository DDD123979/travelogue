package com.youji.travel.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.youji.travel.dto.AttractionDTO;
import com.youji.travel.dto.DestinationDTO;
import com.youji.travel.dto.HighlightDTO;
import com.youji.travel.entity.Destination;
import com.youji.travel.entity.DestinationAttraction;
import com.youji.travel.entity.DestinationTag;
import com.youji.travel.mapper.DestinationAttractionMapper;
import com.youji.travel.mapper.DestinationMapper;
import com.youji.travel.mapper.DestinationTagMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 目的地业务：把「目的地 + 标签 + 景点」三张表拼成前端要的嵌套结构。
 *
 * 组装方式是【3 次批量查询 + 内存分组】，而不是 XML 里写嵌套 resultMap：
 *   - 没有 N+1（14 个目的地也只要 3 条 SQL）
 *   - 不会踩 JOIN 的笛卡尔积（3 个景点 × 3 个标签 = 9 行，还要靠 <id> 去重）
 *   - 调试时 SQL 一目了然
 */
@Service
public class DestinationService {

    private final DestinationMapper destinationMapper;
    private final DestinationTagMapper tagMapper;
    private final DestinationAttractionMapper attractionMapper;
    private final DestinationCache cache;

    public DestinationService(DestinationMapper destinationMapper,
                              DestinationTagMapper tagMapper,
                              DestinationAttractionMapper attractionMapper,
                              DestinationCache cache) {
        this.destinationMapper = destinationMapper;
        this.tagMapper = tagMapper;
        this.attractionMapper = attractionMapper;
        this.cache = cache;
    }

    /** 全部目的地：先走 Redis 缓存，未命中或 Redis 不可用时回源数据库 */
    public List<DestinationDTO> listAll() {
        return cache.getList(this::loadFromDb);
    }

    /**
     * 按 id 查详情。
     * 直接从同一份列表结果里筛，保证详情页和列表页字段完全一致，
     * 也省掉一套重复的组装逻辑。
     */
    public Optional<DestinationDTO> findById(Long id) {
        return listAll().stream().filter(d -> d.getId().equals(id)).findFirst();
    }

    /** 查库并组装（不带缓存，缓存由 DestinationCache 负责） */
    private List<DestinationDTO> loadFromDb() {
        List<Destination> destinations = destinationMapper.selectList(
                Wrappers.<Destination>lambdaQuery()
                        .orderByAsc(Destination::getSortOrder)
                        .orderByAsc(Destination::getId));

        // 标签、景点各查一次，按 destination_id + sort_order 排好序，避免顺序随机
        List<DestinationTag> tags = tagMapper.selectList(
                Wrappers.<DestinationTag>lambdaQuery()
                        .orderByAsc(DestinationTag::getDestinationId)
                        .orderByAsc(DestinationTag::getSortOrder));

        List<DestinationAttraction> attractions = attractionMapper.selectList(
                Wrappers.<DestinationAttraction>lambdaQuery()
                        .orderByAsc(DestinationAttraction::getDestinationId)
                        .orderByAsc(DestinationAttraction::getSortOrder));

        Map<Long, List<String>> tagMap = tags.stream().collect(Collectors.groupingBy(
                DestinationTag::getDestinationId,
                Collectors.mapping(DestinationTag::getTag, Collectors.toList())));

        Map<Long, List<AttractionDTO>> attractionMap = attractions.stream().collect(Collectors.groupingBy(
                DestinationAttraction::getDestinationId,
                Collectors.mapping(
                        a -> new AttractionDTO(a.getName(), a.getAttractionType(), a.getDuration(), a.getAttrDesc()),
                        Collectors.toList())));

        return destinations.stream()
                .map(d -> toDTO(d, tagMap, attractionMap))
                .toList();
    }

    private DestinationDTO toDTO(Destination d,
                                 Map<Long, List<String>> tagMap,
                                 Map<Long, List<AttractionDTO>> attractionMap) {
        DestinationDTO dto = new DestinationDTO();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setEnName(d.getEnName());
        dto.setCategory(d.getCategory());
        dto.setLocation(d.getLocation());
        dto.setRating(d.getRating());
        dto.setPriceFrom(d.getPriceFrom());
        dto.setDays(d.getDays());
        dto.setBestSeason(d.getBestSeason());
        // 前端用 gradient[0]/gradient[1] 做图片加载失败的兜底底色，必须保证两个元素
        dto.setGradient(List.of(d.getGradientStart(), d.getGradientEnd()));
        dto.setImage(d.getImage() == null ? "" : d.getImage());
        dto.setTags(tagMap.getOrDefault(d.getId(), List.of()));
        dto.setDescription(d.getDescription());
        if (d.getHighlightName() != null && !d.getHighlightName().isEmpty()) {
            dto.setHighlight(new HighlightDTO(d.getHighlightName(), d.getHighlightDesc()));
        }
        dto.setAttractions(attractionMap.getOrDefault(d.getId(), List.of()));
        return dto;
    }
}
