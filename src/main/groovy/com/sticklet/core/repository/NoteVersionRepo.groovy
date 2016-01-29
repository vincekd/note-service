package com.sticklet.core.repository

import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Note
import com.sticklet.core.model.NoteVersion
import com.sticklet.core.repository.base.BaseRepo

interface NoteVersionRepo extends BaseRepo<NoteVersion, String> {
    public List<NoteVersion> findAllByNote(@Param("note") Note note)
}
