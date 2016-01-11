package com.sticklet.core.controller

import javax.servlet.http.HttpServletResponse

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.ResponseBody

import com.sticklet.AppConfig
import com.sticklet.core.constant.SocketTopics
import com.sticklet.core.controller.base.BaseController
import com.sticklet.core.model.Note
import com.sticklet.core.model.User
import com.sticklet.core.service.NoteService

@Controller
class NoteController extends BaseController {
    @Autowired NoteService noteServ

    @RequestMapping(value="/colors", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getColors(HttpServletResponse resp) {
        AppConfig.colors
    }

    @RequestMapping(value="/notes", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getNotes(HttpServletResponse resp) {
        noteServ.getNotes(curUser())
    }

    @RequestMapping(value="/note/{noteID}", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getNote(@PathVariable("noteID") String noteID, HttpServletResponse resp) {
        User user = curUser()
        Note note = noteServ.getNote(noteID, user, resp)
        note
    }

    @RequestMapping(value="/note", method=RequestMethod.POST, produces="application/json")
    public @ResponseBody def createNote(HttpServletResponse resp) {
        User user = curUser()
        Note note = noteServ.createNote(user)
        if (note) {
            socketServ.sendToUser(user, SocketTopics.NOTE_CREATE, note)
            return note
        }
        emptyJson()
    }

    @RequestMapping(value="/note/{noteID}", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def updateNote(@PathVariable("noteID") String noteID, @RequestBody Map params, HttpServletResponse resp) {
        User user = curUser()
        Note note = noteServ.getNote(noteID, user, resp)
        if (note) {
            note = noteServ.updateNote(note, params)
            socketServ.sendToUser(user, SocketTopics.NOTE_UPDATE, note)
        }
        emptyJson()
    }

    @RequestMapping(value="/note/archive/{noteID}", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def archiveNote(@PathVariable("noteID") String noteID, HttpServletResponse resp) {
        User user = curUser()
        Note note = noteServ.getNote(noteID, user, resp)
        if (note) {
            note = noteServ.archiveNote(note)
            socketServ.sendToUser(user, SocketTopics.NOTE_UPDATE, note)
        }
        emptyJson()
    }

    @RequestMapping(value="/note/{noteID}", method=RequestMethod.DELETE, produces="application/json")
    public @ResponseBody def deleteNote(@PathVariable("noteID") String noteID, HttpServletResponse resp) {
        User user = curUser()
        Note note = noteServ.getNote(noteID, user, resp)
        if (note) {
            noteServ.deleteNote(note)
            socketServ.sendToUser(user, SocketTopics.NOTE_DELETE, note.id)
        }
        emptyJson()
    }
}