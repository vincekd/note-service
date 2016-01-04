package com.sticklet.core.repository

import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Note
import com.sticklet.core.model.User

public interface NoteRepo extends PagingAndSortingRepository<Note, String> {
    public List<Note> findAllByUser(@Param("user") User user)
}
