package com.sticklet.core.model

import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnore
import com.sticklet.core.model.base.BaseModel

@Document
class Note extends BaseModel {
    @JsonIgnore
    @DBRef
    public User user

    public String title
    public String content
    public String color

    public boolean archived = false
    public Long deleted = null

    @DBRef
    public List<Tag> tags = []
}
