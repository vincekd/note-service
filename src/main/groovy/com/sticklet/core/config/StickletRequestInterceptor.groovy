package com.sticklet.core.config

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.web.servlet.HandlerInterceptor
import org.springframework.web.servlet.ModelAndView

import com.sticklet.core.model.ActivityLog
import com.sticklet.core.service.ActivityLogService

@Service
@Component
class StickletRequestInterceptor implements HandlerInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(StickletRequestInterceptor.class)

    @Value("\${debug.enabled}")
    private boolean debugEnabled = false

    @Value("\${activityLog.enabled}")
    private boolean activityLogEnabled = false

    @Autowired
    private ActivityLogService activityLogServ

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, def handler) {
        if (debugEnabled) {
            logger.debug("[ ${req.getMethod()} ] request to path: " + req.getServletPath())
        }
        true
    }

    @Override
    public void postHandle(HttpServletRequest req, HttpServletResponse resp, def handler, ModelAndView modelView) {}

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse resp, def handler, Exception ex) {
        if (activityLogEnabled) {
            activityLogServ.storeRequest(req, ex)
        }

        if (ex) {
            logger.error("error in request: ${req.getServletPath()}: ${ex.message}")
        }
    }

    private String getQueryStr(HttpServletRequest req) {
        String query = req.getQueryString()
        (query ? "?" + query : "")
    }
}
