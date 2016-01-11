package com.sticklet.core.model

import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnore
import com.sticklet.core.annotation.DBProp
import com.sticklet.core.model.base.BaseModel

@Document
class Setting extends BaseModel {
    @JsonIgnore
    @DBRef
    User user = null

    @DBProp(nullable=false, updatable=false)
    @Indexed(unique=true)
    String name = ""

    def value

    @JsonIgnore
    boolean initial = false
    boolean userUpdatable = false
}