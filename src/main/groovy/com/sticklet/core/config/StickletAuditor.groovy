package com.sticklet.core.config

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.data.domain.AuditorAware

public class StickletAuditor implements AuditorAware<String> {
    private static final Logger logger = LoggerFactory.getLogger(StickletAuditor.class)
    
    //@Autowired UserService userServ
    
    @Override
    public String getCurrentAuditor() {
        //userServ.getUserFromPrincipal()?.username
        //userServ.getPrincipal()?.username
    }
}