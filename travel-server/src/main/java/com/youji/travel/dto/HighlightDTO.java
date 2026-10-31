package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 目的地的「最特色景点」：攻略页展示的名称 + 详细介绍。
 * 字段与前端契约一致：{ name, desc }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HighlightDTO {

    private String name;

    private String desc;
}