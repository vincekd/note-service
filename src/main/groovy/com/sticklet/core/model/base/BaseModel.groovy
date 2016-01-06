package com.sticklet.core.model.base

import org.joda.time.DateTime
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.data.annotation.CreatedBy
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.LastModifiedBy
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Auditable
import org.springframework.data.mongodb.core.mapping.Document

@Document
//@JsonSerialize(using = BaseMongoModelSerializer.class)
abstract class BaseModel {
    @Transient
    private final Logger logger = LoggerFactory.getLogger(this.class)

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