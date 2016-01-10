package com.sticklet.core.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile

@Service
class DataService {
    private static final Logger logger = LoggerFactory.getLogger(DataService.class)
    
    
    public void importEvernote(MultipartFile file) {
        logger.debug "import evernote file: $file"
    }
}