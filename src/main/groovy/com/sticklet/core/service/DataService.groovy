package com.sticklet.core.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile

import com.sticklet.core.exception.ImportNotSupportedException
import com.sticklet.core.model.Note
import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.util.EvernoteImportUtil
import com.sticklet.core.util.ExportUtil

@Service
class DataService {
    private static final Logger logger = LoggerFactory.getLogger(DataService.class)

    @Autowired
    ExportUtil exportUtil
    @Autowired
    EvernoteImportUtil evernoteUtil
    @Autowired
    private NoteService noteServ
    @Autowired
    private TagService tagServ

    public File exportXML(User user) {
        return exportUtil.getXMLFile(user)
    }
    
    public String exportJson(User user) {
        exportUtil.getJson(user)
    }

    public void importEvernote(User user, MultipartFile file) {
        logger.debug "importing evernote file"
        List<Map> nodes = evernoteUtil.readEnexFile(file)
        List<Note> notes = nodes.collect {
            Note note = new Note([
                "user": user,
                "title": noteServ.trimTitle(it.title),
                "content": it.content,
                "created": it.created,
                "updated": it.updated,
                "tags": it.tags.collect {
                    Tag tag = tagServ.findTag(user, it)
                    if (!tag) {
                        tag = tagServ.createTag(user, it)
                    }
                    tag
                }
            ])
            note = noteServ.save(note)
            note.created = it.created
            note.updated = it.updaetd
            noteServ.save(note)
        }
    }

    public void importKeep(User user, MultipartFile file) {
        //TODO: implement
        throw new ImportNotSupportedException()
    }

    public void importOneNote(User user, MultipartFile file) {
        //TODO: implement
        throw new ImportNotSupportedException()
    }
}