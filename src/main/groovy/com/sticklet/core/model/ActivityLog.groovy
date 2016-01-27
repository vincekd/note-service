package com.sticklet.core.model

import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.sticklet.core.model.base.BaseModel

@JsonIgnoreProperties(["requestData", "errorMessage", "version"])
@Document
class ActivityLog extends BaseModel {
//    @DBRef
//    User user
    String username

    String requestURI
    String method
    String ipAddr
    String requestData
    String errorMessage
}
