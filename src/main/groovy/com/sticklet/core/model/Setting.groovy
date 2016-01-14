package com.sticklet.core.model

import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.sticklet.core.annotation.DBProp
import com.sticklet.core.model.base.BaseModel

@JsonIgnoreProperties(["user", "updated", "created", "initial", "userUpdatable"])
@Document
class Setting extends BaseModel {
    @DBRef
    User user = null

    @DBProp(nullable=false, updatable=false)
    @Indexed(unique=true)
    String name = ""

    def value

    boolean initial = false
    boolean userUpdatable = false
}
