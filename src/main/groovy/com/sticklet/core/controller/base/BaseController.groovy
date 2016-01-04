package com.sticklet.core.controller.base


import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired

import com.sticklet.core.model.User
import com.sticklet.core.service.ResponseStatusService
import com.sticklet.core.service.UserService

abstract class BaseController {

    protected final Logger logger = LoggerFactory.getLogger(this.class)

    @Autowired UserService userServ
    @Autowired ResponseStatusService statusServ

    public User curUser() {
        userServ.getUserFromPrincipal()
    }

    public String emptyJson() {
        "{}"
    }
}