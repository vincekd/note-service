package com.sticklet.core.repository.impl

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.mongodb.core.MongoOperations

import com.sticklet.core.model.Note
import com.sticklet.core.repository.custom.CustomNoteRepo;
import com.sticklet.core.service.NoteVersionService


class NoteRepoImpl implements CustomNoteRepo {
    private static final Logger logger = LoggerFactory.getLogger(NoteRepoImpl.class)
    private final MongoOperations operations

    @Autowired
    public NoteVersionService versionServ

    @Autowired
    public NoteRepoImpl(MongoOperations operations) {
        this.operations = operations
    }

    public Note save(Note note) {
        versionServ.saveNewVersion(note)
        operations.save(note)
        note
    }
}
