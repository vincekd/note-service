package com.sticklet.core.model

import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnore
import com.sticklet.core.model.base.BaseModel

@Document
class Tag extends BaseModel {
    @JsonIgnore
    @DBRef
    public User user

    @Indexed(unique=true)
    public String name
}