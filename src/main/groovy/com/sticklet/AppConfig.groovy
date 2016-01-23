package com.sticklet

import groovy.json.JsonSlurper

import java.lang.reflect.Field

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.ApplicationListener
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.dao.DuplicateKeyException
import org.springframework.stereotype.Component

import com.sticklet.core.constant.Roles
import com.sticklet.core.constant.SocketTopics
import com.sticklet.core.service.SettingsService
import com.sticklet.core.service.UserService
import com.sticklet.core.util.FileSystemUtil
import com.sticklet.core.util.StringUtil

@Component
public class AppConfig implements ApplicationListener<ContextRefreshedEvent> {
    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class)

    @Value("\${login.admin.password}")
    String adminPassword

    @Autowired
    private UserService userServ
    @Autowired
    private SettingsService settingsServ

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        try {
            loadDefaultUsers()
        } catch (DuplicateKeyException e) {
            logger.debug "default users already created"
        } catch (Exception e) {
            e.printStackTrace()
        }

        try {
            loadSettings()
        } catch(Exception e) {
            logger.warn "failed to load settings"
            e.printStackTrace()
        }
    }

    private void loadDefaultUsers() {
        if (userServ.usernameIsFree("admin")) {
            logger.debug "Saving the admin user"
            userServ.createUser([username: "admin", password: adminPassword,
                role: Roles.ADMIN, "email": "admin@sticklet.com"])
        }
    }

    private void loadSettings() {
        logger.debug "loading app settings"
        File settingsFile = FileSystemUtil.getResourceFile("settings.json")
        JsonSlurper slurper = new JsonSlurper()
        Map json = slurper.parseText(settingsFile.text)
        //Socket topics
        json["socket"] = (json["socket"]?:[:])
        json["socket"]["topic"] = (json["socket"]["topic"]?:[:])
        SocketTopics.class.fields.each { Field f ->
            if (!f.isSynthetic()) {
                String name = StringUtil.underscoreToCamelCase(f.name)
                json["socket"]["topic"][name] = [
                    "value": SocketTopics[f.name],
                    "userUpdatable": false
                ]
            }
        }
        settingsServ.init(json)
    }
}
