package com.sticklet.core.model.base

import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.LastModifiedDate

class BaseModel {
    @Id
    public String id

    @CreatedDate
    public Long created

    @LastModifiedDate
    public Long updated

    @Override
    public String toString() {
        "<${this.class.simpleName} - ${id}>"
    }
}