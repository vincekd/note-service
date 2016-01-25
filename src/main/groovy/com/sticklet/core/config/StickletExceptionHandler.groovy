package com.sticklet.core.config


import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler
import org.springframework.web.util.WebUtils

@EnableWebMvc
@ControllerAdvice
public class StickletExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(StickletExceptionHandler.class)

    @ExceptionHandler([Throwable.class, Exception.class, RuntimeException.class])
    public ResponseEntity<Object> handleNonSpringException(Exception e, WebRequest req) {
        logger.debug "exception: $e"
        return new ResponseEntity<Object>("{}", HttpStatus.INTERNAL_SERVER_ERROR)
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers, HttpStatus status, WebRequest request) {
        logger.debug "internal exception: $ex"
        //this is just a copy of the original... for future reference
        if (HttpStatus.INTERNAL_SERVER_ERROR.equals(status)) {
            request.setAttribute(WebUtils.ERROR_EXCEPTION_ATTRIBUTE, ex, WebRequest.SCOPE_REQUEST)
        }

        new ResponseEntity<Object>(body, headers, status)
    }
}
