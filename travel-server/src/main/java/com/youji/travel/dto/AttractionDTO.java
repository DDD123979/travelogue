package com.youji.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 推荐景点，字段名与顺序完全照前端契约：
 * { name, time, desc }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttractionDTO {

    private String name;

    /** 建议时长，来自实体里的 duration */
    private String time;

    /** 景点说明，来自实体里的 desc（列名 attr_desc） */
    private String desc;
}
