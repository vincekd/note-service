package com.sticklet.core.controller

import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody

import com.sticklet.core.constant.SocketTopics
import com.sticklet.core.controller.base.BaseController
import com.sticklet.core.model.User
import com.sticklet.core.service.UserService

@Controller
class UserController extends BaseController {
    private Logger logger = LoggerFactory.getLogger(UserController.class)

    @Value("\${login.register.enabled}")
    private boolean registerAllowed

    @Autowired
    private UserService userServ

    @RequestMapping(value="/authenticate", method=RequestMethod.GET)
    public @ResponseBody def authenticate() {
        emptyJson()
    }

    @RequestMapping(value="/user/passwordReset", method=RequestMethod.POST, consumes="application/json")
    public @ResponseBody def passwordReset(@RequestBody Map json, HttpServletResponse resp) {
        userServ.resetPassword(json.email, resp)
        emptyJson()
    }

    @RequestMapping(value="/user/registration/{id}", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def registration(@PathVariable("id") String id, HttpServletResponse resp) {
        if (userServ.register(id)) {
            resp.sendRedirect("/login.html")
            return emptyJson()
        }
        statusServ.setStatusError(resp)
        emptyJson()
    }

    @RequestMapping(value="/user/register", method=RequestMethod.POST, produces="application/json", consumes="application/json")
    public @ResponseBody def registerUser(@RequestBody Map json, HttpServletResponse resp) {
        if (registerAllowed) {
            if (userServ.usernameIsFree(json.username)) {
                User user = userServ.registerUser(json)
                if (user) {
                    return emptyJson()
                }
            }
            statusServ.setStatusConflict(resp)
        } else {
            statusServ.setStatusUnauthorized(resp)
        }
        emptyJson()
    }

    @RequestMapping(value="/user", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getCurrentUser() {
        curUser()
    }

    @RequestMapping(value="/user", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def updateUser(@RequestBody Map data, HttpServletResponse resp) {
        User user = curUser()
        user = userServ.updateUser(user, data)
        socketServ.sendToUser(user, SocketTopics.USER_UPDATE, user)
        emptyJson()
    }

    @RequestMapping(value="/user/check-username", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def checkUsernameFree(@RequestParam("username") String username) {
        userServ.usernameIsFree(username)
    }
}
