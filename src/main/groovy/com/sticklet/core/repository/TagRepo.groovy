package com.sticklet.core.repository

import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.repository.base.BaseRepo

public interface TagRepo extends BaseRepo<Tag, String> {
    @Cacheable(value="user-tags", keyGenerator="tagKeyGenerator")
    public List<Tag> findAllByUser(@Param("user") User user)

    public Tag findByNameAndUser(@Param("name") String name, @Param("user") User user)
    public Tag findByUpperCaseNameAndUser(@Param("upperCaseName") String upperCaseName, @Param("user") User user)

    @CacheEvict(value="user-tags", allEntries=true)
    public Tag save(Tag tag)

    @CacheEvict(value="user-tags", allEntries=true)
    public Iterable<Tag> save(Iterable<Tag> tags)

    @CacheEvict(value="user-tags", allEntries=true)
    public void delete(Iterable<Tag> tags)

    @CacheEvict(value="user-tags", allEntries=true)
    public void delete(Tag tag)
}
