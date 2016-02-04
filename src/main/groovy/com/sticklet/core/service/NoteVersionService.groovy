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

import com.google.common.collect.ImmutableList
import com.sticklet.core.model.Note
import com.sticklet.core.model.NoteVersion
import com.sticklet.core.repository.NoteVersionRepo

@Service
class NoteVersionService {
    private static final Logger logger = LoggerFactory.getLogger(NoteVersionService.class)

    //disallow everything except title, color, and content
    private static final ImmutableList<String> fields = ImmutableList.of("content", "title", "color")

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
                if (!f.isSynthetic() && fields.contains(f.name)) {
                    if (f.isAnnotationPresent(DBRef.class)) {
                        Type type = f.genericType
                        if (type instanceof ParameterizedType) {
                            ParameterizedType pType = (ParameterizedType) type
                            if (pType.rawType == List) {
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
        diff
    }

    private Map<String, Object> noteToMap(Note note) {
        Map noteMap = [:]
        note.class.fields.each { Field f ->
            if (!f.isSynthetic() && fields.contains(f.name)) {
                noteMap[f.name] = note[f.name]
                if (f.isAnnotationPresent(DBRef.class)) {
                    Type type = f.genericType
                    if (type instanceof ParameterizedType) {
                        ParameterizedType pType = (ParameterizedType) type
                        if (pType.rawType == List) {
                            noteMap[f.name]= note[f.name].collect {
                                it.id
                            }
                            return
                        }
                    }
                    noteMap[f.name]= note[f.name].id
                } else {
                    noteMap[f.name] = note[f.name]
                }
            }
        }
        noteMap
    }

    public Note revertNote(Note note, Long version) {
        List<NoteVersion> versions = getVersions(note)
        if (versions.size()) {
            int ind = versions.findIndexOf { it.noteVersion == version }
            versions = versions.subList(0, ind + 1)
            List<Map<String, Object>> vers = walkBackVersions(note, versions)
            Map v = vers.last()

            //only update these three for right now
            note.title = v.title
            note.content = v.content
            note.color = v.color
        }
        note
    }

    private List<Map<String, Object>> walkBackVersions(Note note, List<NoteVersion> versions) {
        List<Map<String, Object>> out = []
        Map noteMap = noteToMap(note)
        versions.collect {
            Map cur = new HashMap(noteMap)
            if (out.size()) {
                cur = cur + out.last()
            }
            it.diff.each { String key, def val ->
                cur[key] = val
            }
            cur.noteVersion = it.noteVersion
            out << cur
        }
        out
    }

    public List<Map<String, Object>> getFullVersions(Note note) {
        List<NoteVersion> versions = getVersions(note)
        walkBackVersions(note, versions)
    }

    public List<NoteVersion> getVersions(Note note) {
        repo.findAllByNote(note).sort {
            it.noteVersion
        }.reverse()
    }
}
