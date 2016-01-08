package com.sticklet

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.ComponentScan


//@Configuration
//@EnableAutoConfiguration
@ComponentScan
@SpringBootApplication
class StickletApplication {
    private static Logger logger = LoggerFactory.getLogger(StickletApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(StickletApplication, args)

        if (Boolean.parseBoolean(System.getenv("RUNNING_IN_ECLIPSE")) == true) {
            logger.warn("\n\nYou're using Eclipse: click in this console and press ENTER to call System.exit() and run the shutdown routine.\n\n");

            try {
                System.in.read()
            } catch (IOException e) {
                e.printStackTrace()
            }

            System.exit(0)
        }
    }
}
