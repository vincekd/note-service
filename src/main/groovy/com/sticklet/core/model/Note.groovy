package com.sticklet.core.model

import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.sticklet.core.model.base.BaseModel

@JsonIgnoreProperties(["user", "contentEdited"])
@Document
class Note extends BaseModel {
    @DBRef
    public User user

    public String title
    public String content
    public String color

    public boolean titleEdited = false
    public boolean contentEdited = false

    public boolean archived = false
    public Long deleted = null

    public Map<String, Integer> position = [
        "x": null,
        "y": null,
        "z": null
    ]

    @DBRef
    public List<Tag> tags = []
}
