package com.sticklet.core.service

import javax.servlet.http.HttpServletResponse

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

import com.sticklet.core.exception.NotAuthorizedException
import com.sticklet.core.model.Note
import com.sticklet.core.model.User
import com.sticklet.core.repository.NoteRepo

@Service
class NoteService {

    @Autowired NoteRepo noteRepo
    @Autowired ResponseStatusService statusServ

    public List<Note> getNotesByUser(User user) {
        noteRepo.findAllByUser(user)
    }

    public Note createNote(User user) {
        Note note = new Note(["user": user, "title": "Note", "content": ""])
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

    public void deleteNote(Note note) {
        noteRepo.delete(note)
    }

    public static boolean userHasAccess(Note note, User user) {
        note && user && note.user.id == user.id
    }
}
