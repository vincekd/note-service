package com.sticklet

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.data.rest.RepositoryRestMvcAutoConfiguration
import org.springframework.context.ConfigurableApplicationContext
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.web.servlet.config.annotation.EnableWebMvc


//@Configuration
//@EnableCaching
//@EnableWebMvc
@EnableAutoConfiguration(exclude = RepositoryRestMvcAutoConfiguration.class)
@EnableAsync
@EnableScheduling
@ComponentScan(basePackages=["com.sticklet"])
@SpringBootApplication
class StickletApplication {
    private static Logger logger = LoggerFactory.getLogger(StickletApplication.class)

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(StickletApplication, args)
    }
}
