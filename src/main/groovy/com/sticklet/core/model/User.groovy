package com.sticklet.core.model

import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnore
import com.sticklet.core.model.base.BaseModel

@Document
class User extends BaseModel {
    @Indexed(unique=true)
    public String username

    @JsonIgnore
    public String password

    public String role

    @Indexed(unique=true)
    public String email

    public String name
    public String bio
}
