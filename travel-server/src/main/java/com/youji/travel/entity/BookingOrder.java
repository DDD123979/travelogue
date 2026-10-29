package com.youji.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 预订订单。
 *
 * 表名 booking_order —— 不能叫 order，那是 MySQL 保留字（和 user → t_user 同一类问题）。
 *
 * 四处快照（destinationName / hotelName / unitPrice / rooms）是刻意的：
 * 酒店改名、调价、下架，历史订单上的成交信息都不能跟着变。详见 schema.sql 里的说明。
 *
 * createdAt 由数据库的 DEFAULT CURRENT_TIMESTAMP 生成，Java 侧不赋值；
 * 因此 insert 之后它是 null，需要 selectById 回读一次（MyBatis-Plus 只回填自增主键）。
 */
@Data
@TableName("booking_order")
public class BookingOrder {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单号，展示用，形如 YJ20260915482910 */
    private String orderNo;

    /** 下单用户名，逻辑关联 t_user.username（token 里存的就是用户名） */
    private String username;

    private Long destinationId;

    /** 目的地名称快照 */
    private String destinationName;

    private Long hotelId;

    /** 酒店名称快照 */
    private String hotelName;

    private LocalDate checkIn;

    /** 入住晚数 */
    private Integer days;

    private Integer people;

    /** 房间数 = ceil(人数 / 2)，每间住 2 人，恒 ≥ 1 */
    private Integer rooms;

    /** 下单时的每间每晚单价快照（元） */
    private Integer unitPrice;

    /** 总价（元）= unitPrice × rooms × days，由后端算 */
    private Integer totalAmount;

    /** 已预订 / 已取消 */
    private String status;

    private LocalDateTime createdAt;
}
