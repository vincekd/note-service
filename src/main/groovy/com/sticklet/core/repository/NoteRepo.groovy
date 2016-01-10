package com.sticklet.core.repository

import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Note
import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.repository.base.BaseRepo

public interface NoteRepo extends BaseRepo<Note, String> {
    public List<Note> findAllByUser(@Param("user") User user)
    public List<Note> findAllByTags(@Param("tag") Tag tag)
}