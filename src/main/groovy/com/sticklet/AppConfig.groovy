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
    private static final List<String> colors = ["#F7977A", "#C5E3BF", "#C1F0F6", "#FFF79A", "#FDC68A", "#D8BFD8"]
    //private final LessEngine lessEngine = new LessEngine()

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

//        try {
//            loadDefaultColors()
//        } catch (DuplicateKeyException e) {
//            logger.debug "default colors already created"
//        } catch (Exception e) {
//            e.printStackTrace()
//        }
//        try {
//            compileLessCss()
//        } catch(Exception e) {
//            logger.warn "failed to compile less files"
//            e.printStackTrace()
//        }

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

//    private void loadDefaultColors() {
//        int i = 0
//        String text = lessEngine.compile(colors.collect {
//            ".color${++i} { background: ${it}; }"
//        }.join(" "))
//        File lessDir = FileSystemUtil.getResourceFile("META-INF/resources/less")
//        File cssDir = new File(lessDir.canonicalPath + "/css/")
//        cssDir.mkdir()
//        File file = new File(cssDir.canonicalPath + File.separator + "note-colors.css")
//        file.text = text
//    }

//    private void compileLessCss() {
//        File lessDir = FileSystemUtil.getResourceFile("META-INF/resources/less")
//        if (lessDir.exists()) {
//            File cssDir = FileSystemUtil.getResourceFile("META-INF/resources/less/css")
//            cssDir.mkdir()
//            lessDir.listFiles().each { File it ->
//                if (it.isFile()) {
//                    String name = it.name.replaceFirst(/\.less$/, ".css")
//                    logger.debug "saving compiled less file to: ${cssDir.canonicalPath + File.separator + name}"
//                    lessEngine.compile(it, new File(cssDir.canonicalPath + File.separator + name))
//                }
//            }
//        } else {
//            logger.warn "could not find less directory to compile"
//        }
//    }

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
