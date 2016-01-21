package com.sticklet.core.model

import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.sticklet.core.annotation.DBProp
import com.sticklet.core.model.base.BaseModel

@JsonIgnoreProperties(["updated", "created", "password", "email", "registered"])
@Document
class User extends BaseModel {
    @DBProp(nullable=false, updatable=false)
    @Indexed(unique=true)
    public String username

    @DBProp(nullable=false)
    public String password

    @DBProp(nullable=false)
    public String role

    @DBProp(nullable=false)
    @Indexed(unique=true)
    public String email

    public String name
    public String bio

    //email registration
    public boolean registered = false

    @DBRef
    UserPreferences prefs
}
