package com.sticklet.core.repository

import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.repository.base.BaseRepo

public interface TagRepo extends BaseRepo<Tag, String> {
    public List<Tag> findAllByUser(@Param("user") User user)
}
