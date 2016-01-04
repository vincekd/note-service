package com.sticklet.core.repository

import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.query.Param

import com.sticklet.core.model.User

public interface UserRepo extends PagingAndSortingRepository<User, String> {
    public User findByUsername(@Param("username") String username)
}