package com.sticklet.core.service

import java.lang.reflect.Field
import java.lang.reflect.ParameterizedType
import java.lang.reflect.Type

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.mongodb.core.MongoOperations
import org.springframework.data.mongodb.core.mapping.DBRef
import org.springframework.stereotype.Service

import com.sticklet.core.model.Note
import com.sticklet.core.model.NoteVersion
import com.sticklet.core.model.base.BaseModel
import com.sticklet.core.repository.NoteVersionRepo

@Service
class NoteVersionService {
    private static final Logger logger = LoggerFactory.getLogger(NoteVersionService.class)

    @Autowired
    private NoteVersionRepo repo

    @Autowired
    private MongoOperations operations

    public NoteVersion saveNewVersion(Note note) {
        if (note.id) {
            NoteVersion version = new NoteVersion([
                "note": note,
                "noteVersion": note.version,
                "diff": getDiff(note)
            ])
            if (version.diff) {
                repo.save(version)
            }
        }
    }

    private Map<String, Object> getDiff(Note note) {
        Note oldNote = operations.findById(note.id, Note.class)
        Map diff = null
        if (oldNote) {
            diff = [:]
            note.class.fields.each { Field f ->
                if (!f.isSynthetic()) {
                    if (f.isAnnotationPresent(DBRef.class)) {
                        Type type = f.genericType
                        if (type instanceof ParameterizedType) {
                            ParameterizedType pType = (ParameterizedType) type
                            if (pType.rawType == List) {
                                //!note[f.name].every { model -> oldNote[f.name].any { it.id == model.id } } || 
                                //!oldNote[f.name].every { model -> oldNote[f.name].any { it.id == model.id } }
                                if (note[f.name].size() != oldNote[f.name].size() || !note[f.name].every { m -> 
                                    oldNote[f.name].any { it.id == m.id }
                                }) {
                                    diff[f.name] = oldNote[f.name].collect {
                                        it.id
                                    }
                                }
                                return
                            }
                        }
                        if (note[f.name]?.id != oldNote[f.name]?.id) {
                            diff[f.name] = oldNote[f.name]?.id 
                        }
                    } else if (note[f.name] != oldNote[f.name]) {
                        diff[f.name] = oldNote[f.name]
                    }
                }
            }
        }
        logger.debug "diff out: $diff"
        diff
    }

    public Note recomposeVersion(Note note, Long version) {
        //TODO: finish this when we have an interface interface
        List<NoteVersion> versions = repo.findAllByNote(note).sort {
            it.noteVersion
        }.reverse()
        versions.each {
            it.diff.each { String fieldName, def val ->
                //(if dbref (if list) else set)
                //note[fieldName] = val
            }
        }
        note
    }
}
