package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 推荐景点。
 *
 * 字段名 attrDesc 是被 MySQL 保留字逼出来的，别改回 desc：
 *   - 列之所以叫 attr_desc，是因为 desc 是 MySQL 保留字，直接用会语法错误
 *   - 而实体字段若是 desc，MyBatis-Plus 会生成 `attr_desc AS desc`，
 *     别名同样是保留字，照样 ERROR 1064
 * 所以实体字段叫 attrDesc（按驼峰约定自动对应列 attr_desc），
 * 对外给前端的 JSON 仍然是 "desc"（由 AttractionDTO 负责）。
 */
@Data
@TableName("destination_attraction")
public class DestinationAttraction {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long destinationId;

    private String name;

    /** 建议时长，对应 DTO 里给前端的 time */
    private String duration;

    /** 对应列 attr_desc；给前端的字段名仍是 desc */
    private String attrDesc;

    private Integer sortOrder;
}
