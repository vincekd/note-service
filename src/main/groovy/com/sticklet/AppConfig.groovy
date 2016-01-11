package com.sticklet

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationListener
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.dao.DuplicateKeyException
import org.springframework.stereotype.Component

import com.asual.lesscss.LessEngine
import com.sticklet.core.constant.Roles
import com.sticklet.core.service.UserService
import com.sticklet.core.util.FileSystemUtil

@Component
public class AppConfig implements ApplicationListener<ContextRefreshedEvent> {
    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class)
    private static final List<String> colors = ["#F7977A", "#C5E3BF", "#C1F0F6", "#FFF79A", "#FDC68A", "#D8BFD8"]
    private final LessEngine lessEngine = new LessEngine()

    @Autowired
    private UserService userServ

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
            loadDefaultColors()
        } catch (DuplicateKeyException e) {
            logger.debug "default colors already created"
        } catch (Exception e) {
            e.printStackTrace()
        }
        try {
            compileLessCss()
        } catch(Exception e) {
            logger.warn "failed to compile less files"
            e.printStackTrace()
        }
    }

    private void loadDefaultUsers() {
        if (userServ.usernameIsFree("admin")) {
            logger.debug "Saving the admin user"
            userServ.createUser([username: "admin", password: "admin",
                role: Roles.ADMIN, "email": "admin@sticklet.com"])
        }
    }

    private void loadDefaultColors() {
        int i = 0
        String text = lessEngine.compile(colors.collect {
            ".color${++i} { background: ${it}; }"
        }.join(" "))
        File lessDir = FileSystemUtil.getResourceFile("META-INF/resources/less")
        File cssDir = new File(lessDir.canonicalPath + "/css/")
        File file = new File(cssDir.canonicalPath + File.separator + "note-colors.css")
        file.text = text
    }

    private void compileLessCss() {
        File lessDir = FileSystemUtil.getResourceFile("META-INF/resources/less")
        File cssDir = FileSystemUtil.getResourceFile("META-INF/resources/less/css")
        cssDir.mkdir()
        if (lessDir.exists()) {
            lessDir.listFiles().each { File it ->
                if (it.isFile()) {
                    String name = it.name.replaceFirst(/\.less$/, ".css")
                    logger.debug "saving compiled less file to: ${cssDir.canonicalPath + File.separator + name}"
                    lessEngine.compile(it, new File(cssDir.canonicalPath + File.separator + name))
                }
            }
        }
    }
}
