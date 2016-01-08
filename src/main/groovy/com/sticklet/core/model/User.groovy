package com.sticklet.core.model

import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnore
import com.sticklet.core.annotation.DBProp
import com.sticklet.core.model.base.BaseModel

@Document
class User extends BaseModel {
    @DBProp(nullable=false)
    @Indexed(unique=true)
    public String username

    @DBProp(nullable=false)
    @JsonIgnore
    public String password

    @DBProp(nullable=false)
    public String role

    @DBProp(nullable=false)
    @Indexed(unique=true)
    public String email

    public String name
    public String bio

    @DBRef
    UserPreferences prefs
}
