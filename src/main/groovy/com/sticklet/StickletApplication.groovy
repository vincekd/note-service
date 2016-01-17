package com.sticklet

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.ComponentScan
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling


//@Configuration
//@EnableAutoConfiguration
//@EnableCaching
@EnableAsync
@EnableScheduling
@ComponentScan(basePackages=["com.sticklet"])
//@ComponentScan(basePackageClasses=[
//    com.sticklet.core.service.CustomUserDetailsService,
//    com.sticklet.core.service.AjaxLogoutSuccessHandler,
//    com.sticklet.AppConfig
//])
@SpringBootApplication
class StickletApplication {
    private static Logger logger = LoggerFactory.getLogger(StickletApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(StickletApplication, args)
    }
}
