package com.sticklet

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationListener
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.dao.DuplicateKeyException
import org.springframework.stereotype.Component

import com.sticklet.core.constant.Roles
import com.sticklet.core.model.User
import com.sticklet.core.repository.UserRepo

@Component
public class AppConfig implements ApplicationListener<ContextRefreshedEvent> {
    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class)
    private static final List<String> colors = ["#F7977A", "#C5E3BF", "#C1F0F6", "#FFF79A", "#FDC68A", "#D8BFD8"]

    @Autowired 
    private UserRepo userRepo

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        try {
            loadDefaultUsers()
            loadDefaultColors()
        } catch (DuplicateKeyException e) {
            logger.debug "default users already created"
        } catch (Exception e) {
            e.printStackTrace()
        }
    }

    private void loadDefaultUsers() {
        logger.debug "Saving the admin user"
        User admin = new User([username: "admin", password: "admin", role: Roles.ADMIN, "email": "admin@sticklet.com"])
        userRepo.save(admin)
    }

    private void loadDefaultColors() {
        //Store colors
    }
}
