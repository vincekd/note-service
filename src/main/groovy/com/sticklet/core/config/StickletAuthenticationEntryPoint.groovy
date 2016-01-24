package com.sticklet.core.config

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component

@Component
public class StickletAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private static final Logger logger = LoggerFactory.getLogger(StickletAuthenticationEntryPoint.class)
    
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) {
        logger.debug "not authenticated: ${request}"
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
    }
}
