package com.sticklet.core.repository

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.mongodb.core.MongoOperations


class NoteRepoImpl implements CustomNoteRepo {
    private final MongoOperations operations

    @Autowired
    public NoteRepoImpl(MongoOperations operations) {
        this.operations = operations
        println "loading note repo impl"
    }
}
