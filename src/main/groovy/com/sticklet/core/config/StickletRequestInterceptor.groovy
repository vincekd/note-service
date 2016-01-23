package com.sticklet.core.config

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.web.servlet.HandlerInterceptor
import org.springframework.web.servlet.ModelAndView


class StickletRequestInterceptor implements HandlerInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(StickletRequestInterceptor.class)

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, def handler) {
        logger.debug("[ ${req.getMethod()} ] request to path: " + req.getServletPath())
        true
    }

    @Override
    public void postHandle(HttpServletRequest req, HttpServletResponse resp, def handler, ModelAndView modelView) {
        //logger.debug "post handle: ${req}"
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse resp, def handler, Exception ex) {
        if (ex) {
            logger.error("error in request: ${req.getServletPath()}" + getQueryStr(req) + "    exp message: " + ex.message)
            logger.error("with data: ${req.getParameterMap()}")
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR)
        }
    }

    private String getQueryStr(HttpServletRequest req) {
        String query = req.getQueryString()
        (query ? "?" + query : "")
    }
}
