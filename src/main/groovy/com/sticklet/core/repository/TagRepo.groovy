package com.sticklet.core.repository

import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Tag
import com.sticklet.core.model.User

public interface TagRepo extends PagingAndSortingRepository<Tag, String> {
    public List<Tag> findAllByUser(@Param("user") User user)
}
