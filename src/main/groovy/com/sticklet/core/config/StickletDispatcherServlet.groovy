package com.sticklet.core.config

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.springframework.web.servlet.DispatcherServlet
import org.springframework.web.servlet.ModelAndView

class StickletDispatcherServlet extends DispatcherServlet {
    public StickletDispatcherServlet() {
        setDetectAllHandlerAdapters(true)
        setDetectAllHandlerExceptionResolvers(true)
        setDetectAllHandlerMappings(true)
        setDetectAllViewResolvers(true)
        setThrowExceptionIfNoHandlerFound(true)
    }
}