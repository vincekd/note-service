package com.sticklet.core.controller

import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.ResponseBody

import com.sticklet.core.controller.base.BaseController
import com.sticklet.core.service.SettingsService

@Controller
class SettingsController extends BaseController {
    private static final Logger logger = LoggerFactory.getLogger(SettingsController.class)

    @Autowired
    SettingsService settingsServ

    @RequestMapping(value="/settings", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getUserSettings(HttpServletResponse resp) {
        settingsServ.getUserSettings(curUser())
    }

    @RequestMapping(value="/setting/{id}", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def updateUserSetting(@PathVariable("id") String settingID, HttpServletResponse resp) {
        //TODO: implement
    }
}