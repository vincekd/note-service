package com.sticklet.core.model

import org.springframework.data.annotation.Transient
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.sticklet.core.model.base.BaseModel

@JsonIgnoreProperties(["user", "updated", "created"])
@Document
class Tag extends BaseModel {
    @DBRef
    public User user

    @Indexed(unique=true)
    public String name

    @Transient
    public Long noteCount
}