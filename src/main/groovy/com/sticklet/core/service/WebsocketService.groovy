package com.sticklet.core.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

import com.sticklet.core.model.User

@Service
class WebsocketService {
    protected final Logger logger = LoggerFactory.getLogger(WebsocketService.class)

    @Value("\${login.enabled}")
    boolean loginEnabled

    @Autowired SimpMessagingTemplate msgTemp
    @Autowired UserService userServ

    private static final Map headers = [:]

    public void sendToUsers(List<User> users, String topic, def data) {
        users.each {
            sendToUser(it, topic, data)
        }
    }

    public void sendToUser(User user, String topic, def data) {
        //data = (data ?: [:])
        if (loginEnabled) {
            msgTemp.convertAndSendToUser(user.username, "/topic" + topic, data)
        } else {
            msgTemp.convertAndSend("/topic" + topic, data, headers)
        }
    }
}