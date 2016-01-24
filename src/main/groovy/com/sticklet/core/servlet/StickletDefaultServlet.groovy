package com.sticklet.core.servlet

import javax.servlet.Servlet
import javax.servlet.ServletConfig
import javax.servlet.ServletRequest
import javax.servlet.ServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory

class StickletDefaultServlet implements Servlet {
    private static final Logger logger = LoggerFactory.getLogger(StickletDefaultServlet.class)

    private config
    public void init(ServletConfig config) {
        this.config = config
    }
    public ServletConfig getServletConfig() {
        config
    }
    public String getServletInfo() {
        ""
    }

    public void service(ServletRequest req, ServletResponse resp) {
        logger.debug "Service: ${req}"
    }
    public void destroy() {

    }
}