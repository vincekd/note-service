package com.sticklet.core.service

import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

import com.sticklet.core.constant.StickletConsts
import com.sticklet.core.model.Note
import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.repository.NoteRepo

@Service
class NoteService {
    private static final Logger logger = LoggerFactory.getLogger(NoteService.class)

    @Autowired NoteRepo noteRepo
    @Autowired ResponseStatusService statusServ

    public Note untagNote(Note note, Tag tag) {
        note.tags = note.tags.findAll {
            it.id != tag.id
        }
        noteRepo.save(note)
    }

    public Note tagNote(Note note, Tag tag) {
        if (!note.tags.any { it.id == tag.id }) {
            note.tags << tag
            note = noteRepo.save(note)
        }
        note
    }

    public List<Note> getNotes(User user) {
        noteRepo.findAllByUserAndArchivedAndDeleted(user, false, null)
    }
    public List<Note> getArchive(User user) {
        noteRepo.findAllByUserAndArchivedAndDeleted(user, true, null)
    }
    public List<Note> getTrash(User user) {
        def o = noteRepo.findAllByUserAndDeletedIsNotNull(user)
        logger.debug "trash: $o"
        o
    }

    public List<Note> getDeletable() {
        Long lessThan = (new Date()).getTime() - StickletConsts.EMPTY_TRASH_AFTER
        noteRepo.findAllByDeletedLessThan(lessThan)
    }

    public Note createNote(User user) {
        Note note = new Note(["user": user, "title": "Note", "content": ""])
        noteRepo.save(note)
    }

    public Note save(Note note) {
        noteRepo.save(note)
    }

    public Note getNote(String noteID, User user, HttpServletResponse resp) {
        Note note = noteRepo.findOne(noteID)
        if (note) {
            if (userHasAccess(note, user)) {
                return note
            } else {
                statusServ.setStatusUnauthorized(resp)
            }
        } else {
            statusServ.setStatusNotFound(resp)
        }
        return null
    }

    public Note updateNote(Note note, Map params) {
        params.each { String key, val ->
            if (note.hasProperty(key) && key != "id") {
                note[key] = val
            }
        }
        noteRepo.save(note)
    }

    public Note archiveNote(Note note) {
        note.archived = true
        noteRepo.save(note)
    }

    public Note unarchiveNote(Note note) {
        note.archived = false
        noteRepo.save(note)
    }

    public void deleteNote(Note note, boolean hard) {
        if (StickletConsts.USE_TRASH && !hard) {
            note.deleted = (new Date()).getTime()
            noteRepo.save(note)
        } else {
            noteRepo.delete(note)
        }
    }

    public Note restoreNote(Note note) {
        note.deleted = null
        noteRepo.save(note)
    }

    public void deleteNote(Note note) {
        deleteNote(note, false)
    }

    public static boolean userHasAccess(Note note, User user) {
        note && user && note.user.id == user.id
    }

    public static String trimTitle(String title) {
        if (title && title.length() > StickletConsts.MAX_TITLE_LENGTH) {
            return title.substring(0, StickletConsts.MAX_TITLE_LENGTH)
        }
        title
    }
}
