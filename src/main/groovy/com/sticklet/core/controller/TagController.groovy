package com.sticklet.core.controller

import javax.servlet.http.HttpServletResponse

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody

import com.sticklet.core.constant.SocketTopics
import com.sticklet.core.controller.base.BaseController
import com.sticklet.core.model.Note
import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.service.NoteService
import com.sticklet.core.service.TagService

@Controller
class TagController extends BaseController {
    @Autowired
    private TagService tagServ
    @Autowired
    private NoteService noteServ

    @RequestMapping(value="/tag/archive/{tagID}", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def archiveTaggedNotes(@PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        if (tag) {
            List<Note> notes = tagServ.archiveNotesByTag(tag)
            notes.each {
                socketServ.sendToUser(user, SocketTopics.NOTE_UPDATE, it)
            }
        }
        emptyJson()
    }

    @RequestMapping(value="/tag/delete/{tagID}", method=RequestMethod.DELETE, produces="application/json")
    public @ResponseBody def deleteTaggedNotes(@PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        if (tag) {
            List<Note> notes = tagServ.deleteNotesByTag(tag)
            notes.each {
                socketServ.sendToUser(user, SocketTopics.NOTE_DELETE, it.id)
            }
        }
        emptyJson()
    }

    @RequestMapping(value="/untag/{noteID}/{tagID}", method=RequestMethod.DELETE, produces="application/json")
    public @ResponseBody def untagNote(@PathVariable("noteID") String noteID, @PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        Note note = noteServ.getNote(noteID, user, resp)
        if (note && tag) {
            note = noteServ.untagNote(note, tag)
            socketServ.sendToUser(user, SocketTopics.NOTE_UPDATE, note)
        }
        emptyJson()
    }

    @RequestMapping(value="/tag/{noteID}/{tagID}", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def tagNote(@PathVariable("noteID") String noteID, @PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        Note note = noteServ.getNote(noteID, user, resp)
        if (note && tag) {
            note = noteServ.tagNote(note, tag)
            socketServ.sendToUser(user, SocketTopics.NOTE_UPDATE, note)
        }
        emptyJson()
    }

    @RequestMapping(value="/tag/{tagID}", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def tagNotes(@RequestBody List<String> noteIDs, @PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        List<Note> notes = noteServ.getNotesByIds(user, noteIDs, resp)
        if (notes && tag) {
            notes.each { Note note ->
                note = noteServ.tagNote(note, tag)
                socketServ.sendToUser(user, SocketTopics.NOTE_UPDATE, note)
            }
        }
        emptyJson()
    }

    @RequestMapping(value="/untag/{tagID}", method=RequestMethod.PUT, produces="application/json")
    public @ResponseBody def untagNotes(@RequestBody List<String> noteIDs, @PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        List<Note> notes = noteServ.getNotesByIds(user, noteIDs, resp)
        if (notes && tag) {
            notes.each { Note note ->
                note = noteServ.untagNote(note, tag)
                socketServ.sendToUser(user, SocketTopics.NOTE_UPDATE, note)
            }
        }
        emptyJson()
    }

    @RequestMapping(value="/tags", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getTags(@RequestParam(value="noteCount", required=false) boolean noteCount, HttpServletResponse resp) {
        if (noteCount) {
            return tagServ.getTagsAndCountsByUser(curUser())
        }
        tagServ.getTagsByUser(curUser())
    }

    @RequestMapping(value="/tag/{tagID}", method=RequestMethod.GET, produces="application/json")
    public @ResponseBody def getTag(@PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        tag
    }

    @RequestMapping(value="/tag", method=RequestMethod.POST, produces="application/json")
    public @ResponseBody def createTag(@RequestBody Map data, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.createTag(user, data.name)
        if (tag) {
            socketServ.sendToUser(user, SocketTopics.TAG_CREATE, tag)
            return tag
        } else {
            statusServ.setStatusBadRequest(resp)
        }
        emptyJson()
    }

    @RequestMapping(value="/tag/{tagID}", method=RequestMethod.DELETE, produces="application/json")
    public @ResponseBody def deleteTag(@PathVariable("tagID") String tagID, HttpServletResponse resp) {
        User user = curUser()
        Tag tag = tagServ.getTag(tagID, user, resp)
        if (tag) {
            tagServ.deleteTag(tag)
            socketServ.sendToUser(user, SocketTopics.TAG_DELETE, tag.id)
        }
        emptyJson()
    }
}
