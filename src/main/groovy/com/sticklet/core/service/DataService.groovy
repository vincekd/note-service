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
import com.sticklet.core.util.XmlUtil

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

    public void deleteAccount(User user) {
        //TODO: delete notes, tags, user preferences, settings, user, activity log
    }

    public File exportXML(User user) {
        return exportUtil.getXMLFile(user)
    }

    public String exportJson(User user) {
        exportUtil.getJson(user)
    }

    public void importEvernote(User user, MultipartFile file) {
        List<Map> nodes = evernoteUtil.readEnexFile(file)
        List<Note> notes = nodes.collect {
            Note note = new Note([
                "user": user,
                "title": noteServ.trimTitle(it.title),
                "content": it.content,
                "created": it.created,
                "updated": it.updated,
                "tags": getTags(it.tags, user)
            ])
            note = noteServ.save(note)
            note.created = it.created
            note.updated = it.updaetd
            noteServ.save(note)
        }
    }

    public void importSticklet(User user, MultipartFile file) {
        XmlParser parser = XmlUtil.makeXmlParser()
        Node base = parser.parse(file.inputStream)
        List<Map> xmlNotes = base.children().collect { Node note ->
            Node pos = note.get("position")[0]
            Map n = [
                "created": nodeValue(note, "created")?.toLong(),
                "updated": nodeValue(note, "updated")?.toLong(),
                "title": nodeValue(note, "title"),
                "content": nodeValue(note, "content"),
                "color": nodeValue(note, "color"),
                "archived": nodeValue(note, "archived") == "true",
                "deleted": nodeValue(note, "deleted")?.toLong(),
                "titleEdited": nodeValue(note, "titleEdited") == "true",
                "contentEdited": nodeValue(note, "contentEdited") == "true",
                "tags": note.get("tags")[0].get("tag").collect { Node tag ->
                    tag.text()
                }.findAll { it },
                "position": [
                    "x": nodeValue(pos, "x")?.toInteger(),
                    "y": nodeValue(pos, "y")?.toInteger(),
                    "z": nodeValue(pos, "z")?.toInteger(),
                    "height": nodeValue(pos, "height")?.toInteger(),
                    "width": nodeValue(pos, "width")?.toInteger()
                ]
            ]
            n
        }

        xmlNotes.each {
            List<String> tags = it.tags
            it.tags = null

            Note note = new Note(it)
            note.user = user
            note.tags = getTags(tags, user)

            note = noteServ.save(note)
            note.created = it.created
            note.updated = it.updaetd
            noteServ.save(note)
        }
    }

    public void importOneNote(User user, MultipartFile file) {
        //TODO: implement
        throw new ImportNotSupportedException()
    }

    public void importKeep(User user, MultipartFile file) {
        //TODO: implement
        throw new ImportNotSupportedException()
    }

    private List<Tag> getTags(List<String> tags, User user) {
        tags.collect {
            String name = tagServ.trimName(it)
            Tag tag = tagServ.findTag(user, name)
            if (!tag) {
                tag = tagServ.createTag(user, name)
            }
            tag
        }
    }

    private static def nodeValue(Node node, name) {
        def val = XmlUtil.getNodeValue(node, name)
        (val ? val : null)
    }
}
