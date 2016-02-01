package com.sticklet.core.repository

import org.springframework.data.repository.query.Param

import com.sticklet.core.model.ActivityLog
import com.sticklet.core.repository.base.BaseRepo

public interface ActivityLogRepo extends BaseRepo<ActivityLog, String> {
    public List<ActivityLog> findAllByUsername(@Param("username") String username)
}
