package com.sticklet.core.controller

import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody

import com.sticklet.core.controller.base.BaseController
import com.sticklet.core.model.User
import com.sticklet.core.repository.UserRepo
import com.sticklet.core.service.UserService

@Controller
class UserController extends BaseController {
    private Logger logger = LoggerFactory.getLogger(UserController.class)

    @Autowired
    private UserService userServ

    //    @RequestMapping(value="/user/register", method=RequestMethod.POST, produces="application/json", consumes="application/json")
    //    public @ResponseBody def registerUser(@RequestBody Map json, HttpServletResponse resp) {
    //        if (userServ.usernameIsFree(json.username)) {
    //            User user = userServ.registerUser(json)
    //            if (user) {
    //                return user
    //            }
    //        }
    //        statusServ.setStatusConflict(resp)
    //        emptyJson()
    //    }

    @RequestMapping(value="/user", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getCurrentUser() {
        curUser()
    }

    @RequestMapping(value="/user/check-username", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def checkUsernameFree(@RequestParam("username") String username) {
        userServ.usernameIsFree(username)
    }
}