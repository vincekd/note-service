package com.sticklet.core.config

import javax.servlet.ServletContext

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.boot.context.web.SpringBootServletInitializer

import com.sticklet.StickletApplication

class ServletInitializer extends SpringBootServletInitializer {
    private static final Logger logger = LoggerFactory.getLogger(ServletInitializer.class)

    //private static servletContext

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        application.sources(StickletApplication)
    }
    
    @Override
    public void onStartup(ServletContext context) {
        logger.debug "starting up with context ${context}"
        //servletContext = context
    }
}
