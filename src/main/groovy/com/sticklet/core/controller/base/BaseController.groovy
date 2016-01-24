package com.sticklet.core.controller.base


import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler

import com.sticklet.core.model.User
import com.sticklet.core.service.ResponseStatusService
import com.sticklet.core.service.UserService
import com.sticklet.core.service.WebsocketService

abstract class BaseController {
    private final Logger logger = LoggerFactory.getLogger(BaseController.class)

    @Autowired
    protected UserService userServ
    @Autowired
    protected ResponseStatusService statusServ
    @Autowired
    protected WebsocketService socketServ

    protected User curUser() {
        userServ.getUserFromPrincipal()
    }

    protected String emptyJson() {
        "{}"
    }

    //    @ExceptionHandler(Exception.class)
    //    public void handleBadRequests(HttpServletResponse response, Exception ex) {
    //        logger.debug "in default controller exception"
    //        response.sendError(HttpStatus.BAD_REQUEST.value(), "Please try again and with a non empty string as 'name'");
    //    }
}