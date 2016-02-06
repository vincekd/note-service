package com.sticklet.core.repository

import org.springframework.data.repository.query.Param

import com.sticklet.core.model.User
import com.sticklet.core.repository.base.BaseRepo

public interface UserRepo extends BaseRepo<User, String> {
    public User findByUsername(@Param("username") String username)
    public User findByEmail(@Param("email") String email)
}
