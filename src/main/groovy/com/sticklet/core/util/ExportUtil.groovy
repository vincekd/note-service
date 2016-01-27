package com.sticklet.core.util

import javax.xml.stream.XMLInputFactory
import javax.xml.stream.XMLOutputFactory
import javax.xml.stream.XMLStreamWriter

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

import com.fasterxml.jackson.dataformat.xml.XmlMapper
import com.sticklet.core.model.Note
import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.repository.NoteRepo

@Service
class ExportUtil {

    @Autowired
    NoteRepo noteRepo
    
    public String getJson(User user) {
        //TODO: implement
        ""
    }

    public File getXMLFile(User user) {
        XMLOutputFactory outputFact = XMLOutputFactory.newFactory()
        XMLInputFactory inputFact = XMLInputFactory.newFactory()

        File xmlFile = File.createTempFile("export-" + user.id, ".xml")
        FileOutputStream xml = new FileOutputStream(xmlFile)
        XMLStreamWriter sw= outputFact.createXMLStreamWriter(xml, "UTF-8")
        XmlMapper mapper= new XmlMapper(inputFact)

        List<Note> notes = noteRepo.findAllByUser(user)

        Closure writeProp = { name, val ->
            sw.writeStartElement(name)
            //mapper.writeValue(sw, val)
            sw.writeCharacters(val ? val.toString() : "")
            sw.writeEndElement()
        }
        sw.writeStartDocument("UTF-8", "1.0")
        sw.writeStartElement("notes")

        notes.each { Note n ->
            sw.writeStartElement("note")

            writeProp("created", n.created)
            writeProp("updated", n.updated)
            writeProp("title", n.title)
            writeProp("content", n.content)
            writeProp("color", n.color)
            writeProp("archived", n.archived)
            writeProp("deleted", n.deleted)
            writeProp("titleEdited", n.titleEdited)
            writeProp("contentEdited", n.contentEdited)

            sw.writeStartElement("tags")
            n.tags.each { Tag t ->
                writeProp("tag", t.name)
            }
            sw.writeEndElement()
            
            sw.writeStartElement("position")
            if (n.position) { 
                writeProp("x", n.position.x)
                writeProp("y", n.position.y)
                writeProp("z", n.position.z)
                writeProp("height", n.position.height)
                writeProp("width", n.position.width)
            }
            sw.writeEndElement()

            sw.writeEndElement()
        }

        sw.writeEndElement()
        sw.writeEndDocument()
        sw.flush()
        sw.close()

        xmlFile
    }
}