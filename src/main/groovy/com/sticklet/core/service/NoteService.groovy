package com.sticklet.core.service

import javax.annotation.PostConstruct
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
import com.sticklet.core.repository.TagRepo

@Service
class NoteService {
    private static final Logger logger = LoggerFactory.getLogger(NoteService.class)
    private static final List<String> userUpdatableProps = ["title", "content", "color"]

    @Autowired
    private NoteRepo noteRepo

    @Autowired
    private ResponseStatusService statusServ

    @Autowired
    private SettingsService settingsServ

    @Autowired
    private TagRepo tagRepo

    private int maxLength
    private String offlineName

    @PostConstruct
    public void init() {
        maxLength = (settingsServ.get("note.maxTitleLength") ?: StickletConsts.MAX_TITLE_LENGTH)
        offlineName = (settingsServ.get("note.offline.baseName") ?: "stklt-note-id-")
    }

    public void deleteAll(User user) {
        List<Note> userNotes = noteRepo.findAllByUser(user)
        noteRepo.delete(userNotes)
    }

    public boolean syncOfflineNotes(Map noteData, User user, HttpServletResponse resp) {
        List<Map<String, Object>> saveOpts = []
        boolean run = noteData.every { String id, def data ->
            boolean isCreated = isOfflineNoteID(id)
            Map<String, Object> opts = [:]
            Note note

            if (isCreated) {
                note = new Note(["user": user])
                opts.save = true
            } else {
                note = getNote(id, user, resp)
                if (!note) {
                    //no access
                    return false
                }
            }

            if (data.update) {
                note.content = data.update.content
                note.title = data.update.title
                note.color = data.update.color
                if (note.title) {
                    note.titleEdited = true
                }
                updatePosition(note, data.update.position)
                opts.save = true
            }

            if (data.delete) {
                opts.delete = true
            }
            if (data.archive) {
                opts.archive = true
            }

            if (data.tag) {
                data.tag.each { String tagID, boolean tagged ->
                    Tag tag = tagRepo.findOne(tagID)
                    //ensure user has access to the tag, if not, uh oh
                    if (TagService.userHasAccess(tag, user)) {
                        if (tagged) {
                            if (canAddTag(note, tag)) {
                                note.tags << tag
                            }
                        } else {
                            note.tags = removeTag(note, tag)
                        }
                        opts.save = true
                    }
                }
            }

            opts.note = note
            saveOpts << opts

            true
        }

        if (run) {
            saveOpts.each {
                Note note = it.note
                if (it.save) {
                    note = save(note)
                }
                if (it.archive) {
                    note = archiveNote(note)
                }
                if (it.delete) {
                    note = deleteNote(note)
                }
            }
        }
        true
    }

    public Note untagNote(Note note, Tag tag) {
        note.tags = removeTag(note, tag)
        noteRepo.save(note)
    }

    public Note tagNote(Note note, Tag tag) {
        if (canAddTag(note, tag)) {
            note.tags << tag
            note = noteRepo.save(note)
        }
        note
    }

    public List<Tag> removeTag(Note note, Tag tag) {
        note.tags.findAll {
            it.id != tag.id
        }
    }

    public boolean canAddTag(Note note, Tag tag) {
        !note.tags.any { it.id == tag.id }
    }

    public List<Note> getNotes(User user) {
        noteRepo.findAllByUserAndArchivedAndDeleted(user, false, null)
    }
    public List<Note> getNotesByIds(User user, List<String> ids, HttpServletResponse resp) {
        List<Note> notes = noteRepo.findAll(ids)
        boolean notAccessible = notes.any { Note note ->
            !response(note, user, resp)
        }
        if (!notAccessible) {
            return notes
        }
        return null
    }
    public List<Note> getArchive(User user) {
        noteRepo.findAllByUserAndArchivedAndDeleted(user, true, null)
    }
    public List<Note> getTrash(User user) {
        noteRepo.findAllByUserAndDeletedIsNotNull(user)
    }

    public List<Note> getDeletable() {
        Long emptyTrashAfter = (settingsServ.get("note.trash.daysBeforeEmpty") ?: StickletConsts.EMPTY_TRASH_AFTER)
        emptyTrashAfter *= (1000L * 86400L)
        Long lessThan = (new Date()).getTime() - emptyTrashAfter
        noteRepo.findAllByDeletedLessThan(lessThan)
    }

    public Note createNote(User user, Map<String, Object> data) {
        data = data ?: [:]
        Note note = new Note([
            "user": user,
            "title": data.title ?: "",
            "color": data.color ?: "",
            "tags": getTags(data.tags),
            "content": ""
        ])
        noteRepo.save(note)
    }

    public List<Tag> getTags(List<String> tags) {
        tags.collect {
            tagRepo.findOne(it)
        }.findAll { it }
    }

    public Note save(Note note) {
        noteRepo.save(note)
    }

    public Note getNote(String noteID, User user, HttpServletResponse resp) {
        Note note = noteRepo.findOne(noteID)
        if (response(note, user, resp)) {
            return note
        }
        null
    }

    public boolean response(Note note, User user, HttpServletResponse resp) {
        if (note) {
            if (userHasAccess(note, user)) {
                return true
            } else {
                statusServ.setStatusUnauthorized(resp)
            }
        } else {
            statusServ.setStatusNotFound(resp)
        }
        return false
    }

    public Note updateNote(Note note, Map params) {
        if (params.title && params.title != note.title) {
            note.titleEdited = true
            params.title = trimTitle(params.title)
        }
        params.each { String key, def val ->
            if (note.hasProperty(key) && userUpdatableProps.contains(key)) {
                note[key] = val
            }
        }
        updatePosition(note, params.position)
        noteRepo.save(note)
    }

    public void updatePosition(Note note, Map<String, Integer> position) {
        if (position) {
            note.position.x = position.x
            note.position.y = position.y
            note.position.z = position.z
            note.position.height = position.height
            note.position.width = position.width
        }
    }

    public Note archiveNote(Note note) {
        note.archived = true
        noteRepo.save(note)
    }

    public Note unarchiveNote(Note note) {
        note.archived = false
        noteRepo.save(note)
    }

    public void deleteNote(Note note) {
        deleteNote(note, false)
    }
    public void deleteNote(Note note, boolean hard) {
        boolean useTrash = settingsServ.get("note.trash.enabled")
        if (useTrash && !hard) {
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

    public static boolean userHasAccess(Note note, User user) {
        note && user && note.user.id == user.id
    }

    public String trimTitle(String title) {

        if (title && title.length() > maxLength) {
            return title.substring(0, maxLength)
        }
        title
    }

    public boolean isOfflineNoteID(String id) {
        (id =~ ("^" + offlineName))
    }
}
