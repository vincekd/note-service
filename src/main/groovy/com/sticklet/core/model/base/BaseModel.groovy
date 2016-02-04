package com.sticklet.core.model.base

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.annotation.Transient
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.mapping.Document

@Document
abstract class BaseModel implements Serializable {
    @Transient
    private final Logger logger = LoggerFactory.getLogger(this.class)

    @Id
    public String id

    @CreatedDate
    public Long created

    @LastModifiedDate
    public Long updated

    @Version
    public Long version

    @Override
    public String toString() {
        "<${this.class.simpleName} - ${id}>"
    }

    //    @Override
    //    public boolean equals(Object o) {
    //        o != null && o instanceof BaseModel && this.class.isAssignableFrom(o.class) && id == o.id
    //    }
}