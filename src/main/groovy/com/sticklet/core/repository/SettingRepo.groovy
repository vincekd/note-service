package com.sticklet.core.repository

import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Setting
import com.sticklet.core.model.User
import com.sticklet.core.repository.base.BaseRepo

public interface SettingRepo extends BaseRepo<Setting, String> {
    public List<Setting> findAllByUser(@Param("user") User user)
    public List<Setting> findAllByInitial(@Param("initial") boolean initial)
    public Setting findByNameAndInitial(@Param("name") String name, @Param("initial") boolean initial)
    public Setting findByUserAndName(@Param("user") User user, @Param("name") String name)
}
