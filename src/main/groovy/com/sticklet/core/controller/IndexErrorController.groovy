package com.sticklet.core.controller

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.web.ErrorController
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
public class IndexErrorController implements ErrorController{
    private static final Logger logger = LoggerFactory.getLogger(IndexErrorController.class)
    private static final String PATH = "/error"

    @RequestMapping(value="/")
    public String index(HttpServletRequest req, HttpServletResponse resp) {
        resp.sendRedirect("/index.html")
        ""
    }

    @RequestMapping(value="/error")
    public String error(HttpServletRequest req, HttpServletResponse resp) {
        resp.sendRedirect("/404.html")
        ""
    }

    @Override
    public String getErrorPath() {
        PATH
    }
}
