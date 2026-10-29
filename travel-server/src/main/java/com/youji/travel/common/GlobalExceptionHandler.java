package com.youji.travel.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

/**
 * 统一异常出口：响应体固定是 {"message": "中文提示"}，HTTP 状态码如实返回。
 *
 * 两点必须守住：
 *   1. 错误【绝不能】返回 200。前端的 request() 只看 res.ok，
 *      返回 200 的话前端会把错误体当成正常数据去渲染，页面直接错乱。
 *   2. message 由前端直接显示给用户，所以这里写的都是给人看的中文。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> handleApiException(ApiException e) {
        return body(e.getStatus(), e.getMessage());
    }

    /** 路径不存在：Boot 3.2 起抛这个，要如实给 404，不能被下面的兜底变成 500 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNoResource(NoResourceFoundException e) {
        return body(HttpStatus.NOT_FOUND, "接口不存在：" + e.getResourcePath());
    }

    /** 路径变量类型不对，例如 /api/destinations/abc */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return body(HttpStatus.BAD_REQUEST, "参数格式不正确：" + e.getName());
    }

    /** 请求体不是合法 JSON，或注册/登录时压根没带 body */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(HttpMessageNotReadableException e) {
        return body(HttpStatus.BAD_REQUEST, "请求体格式不正确，应为 JSON：{\"username\":\"...\",\"password\":\"...\"}");
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, String>> handleMissingHeader(MissingRequestHeaderException e) {
        return body(HttpStatus.BAD_REQUEST, "缺少请求头：" + e.getHeaderName());
    }

    /**
     * 流式接口（AI 行程的 SSE）在生成过程中客户端断开了——用户关了页面或点了「停止生成」。
     *
     * 这不是服务器出错，但 Tomcat 会把异步请求的异常抛到这儿；如果不单独接住，
     * 就会落到下面的兜底分支，而那时响应头已经是 text/event-stream，写 JSON 会再抛一次，
     * 日志里刷出一大段栈。所以这里只安静记一条 debug，返回 void 表示「已处理，不用再写响应」。
     */
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleClientDisconnect(AsyncRequestNotUsableException e) {
        log.debug("客户端已断开连接：{}", e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleOther(Exception e) {
        log.error("未处理的异常", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR,
                "服务器开小差了：" + e.getClass().getSimpleName());
    }

    private ResponseEntity<Map<String, String>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(Map.of("message", message == null ? status.getReasonPhrase() : message));
    }
}
