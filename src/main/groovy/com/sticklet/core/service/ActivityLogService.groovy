package com.sticklet.core.service

import javax.servlet.http.HttpServletRequest

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

import com.sticklet.core.model.ActivityLog
import com.sticklet.core.model.User
import com.sticklet.core.repository.ActivityLogRepo

@Service
class ActivityLogService {
    private static final Logger logger = LoggerFactory.getLogger(ActivityLogService.class)

    @Autowired
    ActivityLogRepo repo

    public void deleteAll(User user) {
        List<ActivityLog> logs = repo.findAllByUsername(user.username)
        repo.delete(logs)
    }

    public void storeRequest(HttpServletRequest req, Exception ex) {
        ActivityLog log = new ActivityLog([
            "username": req.getRemoteUser(),
            "method": req.getMethod(),
            "requestURI": req.getRequestURI(),
            "ipAddr": req.getRemoteAddr(),
            "requestData": "",
            "errorMessage": ex ? ex.message : ""
        ])

        try {
            repo.save(log)
        } catch(Exception e) {
            e.printStackTrace()
        }
    }
}
