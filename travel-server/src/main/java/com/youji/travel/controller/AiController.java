package com.youji.travel.controller;

import com.youji.travel.common.ApiException;
import com.youji.travel.dto.ItineraryRequest;
import com.youji.travel.service.AiItineraryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * AI 行程规划接口。
 *
 * 这里只有两个接口：
 *   POST /api/ai/itinerary  —— 流式生成行程（SSE）
 *   GET  /api/ai/status     —— 自检：Key 配没配、模型名还能不能用
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);

    private final AiItineraryService aiService;

    public AiController(AiItineraryService aiService) {
        this.aiService = aiService;
    }

    /**
     * 生成行程，边生成边推给前端。
     *
     * 用 SSE 而不是一次性返回：生成一篇行程要十几秒，一次性返回的话用户只能盯着转圈。
     * 事件约定（前端 js/api.js 里按同一套解析）：
     *   status → {"text":"正在思考…"}   仅提示，不拼进正文
     *   delta  → {"text":"..."}        正文增量，按顺序拼接
     *   done   → {"length":1234}       正常结束
     *   error  → {"message":"中文提示"} 出错，前端直接显示
     */
    @PostMapping(value = "/itinerary", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter itinerary(@RequestBody ItineraryRequest request) {
        // 0L = 不设总超时：能不能结束由上游模型和前端决定，避免长行程被中途掐断
        SseEmitter emitter = new SseEmitter(0L);

        // 必须换个线程跑：SSE 连接要一直挂着，占住 Tomcat 的工作线程会拖垮并发。
        // 用虚拟线程——这类任务几乎全在等网络 IO，虚拟线程几乎不占资源。
        Thread.ofVirtual().name("ai-itinerary").start(() -> {
            try {
                String full = aiService.streamItinerary(
                        request,
                        text -> send(emitter, "delta", Map.of("text", text)),
                        note -> send(emitter, "status", Map.of("text", note)));
                send(emitter, "done", Map.of("length", full.length()));
            } catch (ApiException e) {
                // 业务异常：message 是给用户看的中文，原样推给前端
                send(emitter, "error", Map.of("message", e.getMessage()));
            } catch (Exception e) {
                // 兜底异常到这里就出不了 GlobalExceptionHandler 了（响应已是 SSE 流），
                // 所以必须在这里自己转成 error 事件，否则前端会一直等下去
                log.error("AI 行程规划失败", e);
                send(emitter, "error", Map.of("message", "生成失败：" + e.getClass().getSimpleName()));
            } finally {
                try {
                    emitter.complete();
                } catch (Exception e) {
                    // 客户端已断开时 complete() 会抛异常，属于正常现象，不当错误处理
                    log.debug("结束 SSE 失败（客户端可能已断开）：{}", e.getMessage());
                }
            }
        });

        return emitter;
    }

    /** 配置自检，浏览器直接访问 /api/ai/status 就能看到结果 */
    @GetMapping("/status")
    public Map<String, Object> status() {
        return aiService.status();
    }

    /**
     * 推一个事件。
     * 用户关掉页面或点「停止生成」时连接就断了，这里会抛异常——
     * 那是正常现象，不该当错误处理，所以只记 debug 日志。
     */
    private void send(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data, MediaType.APPLICATION_JSON));
        } catch (Exception e) {
            log.debug("SSE 推送失败（客户端可能已断开）：{}", e.getMessage());
        }
    }
}
