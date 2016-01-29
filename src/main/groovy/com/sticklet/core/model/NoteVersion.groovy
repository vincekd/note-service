package com.sticklet.core.model

import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.data.mongodb.core.mapping.Document

import com.sticklet.core.model.base.BaseModel

@Document
class NoteVersion extends BaseModel {
    public Long noteVersion

    @DBRef
    public Note note

    public Map<String, Object> diff
}
