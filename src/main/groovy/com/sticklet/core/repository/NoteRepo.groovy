package com.sticklet.core.repository

import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.repository.query.Param

import com.sticklet.core.model.Note
import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.repository.base.BaseRepo
import com.sticklet.core.repository.custom.CustomNoteRepo

public interface NoteRepo extends BaseRepo<Note, String>, CustomNoteRepo {
    public List<Note> findAllByUser(@Param("user") User user)
    public List<Note> findAllByUserAndArchived(@Param("user") User user, @Param("archived") boolean archived)
    public List<Note> findAllByTags(@Param("tag") Tag tag)
    public List<Note> findAllByDeletedLessThan(@Param("deleted") Long lessThan)
    public List<Note> findAllByUserAndDeletedIsNotNull(@Param("user") User user)

    @Cacheable(value="user-notes", keyGenerator="noteKeyGenerator")
    public List<Note> findAllByUserAndArchivedAndDeleted(@Param("user") User user, @Param("archived") boolean archived, @Param("deleted") Long deleted)

    @CacheEvict(value="user-notes", allEntries=true)
    public Note save(Note note)

    @CacheEvict(value="user-notes", allEntries=true)
    public Iterable<Note> save(Iterable<Note> notes)

    @CacheEvict(value="user-notes", allEntries=true)
    public void delete(Iterable<Note> notes)

    @CacheEvict(value="user-notes", allEntries=true)
    public void delete(Note note)
}
