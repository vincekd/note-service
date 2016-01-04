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
    @Autowired UserService userServ
    @Autowired UserRepo userRepo

    @RequestMapping(value="/user/info", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getUserInfo() {
        userServ.getUserFromPrincipal()
    }

    @RequestMapping(value="/user/register", method=RequestMethod.POST, produces="application/json", consumes="application/json")
    public @ResponseBody def registerUser(@RequestBody Map json, HttpServletResponse resp) {
        if (userServ.usernameIsFree(json.username)) {
            User user = userServ.registerUser(json)
            if (user) {
                return user
            }
        }
        statusServ.setStatusConflict(resp)
        emptyJson()
    }

    @RequestMapping(value="/user", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getCurrentUser() {
        curUser()
    }

    @RequestMapping(value="/user/{id}", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getUserByID(@PathVariable("id") String id) {
        userServ.repo.find(id)
    }

    @RequestMapping(value="/user/check-username", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def checkUsernameFree(@RequestParam("username") String username) {
        userServ.usernameIsFree(username)
    }

    @RequestMapping(value="/user/account/{id}", method=RequestMethod.PUT, produces="application/json", consumes="application/json")
    public @ResponseBody def updateUserAccount(@PathVariable("id") String userID, @RequestBody Map json, HttpServletResponse resp) {
        User user = curUser()
        if (user.id == userID) {
            if (json.password?.trim()) {
                if (userServ.validatePassword(json.password, json.passwordRepeat)) {
                    user.password = json.password.trim()
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_ACCEPTABLE)
                    return emptyJson()
                }
            }
            if (userServ.validateUsername(json.username)) {
                user.username = json.username.trim()
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_ACCEPTABLE)
                return emptyJson()
            }
            if (userServ.validateEmail(json.email)) {
                user.email = json.email.trim()
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_ACCEPTABLE)
                return emptyJson()
            }
            userServ.repo.save(user)
        }
        emptyJson()
    }

    @RequestMapping(value="/user/{id}", method=RequestMethod.PUT, produces="application/json", consumes="application/json")
    public @ResponseBody def updateUser(@PathVariable("id") String userID, @RequestBody Map json) {
        User user = curUser()
        if (user.id == userID) {
            json.keySet().removeAll(["password", "username", "email", "role", "id", "_class"])
            json.each { key, val ->
                user[key] = val
            }
            userServ.repo.save(user)
        }
        emptyJson()
    }
}