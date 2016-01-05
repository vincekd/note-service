package com.sticklet.core.controller.base


import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired

import com.sticklet.core.model.User
import com.sticklet.core.service.ResponseStatusService
import com.sticklet.core.service.UserService
import com.sticklet.core.service.WebsocketService

abstract class BaseController {
    protected final Logger logger = LoggerFactory.getLogger(this.class)

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
}